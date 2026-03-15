import { allQuery, runQuery } from "./dbUtils.js"

export const selectBarcodesByProductId = (productId) => {
  return allQuery(
    `SELECT
        b.id,
        b.product_id,
        b.unit_id,
        b.barcode,
        b.created_at,
        b.updated_at,
        p.code AS product_code,
        p.name AS product_name,
        u.name AS unit_name,
        u.symbol AS unit_symbol
     FROM barCodes b
     JOIN products p ON p.id = b.product_id
     JOIN units u ON u.id = b.unit_id
     WHERE b.product_id = ?
     ORDER BY b.updated_at DESC, b.id DESC`,
    [productId],
  )
}

export const selectAssignableUnitsByProductId = (productId) => {
  return allQuery(
    `SELECT DISTINCT
        u.id,
        u.name,
        u.symbol,
        u.description
     FROM units u
     JOIN (
        SELECT p.base_unit_id AS unit_id
        FROM products p
        WHERE p.id = ?

        UNION

        SELECT pu.unit_id
        FROM product_units pu
        WHERE pu.product_id = ?
     ) selectable_units
       ON selectable_units.unit_id = u.id
     WHERE u.status = 1
     ORDER BY u.name COLLATE NOCASE ASC`,
    [productId, productId],
  )
}

export const insertBarcode = (barcode) => {
  return runQuery(
    `INSERT INTO barCodes (product_id, unit_id, barcode, created_at, updated_at)
     VALUES (?, ?, ?, datetime('now'), datetime('now'))`,
    [barcode.product_id, barcode.unit_id, barcode.barcode],
  )
}

export const updateBarcodeById = (barcodeId, barcode) => {
  return runQuery(
    `UPDATE barCodes
     SET product_id = ?, unit_id = ?, barcode = ?, updated_at = datetime('now')
     WHERE id = ?`,
    [barcode.product_id, barcode.unit_id, barcode.barcode, barcodeId],
  )
}

export const deleteBarcodeById = (barcodeId) => {
  return runQuery(`DELETE FROM barCodes WHERE id = ?`, [barcodeId])
}
