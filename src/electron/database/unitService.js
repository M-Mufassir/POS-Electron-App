import { getDB } from "./db.js"

export function getAllUnits(){
    const db = getDB()

    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM units WHERE status = 1 ORDER BY name COLLATE NOCASE ASC`, [], (err, rows) => {
          if (err) {
              console.error("Error fetching units:", err);
              return reject(err);
          }
          resolve(rows);
      }
      );
  });
}

export function getUnitById(id) {
    const db = getDB()

    return new Promise((resolve, reject) => {
        if (!id) {
            return reject(new Error("Invalid unit ID"));
        }
        db.get(`SELECT * FROM units WHERE id = ?`, [id], (err, unit) => {
            if (err) {
                console.error("Error fetching unit:", err);
                return reject(err);
            }
            resolve(unit);
        });
    });
}

export function getUnitsWithProductCounts() {
  const db = getDB()

  return new Promise((resolve, reject) => {
    db.all(
      `SELECT
          u.id,
          u.name,
          u.description,
          u.status,
          u.symbol,
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
      (err, rows) => {
        if (err) {
          console.error("Error fetching units with counts:", err)
          return reject(err)
        }
        resolve(rows)
      },
    )
  })
}

export function addUnit(unitInput) {
  const db = getDB()
  const isStringInput = typeof unitInput === "string"
  const name = (isStringInput ? unitInput : unitInput?.name || "").trim()
  const symbol = (isStringInput ? "" : unitInput?.symbol || "").trim()
  const description = (isStringInput ? "" : unitInput?.description || "").trim()
  const parsedStatus = Number(isStringInput ? 1 : unitInput?.status) === 0 ? 0 : 1
  const parsedBaseMultiplier = Number(isStringInput ? 1 : unitInput?.base_multiplier ?? 1)
  
  return new Promise((resolve, reject) => {
    if (!name || !symbol) {
      return reject(new Error("Name and symbol are required"));
    }
    if (!Number.isFinite(parsedBaseMultiplier) || parsedBaseMultiplier <= 0) {
      return reject(new Error("Base multiplier must be a positive number"));
    }

    db.run(
      `INSERT INTO units (name, symbol, description, status, base_multiplier, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [name, symbol, description, parsedStatus, parsedBaseMultiplier],
      function(err) {
        if (err) {
          console.error("Error adding unit:", err);
          return reject(err);
        }
        resolve({
          id: this.lastID,
          name,
          symbol,
          description,
          status: parsedStatus,
          base_multiplier: parsedBaseMultiplier,
        });
      }
    );
  });
}
