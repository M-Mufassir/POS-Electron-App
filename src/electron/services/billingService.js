import {
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
} from "../repositories/dbUtils.js"
import {
  deleteBillById,
  deleteBillItemsByBillId,
  insertBill,
  insertBillItem,
  insertPayment,
  markBillInventoryApplied,
  selectAllBills,
  selectBarcodeDetails,
  selectBillById,
  selectBillItemsByBillId,
  selectBillState,
  selectOpenBillsSummary,
  selectPaymentsByBillId,
  selectProductPricing,
  selectUnitMultiplier,
  updateBillById,
  updateBillStatus,
  updateProductStock,
} from "../repositories/billingRepository.js"
import { getSettings } from "./settingsService.js"

const PAYMENT_EPSILON = 0.01
const VALID_PAYMENT_METHODS = ["CASH", "CARD", "BANK", "ONLINE"]

const normalizePaymentMethod = (value) => {
  const normalized = String(value || "CASH").trim().toUpperCase()
  return VALID_PAYMENT_METHODS.includes(normalized) ? normalized : "CASH"
}

const normalizeDiscountType = (value) => {
  const normalized = String(value || "").trim().toUpperCase()
  if (normalized === "PERCENTAGE" || normalized === "AMOUNT") {
    return normalized
  }
  return null
}

const pad = (value, size = 2) => String(value).padStart(size, "0")

const generateInvoiceNo = () => {
  const now = new Date()
  const datePart = [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
  ].join("")
  const timePart = [
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
    pad(now.getMilliseconds(), 3),
  ].join("")
  const nonce = Math.floor(Math.random() * 900) + 100
  return `INV-${datePart}-${timePart}-${nonce}`
}

const getUnitMultiplier = async (productId, unitId, baseUnitId) => {
  if (Number(unitId) === Number(baseUnitId)) {
    return 1
  }

  const row = await selectUnitMultiplier(productId, unitId)
  const parsed = Number(row?.conversion_multiplier)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("Selected unit is not assigned to this product")
  }
  return parsed
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
    product_name: product.name,
    unit_id: unitId,
    barcode_id: barcodeId,
    quantity,
    unit_price: unitPrice,
    subtotal: lineSubtotal,
    base_quantity: quantity * multiplier,
    product_status: Number(product.status ?? 1),
    stock_base_qty: Math.max(0, Number(product.stock_base_qty || 0)),
  }
}

const buildItemSignature = (items = []) => {
  return items
    .map((item) => ({
      barcode_id: Number(item?.barcode_id || 0),
      product_id: Number(item?.product_id),
      quantity: Number(item?.quantity || 0),
      unit_id: Number(item?.unit_id),
    }))
    .sort((left, right) => {
      if (left.product_id !== right.product_id) return left.product_id - right.product_id
      if (left.unit_id !== right.unit_id) return left.unit_id - right.unit_id
      if (left.barcode_id !== right.barcode_id) return left.barcode_id - right.barcode_id
      return left.quantity - right.quantity
    })
}

const haveSameItems = (leftItems, rightItems) => {
  const left = buildItemSignature(leftItems)
  const right = buildItemSignature(rightItems)

  if (left.length !== right.length) {
    return false
  }

  return left.every((item, index) => {
    const candidate = right[index]
    return (
      item.product_id === candidate.product_id &&
      item.unit_id === candidate.unit_id &&
      item.barcode_id === candidate.barcode_id &&
      item.quantity === candidate.quantity
    )
  })
}

const assertProductsCanBeSold = (items) => {
  for (const item of items) {
    if (item.product_status !== 1) {
      throw new Error(`${item.product_name} is inactive and cannot be billed`)
    }
  }
}

const assertStockAvailability = async (items) => {
  const quantitiesByProduct = new Map()

  for (const item of items) {
    const existing = quantitiesByProduct.get(item.product_id)
    quantitiesByProduct.set(item.product_id, {
      product_name: item.product_name,
      available_stock: item.stock_base_qty,
      required_stock: Number(existing?.required_stock || 0) + Number(item.base_quantity || 0),
    })
  }

  for (const product of quantitiesByProduct.values()) {
    if (product.required_stock > product.available_stock) {
      throw new Error(
        `${product.product_name} does not have enough stock. Available: ${product.available_stock}, required: ${product.required_stock}.`,
      )
    }
  }
}

const applyInventoryAdjustments = async (items) => {
  const quantitiesByProduct = new Map()

  for (const item of items) {
    quantitiesByProduct.set(
      item.product_id,
      Number(quantitiesByProduct.get(item.product_id) || 0) + Number(item.base_quantity || 0),
    )
  }

  for (const [productId, quantity] of quantitiesByProduct.entries()) {
    const result = await updateProductStock(productId, quantity)
    if (result.changes === 0) {
      throw new Error("Inventory changed while saving the bill. Refresh and try again.")
    }
  }
}

