import {
  deleteBarcodeById,
  insertBarcode,
  selectAssignableUnitsByProductId,
  selectBarcodeByProductAndUnit,
  selectBarcodeByValue,
  selectBarcodesByProductId,
  updateBarcodeById,
} from "../repositories/barcodeRepository.js"
import {
  generateInternalEan13,
  isStandardBarcodeLength,
  isValidBarcodeChecksum,
} from "../../shared/barcodeUtils.js"

const assertValidChecksum = (barcode) => {
  if (isStandardBarcodeLength(barcode) && !isValidBarcodeChecksum(barcode)) {
    throw new Error("Barcode checksum is invalid for a 12/13-digit UPC-A/EAN-13 code")
  }
}

export async function getBarcodesByProductId(productId) {
  const parsedProductId = Number(productId)
  if (!Number.isFinite(parsedProductId) || parsedProductId <= 0) {
    throw new Error("Invalid product ID")
  }
  return await selectBarcodesByProductId(parsedProductId)
}

export async function getAssignableUnitsByProductId(productId) {
  const parsedProductId = Number(productId)
  if (!Number.isFinite(parsedProductId) || parsedProductId <= 0) {
    throw new Error("Invalid product ID")
  }
  return await selectAssignableUnitsByProductId(parsedProductId)
}

export async function addBarcode(input) {
  const parsedProductId = Number(input?.product_id)
  const parsedUnitId = Number(input?.unit_id)
  const barcode = String(input?.barcode || "").trim()

  if (!Number.isFinite(parsedProductId) || parsedProductId <= 0) {
    throw new Error("Valid product is required")
  }
  if (!Number.isFinite(parsedUnitId) || parsedUnitId <= 0) {
    throw new Error("Valid unit is required")
  }
  if (!barcode) {
    throw new Error("Barcode is required")
  }

  assertValidChecksum(barcode)

  const existingForUnit = await selectBarcodeByProductAndUnit(parsedProductId, parsedUnitId)
  if (existingForUnit) {
    throw new Error("A barcode already exists for this unit. Edit the existing one instead.")
  }

  const existingForValue = await selectBarcodeByValue(barcode)
  if (existingForValue) {
    throw new Error("This barcode value is already assigned to another product/unit.")
  }

  const result = await insertBarcode({
    product_id: parsedProductId,
    unit_id: parsedUnitId,
    barcode,
  })

  return {
    id: result.lastID,
    product_id: parsedProductId,
    unit_id: parsedUnitId,
    barcode,
  }
}

export async function updateBarcode(id, input) {
  const parsedId = Number(id)
  const parsedProductId = Number(input?.product_id)
  const parsedUnitId = Number(input?.unit_id)
  const barcode = String(input?.barcode || "").trim()

  if (!Number.isFinite(parsedId) || parsedId <= 0) {
    throw new Error("Invalid barcode ID")
  }
  if (!Number.isFinite(parsedProductId) || parsedProductId <= 0) {
    throw new Error("Valid product is required")
  }
  if (!Number.isFinite(parsedUnitId) || parsedUnitId <= 0) {
    throw new Error("Valid unit is required")
  }
  if (!barcode) {
    throw new Error("Barcode is required")
  }

  assertValidChecksum(barcode)

  const existingForUnit = await selectBarcodeByProductAndUnit(parsedProductId, parsedUnitId)
  if (existingForUnit && Number(existingForUnit.id) !== parsedId) {
    throw new Error("A barcode already exists for this unit. Edit the existing one instead.")
  }

  const existingForValue = await selectBarcodeByValue(barcode)
  if (existingForValue && Number(existingForValue.id) !== parsedId) {
    throw new Error("This barcode value is already assigned to another product/unit.")
  }

  const result = await updateBarcodeById(parsedId, {
    product_id: parsedProductId,
    unit_id: parsedUnitId,
    barcode,
  })

  if (result.changes === 0) {
    throw new Error("Barcode not found")
  }

  return {
    id: parsedId,
    product_id: parsedProductId,
    unit_id: parsedUnitId,
    barcode,
  }
}

export async function deleteBarcode(id) {
  const parsedId = Number(id)
  if (!Number.isFinite(parsedId) || parsedId <= 0) {
    throw new Error("Invalid barcode ID")
  }

  const result = await deleteBarcodeById(parsedId)
  if (result.changes === 0) {
    throw new Error("Barcode not found")
  }
}

export async function generateBarcode() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = generateInternalEan13()
    const existing = await selectBarcodeByValue(candidate)
    if (!existing) {
      return { barcode: candidate }
    }
  }
  throw new Error("Unable to generate a unique barcode. Please try again.")
}
