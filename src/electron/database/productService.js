import { getDB } from './db.js'

export function addProduct(product) {
  const db = getDB()

  return new Promise((resolve, reject) => {
    const { code, name, description, base_price, base_unit_id, created_at } = product

    db.run(
      `INSERT INTO products 
       (code, name, description, base_unit_id, base_price, status, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
      [code, name, description, base_unit_id, base_price, created_at || new Date().toISOString(), new Date().toISOString()],
      function (err) {
        if (err) {
          return reject(new Error("Failed to insert product: " + err.message))
        }

        resolve({
          id: this.lastID,
          code,
          name,
          description,
          base_price,
          base_unit_id
        })
      }
    )
  })
}

export function getAllProducts() {
  const db = getDB();

  return new Promise((resolve, reject) => {
    db.all(
      `SELECT 
         p.*, 
         u.name AS base_unit_name,
         u.symbol AS base_unit_symbol
       FROM products p
       LEFT JOIN units u 
         ON p.base_unit_id = u.id
       ORDER BY p.id ASC`,
      [],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });
}


export function getProductById(id) {
  const db = getDB();

  return new Promise((resolve, reject) => {
    if (!id || isNaN(id)) {
      return reject(new Error("Invalid product ID"));
    }

    // Get Product
    db.get(
      `SELECT p.*, u.name as base_unit_name
       FROM products p
       LEFT JOIN units u ON p.base_unit_id = u.id
       WHERE p.id = ?`,
      [id],
      (err, product) => {
        if (err) return reject(err);
        if (!product) return resolve(null);

        // Get Categories
        db.all(
          `SELECT c.id, c.name, c.description
           FROM categories c
           JOIN product_categories pc ON c.id = pc.category_id
           WHERE pc.product_id = ?`,
          [id],
          (err, categories) => {
            if (err) return reject(err);

            // Get Units
            db.all(
              `SELECT u.id, u.name, u.symbol, pu.conversion_multiplier
               FROM units u
               JOIN product_units pu ON u.id = pu.unit_id
               WHERE pu.product_id = ?`,
              [id],
              (err, units) => {
                if (err) return reject(err);

                resolve({
                  ...product,
                  categories,
                  units
                });
              }
            );
          }
        );
      }
    );
  });
}

export function updateProduct(id, product) {
  const db = getDB()
  
  return new Promise((resolve, reject) => {
    const {
      code,
      name,
      description,
      base_price,
      base_unit_id,
      categories = [],
      units = [],
    } = product

    const runQuery = (sql, params = []) =>
      new Promise((innerResolve, innerReject) => {
        db.run(sql, params, function (err) {
          if (err) {
            innerReject(err)
            return
          }
          innerResolve(this)
        })
      })

    ;(async () => {
      try {
        await runQuery("BEGIN TRANSACTION")

        await runQuery(
          `UPDATE products 
           SET code = ?, name = ?, description = ?, base_price = ?, base_unit_id = ?, updated_at = datetime('now')
           WHERE id = ?`,
          [code, name, description, base_price, base_unit_id, id],
        )

        await runQuery(`DELETE FROM product_categories WHERE product_id = ?`, [id])
        for (const categoryId of categories) {
          const parsedCategoryId = Number(categoryId)
          if (Number.isNaN(parsedCategoryId)) {
            continue
          }
          await runQuery(
            `INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)`,
            [id, parsedCategoryId],
          )
        }

        await runQuery(`DELETE FROM product_units WHERE product_id = ?`, [id])
        for (const unit of units) {
          const parsedUnitId = Number(unit?.unit_id ?? unit?.id)
          const parsedMultiplier = Number(unit?.conversion_multiplier)

          if (Number.isNaN(parsedUnitId) || Number.isNaN(parsedMultiplier)) {
            continue
          }

          await runQuery(
            `INSERT INTO product_units (product_id, unit_id, conversion_multiplier) VALUES (?, ?, ?)`,
            [id, parsedUnitId, parsedMultiplier],
          )
        }

        await runQuery("COMMIT")

        resolve({
          id,
          code,
          name,
          description,
          base_price,
          base_unit_id,
          categories,
          units,
        })
      } catch (err) {
        try {
          await runQuery("ROLLBACK")
        } catch {
          // Ignore rollback error and return original failure.
        }
        reject(new Error("Failed to update product: " + err.message))
      }
    })()
  })
}

export function deleteProduct(id) {
  const db = getDB()
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM products WHERE id = ?`, [id], function (err) {
      if (err) {
        return reject(new Error("Failed to delete product: " + err.message))
      }
      resolve()
    })
  })
}

export function inactivateProduct(id) {
  const db = getDB()
  return new Promise((resolve, reject) => {
    db.run(`UPDATE products SET status = 0, updated_at = datetime('now') WHERE id = ?`, [id], function (err) {
      if (err) {
        return reject(new Error("Failed to inactivate product: " + err.message))
      }
      resolve()
    })
  })
}

export function getAllUnits(){
    const db = getDB()

    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM units WHERE status = 1`, [], (err, rows) => {
          if (err) {
              console.error("Error fetching units:", err);
              return reject(err);
          }
          resolve(rows);
      }
      );
  });
}
