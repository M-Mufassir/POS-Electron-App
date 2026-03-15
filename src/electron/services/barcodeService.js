import {
  deleteBarcodeById,
  insertBarcode,
  selectAssignableUnitsByProductId,
  selectBarcodesByProductId,
  updateBarcodeById,
} from "../repositories/barcodeRepository.js"

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
