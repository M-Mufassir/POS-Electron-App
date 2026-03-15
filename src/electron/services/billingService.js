import {
  beginTransaction,
  commitTransaction,
  getQuery,
  rollbackTransaction,
} from "../repositories/dbUtils.js"
import {
  deleteAllBills as deleteAllBillsRepo,
  deleteBillById,
  deleteBillItemsByBillId,
  insertBill,
  insertBillItem,
  markBillInventoryApplied,
  selectAllBills,
  selectBarcodeDetails,
  selectBillById,
  selectBillInventoryApplied,
  selectBillItemsByBillId,
  selectOpenBillsSummary,
  selectProductPricing,
  selectUnitMultiplier,
  updateBillById,
  updateBillStatus,
  updateProductStock,
} from "../repositories/billingRepository.js"

const normalizeDiscountType = (value) => {
  const normalized = String(value || "").trim().toUpperCase()
  if (normalized === "PERCENTAGE" || normalized === "AMOUNT") {
    return normalized
  }
  return null
}

const generateInvoiceNo = async () => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "")
  const row = await getQuery(
    `SELECT COUNT(*) AS count FROM bills WHERE date(created_at) = date('now')`,
  )
  const sequence = Number(row?.count || 0) + 1
  return `INV-${datePart}-${String(sequence).padStart(4, "0")}`
}

const getUnitMultiplier = async (productId, unitId, baseUnitId) => {
  if (Number(unitId) === Number(baseUnitId)) {
    return 1
  }

  const row = await selectUnitMultiplier(productId, unitId)
  const parsed = Number(row?.conversion_multiplier)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

const computeLineItem = async (item) => {
  const productId = Number(item?.product_id)
  const unitId = Number(item?.unit_id)
  const barcodeId = item?.barcode_id ? Number(item.barcode_id) : null
  const quantity = Math.max(0, Number(item?.quantity || 0))

  if (!Number.isFinite(productId) || productId <= 0) {
    throw new Error("Invalid product in bill item")
  }
  if (!Number.isFinite(unitId) || unitId <= 0) {
    throw new Error("Invalid unit in bill item")
  }
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error("Quantity must be greater than 0")
  }

  const product = await selectProductPricing(productId)
  if (!product) {
    throw new Error("Product not found")
  }

  const multiplier = await getUnitMultiplier(productId, unitId, product.base_unit_id)
  const basePrice = Number(product.base_price || 0)
  const unitPrice = basePrice * multiplier
  const lineSubtotal = unitPrice * quantity

  return {
    product_id: productId,
    unit_id: unitId,
    barcode_id: barcodeId,
    quantity,
    unit_price: unitPrice,
    subtotal: lineSubtotal,
    base_quantity: quantity * multiplier,
  }
}

export async function createBill(input = {}) {
  const customerName = String(input?.customer_name || "").trim()
  const invoiceNo = await generateInvoiceNo()

  const result = await insertBill(invoiceNo, customerName)

  return {
    id: result.lastID,
    invoice_no: invoiceNo,
    customer_name: customerName,
    status: "OPEN",
  }
}

export async function getBillById(id) {
  const parsedId = Number(id)
  if (!Number.isFinite(parsedId) || parsedId <= 0) {
    throw new Error("Invalid bill id")
  }

  const bill = await selectBillById(parsedId)
  if (!bill) return null

  const items = await selectBillItemsByBillId(parsedId)

  return {
    ...bill,
    items,
  }
}

export async function getOpenBills() {
  return await selectOpenBillsSummary()
}

export async function getAllBills() {
  return await selectAllBills()
}

export async function resolveBarcode(barcodeValue) {
  const barcode = String(barcodeValue || "").trim()
  if (!barcode) {
    throw new Error("Barcode is required")
  }

  const barcodeRow = await selectBarcodeDetails(barcode)
  if (!barcodeRow) {
    return null
  }

  const multiplier = await getUnitMultiplier(
    barcodeRow.product_id,
    barcodeRow.unit_id,
    barcodeRow.base_unit_id,
  )
  const unitPrice = Number(barcodeRow.base_price || 0) * multiplier

  return {
    ...barcodeRow,
    multiplier,
    unit_price: unitPrice,
  }
}

export async function saveBill(input = {}) {
  const billId = Number(input?.id)

  if (!Number.isFinite(billId) || billId <= 0) {
    throw new Error("Invalid bill id")
  }

  const customerName = String(input?.customer_name || "").trim()
  const discountType = normalizeDiscountType(input?.discount_type)
  const discountValue = Math.max(0, Number(input?.discount_value || 0))
  const paidAmount = Math.max(0, Number(input?.paid_amount || 0))
  const rawItems = Array.isArray(input?.items) ? input.items : []

  const computedItems = []
  for (const item of rawItems) {
    const computed = await computeLineItem(item)
    computedItems.push(computed)
  }

  const subtotal = computedItems.reduce((sum, item) => sum + item.subtotal, 0)
  let discountAmount = 0

  if (discountType === "PERCENTAGE") {
    const percentage = Math.min(100, Math.max(0, discountValue))
    discountAmount = subtotal * (percentage / 100)
  } else if (discountType === "AMOUNT") {
    discountAmount = Math.min(subtotal, discountValue)
  }

  const totalAmount = Math.max(0, subtotal - discountAmount)
  const balanceAmount = Math.max(0, totalAmount - paidAmount)

  let status = "OPEN"
  if (totalAmount <= 0 || paidAmount >= totalAmount) {
    status = "PAID"
  } else if (paidAmount > 0 && paidAmount < totalAmount) {
    status = "PARTIAL"
  }

  const billRow = await selectBillInventoryApplied(billId)
  if (!billRow) {
    throw new Error("Bill not found")
  }

  const inventoryApplied = Number(billRow.inventory_applied) === 1

  try {
    await beginTransaction()

    await updateBillById(billId, {
      customer_name: customerName || null,
      status,
      subtotal,
      discount_type: discountType,
      discount_value: discountValue,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      balance_amount: balanceAmount,
    })

    await deleteBillItemsByBillId(billId)

    for (const item of computedItems) {
      await insertBillItem(billId, item)
    }

    if (!inventoryApplied && (status === "PARTIAL" || status === "PAID")) {
      for (const item of computedItems) {
        await updateProductStock(item.product_id, item.base_quantity)
      }
      await markBillInventoryApplied(billId)
    }

    await commitTransaction()

    return {
      id: billId,
      status,
      subtotal,
      discount_type: discountType,
      discount_value: discountValue,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      balance_amount: balanceAmount,
    }
  } catch (err) {
    try {
      await rollbackTransaction()
    } catch {
      // Ignore rollback failures
    }
    throw err
  }
}

export async function cancelBill(billId) {
  const parsedId = Number(billId)
  if (!Number.isFinite(parsedId) || parsedId <= 0) {
    throw new Error("Invalid bill id")
  }

  await updateBillStatus(parsedId, "CANCELLED")
  return { ok: true }
}

export async function deleteBill(billId) {
  const parsedId = Number(billId)
  if (!Number.isFinite(parsedId) || parsedId <= 0) {
    throw new Error("Invalid bill id")
  }

  await deleteBillById(parsedId)
  return { ok: true }
}

export async function deleteAllBills() {
  await deleteAllBillsRepo()
  return { ok: true }
}
