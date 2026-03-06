import { getDB } from "./db.js"

export function getBarcodesByProductId(productId) {
  const db = getDB()
  const parsedProductId = Number(productId)

  return new Promise((resolve, reject) => {
    if (!Number.isFinite(parsedProductId) || parsedProductId <= 0) {
      return reject(new Error("Invalid product ID"))
    }

    db.all(
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
      [parsedProductId],
      (err, rows) => {
        if (err) {
          console.error("Error fetching barcodes by product:", err)
          return reject(err)
        }
        resolve(rows)
      },
    )
  })
}

export function getAssignableUnitsByProductId(productId) {
  const db = getDB()
  const parsedProductId = Number(productId)

  return new Promise((resolve, reject) => {
    if (!Number.isFinite(parsedProductId) || parsedProductId <= 0) {
      return reject(new Error("Invalid product ID"))
    }

    db.all(
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
      [parsedProductId, parsedProductId],
      (err, rows) => {
        if (err) {
          console.error("Error fetching assignable units:", err)
          return reject(err)
        }
        resolve(rows)
      },
    )
  })
}

export function addBarcode(input) {
  const db = getDB()
  const parsedProductId = Number(input?.product_id)
  const parsedUnitId = Number(input?.unit_id)
  const barcode = String(input?.barcode || "").trim()

  return new Promise((resolve, reject) => {
    if (!Number.isFinite(parsedProductId) || parsedProductId <= 0) {
      return reject(new Error("Valid product is required"))
    }
    if (!Number.isFinite(parsedUnitId) || parsedUnitId <= 0) {
      return reject(new Error("Valid unit is required"))
    }
    if (!barcode) {
      return reject(new Error("Barcode is required"))
    }

    db.run(
      `INSERT INTO barCodes (product_id, unit_id, barcode, created_at, updated_at)
       VALUES (?, ?, ?, datetime('now'), datetime('now'))`,
      [parsedProductId, parsedUnitId, barcode],
      function (err) {
        if (err) {
          console.error("Error adding barcode:", err)
          return reject(err)
        }
        resolve({
          id: this.lastID,
          product_id: parsedProductId,
          unit_id: parsedUnitId,
          barcode,
        })
      },
    )
  })
}

export function updateBarcode(id, input) {
  const db = getDB()
  const parsedId = Number(id)
  const parsedProductId = Number(input?.product_id)
  const parsedUnitId = Number(input?.unit_id)
  const barcode = String(input?.barcode || "").trim()

  return new Promise((resolve, reject) => {
    if (!Number.isFinite(parsedId) || parsedId <= 0) {
      return reject(new Error("Invalid barcode ID"))
    }
    if (!Number.isFinite(parsedProductId) || parsedProductId <= 0) {
      return reject(new Error("Valid product is required"))
    }
    if (!Number.isFinite(parsedUnitId) || parsedUnitId <= 0) {
      return reject(new Error("Valid unit is required"))
    }
    if (!barcode) {
      return reject(new Error("Barcode is required"))
    }

    db.run(
      `UPDATE barCodes
       SET product_id = ?, unit_id = ?, barcode = ?, updated_at = datetime('now')
       WHERE id = ?`,
      [parsedProductId, parsedUnitId, barcode, parsedId],
      function (err) {
        if (err) {
          console.error("Error updating barcode:", err)
          return reject(err)
        }

        if (this.changes === 0) {
          return reject(new Error("Barcode not found"))
        }

        resolve({
          id: parsedId,
          product_id: parsedProductId,
          unit_id: parsedUnitId,
          barcode,
        })
      },
    )
  })
}

export function deleteBarcode(id) {
  const db = getDB()
  const parsedId = Number(id)

  return new Promise((resolve, reject) => {
    if (!Number.isFinite(parsedId) || parsedId <= 0) {
      return reject(new Error("Invalid barcode ID"))
    }

    db.run(`DELETE FROM barCodes WHERE id = ?`, [parsedId], function (err) {
      if (err) {
        console.error("Error deleting barcode:", err)
        return reject(err)
      }

      if (this.changes === 0) {
        return reject(new Error("Barcode not found"))
      }

      resolve()
    })
  })
}
