import { allQuery, getQuery, runQuery } from "./dbUtils.js"

export const selectAllUnits = () => {
  return allQuery(`SELECT * FROM units WHERE status = 1 ORDER BY name COLLATE NOCASE ASC`)
}

export const selectUnitById = (unitId) => {
  return getQuery(`SELECT * FROM units WHERE id = ?`, [unitId])
}

export const selectUnitsWithProductCounts = () => {
  return allQuery(
    `SELECT
        u.id,
        u.name,
        u.description,
        u.status,
        u.symbol,
        u.unit_type,
        u.base_multiplier,
        u.created_at,
        u.updated_at,
        (
          SELECT COUNT(DISTINCT p.id)
          FROM products p
          LEFT JOIN product_units pu
            ON pu.product_id = p.id
          WHERE p.status = 1
            AND (p.base_unit_id = u.id OR pu.unit_id = u.id)
        ) AS product_count
     FROM units u
     WHERE u.status = 1
     ORDER BY u.name COLLATE NOCASE ASC`,
    [],
  )
}

export const insertUnit = (unit) => {
  return runQuery(
    `INSERT INTO units (name, symbol, description, status, unit_type, base_multiplier, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    [
      unit.name,
      unit.symbol,
      unit.description,
      unit.status,
      unit.unit_type,
      unit.base_multiplier,
    ],
  )
}
