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
  const parsedProductId = Number(id)
  
  return new Promise((resolve, reject) => {
    const {
      code,
      name,
      description,
      base_price,
      base_unit_id,
      status = 1,
      categories = [],
      units = [],
    } = product

    if (!Number.isFinite(parsedProductId) || parsedProductId <= 0) {
      reject(new Error("Invalid product ID"))
      return
    }

    const parsedBasePrice = Number(base_price)
    const parsedBaseUnitId = Number(base_unit_id)
    const parsedStatus = Number(status) === 0 ? 0 : 1

    if (!Number.isFinite(parsedBasePrice) || parsedBasePrice < 0) {
      reject(new Error("Base price must be a valid number"))
      return
    }
    if (!Number.isFinite(parsedBaseUnitId) || parsedBaseUnitId <= 0) {
      reject(new Error("Base unit is required"))
      return
    }

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

        const productUpdateResult = await runQuery(
          `UPDATE products 
           SET code = ?, name = ?, description = ?, base_price = ?, base_unit_id = ?, status = ?, updated_at = datetime('now')
           WHERE id = ?`,
          [code, name, description, parsedBasePrice, parsedBaseUnitId, parsedStatus, parsedProductId],
        )
        if (productUpdateResult.changes === 0) {
          throw new Error("Product not found")
        }

        await runQuery(`DELETE FROM product_categories WHERE product_id = ?`, [parsedProductId])
        for (const categoryId of categories) {
          const parsedCategoryId = Number(categoryId)
          if (Number.isNaN(parsedCategoryId)) {
            continue
          }
          await runQuery(
            `INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)`,
            [parsedProductId, parsedCategoryId],
          )
        }

        await runQuery(`DELETE FROM product_units WHERE product_id = ?`, [parsedProductId])
        for (const unit of units) {
          const parsedUnitId = Number(unit?.unit_id ?? unit?.id)
          const parsedMultiplier = Number(unit?.conversion_multiplier)

          if (
            Number.isNaN(parsedUnitId) ||
            Number.isNaN(parsedMultiplier) ||
            parsedMultiplier <= 0
          ) {
            continue
          }

          await runQuery(
            `INSERT INTO product_units (product_id, unit_id, conversion_multiplier) VALUES (?, ?, ?)`,
            [parsedProductId, parsedUnitId, parsedMultiplier],
          )
        }

        await runQuery("COMMIT")

        resolve({
          id: parsedProductId,
          code,
          name,
          description,
          base_price: parsedBasePrice,
          base_unit_id: parsedBaseUnitId,
          status: parsedStatus,
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
  const parsedId = Number(id)

  return new Promise((resolve, reject) => {
    if (!Number.isFinite(parsedId) || parsedId <= 0) {
      reject(new Error("Invalid product ID"))
      return
    }

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
        await runQuery(`DELETE FROM barCodes WHERE product_id = ?`, [parsedId])
        await runQuery(`DELETE FROM product_categories WHERE product_id = ?`, [parsedId])
        await runQuery(`DELETE FROM product_units WHERE product_id = ?`, [parsedId])

        const deleteResult = await runQuery(`DELETE FROM products WHERE id = ?`, [parsedId])
        if (deleteResult.changes === 0) {
          throw new Error("Product not found")
        }

        await runQuery("COMMIT")
        resolve()
      } catch (err) {
        try {
          await runQuery("ROLLBACK")
        } catch {
          // Ignore rollback error and return original failure.
        }
        reject(new Error("Failed to delete product: " + err.message))
      }
    })()
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


export function addProductCategory(productId, categoryId){
    const db = getDB()

    return new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)`,
          [productId, categoryId],
          function (err) {
            if (err) {
              console.error("Error adding product category:", err);
              return reject(err);
            }
            resolve();
          }
        )
    })};

export function removeProductCategory(productId, categoryId) {
  const db = getDB()

  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM product_categories WHERE product_id = ? AND category_id = ?`,
      [productId, categoryId],
      function (err) {
        if (err) {
          console.error("Error removing product category:", err)
          return reject(err)
        }
        resolve()
      },
    )
  })
}

export function getProductCategoriesByProductId(productId) {
  const db = getDB()
  const parsedProductId = Number(productId)

  return new Promise((resolve, reject) => {
    if (!Number.isFinite(parsedProductId) || parsedProductId <= 0) {
      return reject(new Error("Invalid product ID"))
    }

    db.all(
      `SELECT c.id, c.name, c.description
       FROM categories c
       JOIN product_categories pc ON c.id = pc.category_id
       WHERE pc.product_id = ? AND c.status = 1
       ORDER BY c.name COLLATE NOCASE ASC`,
      [parsedProductId],
      (err, rows) => {
        if (err) {
          console.error("Error fetching product categories:", err)
          return reject(err)
        }
        resolve(rows)
      },
    )
  })
}