export async function createBill(input = {}, actor = null) {
  const customerName = String(input?.customer_name || "").trim()
  const actorId = Number(actor?.id)
  const persistedUserId = Number.isFinite(actorId) && actorId > 0 ? actorId : null

  let result = null
  let invoiceNo = ""

  for (let attempt = 0; attempt < 5; attempt += 1) {
    invoiceNo = generateInvoiceNo()
    try {
      result = await insertBill(invoiceNo, customerName, persistedUserId)
      break
    } catch (error) {
      if (!String(error?.message || "").toLowerCase().includes("unique")) {
        throw error
      }
    }
  }

  if (!result) {
    throw new Error("Unable to generate a unique invoice number. Please try again.")
  }

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

export async function getPaymentsForBill(billId) {
  const parsedId = Number(billId)
  if (!Number.isFinite(parsedId) || parsedId <= 0) {
    throw new Error("Invalid bill id")
  }
  return await selectPaymentsByBillId(parsedId)
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
  if (Number(barcodeRow.product_status ?? 1) !== 1) {
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

  const settings = await getSettings()
  const taxRate = Math.min(100, Math.max(0, Number(settings.tax_rate) || 0))
  const taxableAmount = Math.max(0, subtotal - discountAmount)
  const taxAmount = taxableAmount * (taxRate / 100)

  const totalAmount = Math.max(0, taxableAmount + taxAmount)
  const balanceAmount = Math.max(0, totalAmount - paidAmount)

  const rawPayments = Array.isArray(input?.payments) ? input.payments : null

  let status = "OPEN"
  if (computedItems.length > 0) {
    if (totalAmount <= 0 || paidAmount >= totalAmount) {
      status = "PAID"
    } else if (paidAmount > 0 && paidAmount < totalAmount) {
      status = "PARTIAL"
    }
  }

  const billRow = await selectBillState(billId)
  if (!billRow) {
    throw new Error("Bill not found")
  }
  if (String(billRow.status || "").toUpperCase() === "CANCELLED") {
    throw new Error("Cancelled bills cannot be edited")
  }

  const inventoryApplied = Number(billRow.inventory_applied) === 1

  if (computedItems.length === 0 && paidAmount > 0) {
    throw new Error("Add at least one item before taking payment")
  }

  // A bill can be saved more than once as it's edited (Save, then later
  // Complete). Payment rows must only be inserted for money newly received
  // in *this* call, not the bill's full paid_amount-to-date, or resaving an
  // unchanged bill would duplicate payment history on every save.
  const previousPaidAmount = Math.max(0, Number(billRow.paid_amount || 0))
  const paidDelta = paidAmount - previousPaidAmount

  let payments = []
  if (rawPayments) {
    payments = rawPayments
      .map((payment) => ({
        payment_method: normalizePaymentMethod(payment?.method || payment?.payment_method),
        reference_no: payment?.reference_no ? String(payment.reference_no).trim() : null,
        amount: Math.max(0, Number(payment?.amount || 0)),
      }))
      .filter((payment) => payment.amount > 0)

    const paymentsTotal = payments.reduce((sum, payment) => sum + payment.amount, 0)
    if (Math.abs(paymentsTotal - Math.max(0, paidDelta)) > PAYMENT_EPSILON) {
      throw new Error("Payment amounts must add up to the newly added paid amount")
    }
  } else if (paidDelta > PAYMENT_EPSILON) {
    // Backward-compatible path for callers that only send a single
    // paid_amount: record the newly-added portion as one CASH payment so
    // the payments table still reflects reality without requiring every
    // caller to be updated at once.
    payments = [{ payment_method: "CASH", reference_no: null, amount: paidDelta }]
  }

  if (inventoryApplied) {
    const persistedItems = await selectBillItemsByBillId(billId)
    if (!haveSameItems(computedItems, persistedItems)) {
      throw new Error("Items cannot be changed after inventory has been applied")
    }
  } else {
    assertProductsCanBeSold(computedItems)
    await assertStockAvailability(computedItems)
  }

  try {
    await beginTransaction()

    await updateBillById(billId, {
      customer_name: customerName || null,
      status,
      subtotal,
      discount_type: discountType,
      discount_value: discountValue,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      balance_amount: balanceAmount,
    })

    await deleteBillItemsByBillId(billId)

    for (const item of computedItems) {
      await insertBillItem(billId, item)
    }

    for (const payment of payments) {
      await insertPayment(billId, payment)
    }

    if (!inventoryApplied && (status === "PARTIAL" || status === "PAID")) {
      await applyInventoryAdjustments(computedItems)
      await markBillInventoryApplied(billId)
    }

    await commitTransaction()

    return {
      id: billId,
      status,
      subtotal,
      discount_type: discountType,
      discount_value: discountValue,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      balance_amount: balanceAmount,
      inventory_applied: inventoryApplied || status === "PARTIAL" || status === "PAID",
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

  const bill = await selectBillState(parsedId)
  if (!bill) {
    throw new Error("Bill not found")
  }
  if (Number(bill.inventory_applied) === 1) {
    throw new Error("Bills with applied inventory cannot be cancelled")
  }
  if (String(bill.status || "").toUpperCase() === "PAID") {
    throw new Error("Paid bills cannot be cancelled")
  }

  await updateBillStatus(parsedId, "CANCELLED")
  return { ok: true }
}

export async function deleteBill(billId) {
  const parsedId = Number(billId)
  if (!Number.isFinite(parsedId) || parsedId <= 0) {
    throw new Error("Invalid bill id")
  }

  const bill = await selectBillState(parsedId)
  if (!bill) {
    throw new Error("Bill not found")
  }
  if (Number(bill.inventory_applied) === 1) {
    throw new Error("Bills with applied inventory cannot be deleted")
  }

  await deleteBillById(parsedId)
  return { ok: true }
}

export async function deleteAllBills() {
  throw new Error("Bulk bill deletion is disabled for production safety")
}
