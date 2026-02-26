import { getDB } from './db.js'

export function addProduct(product) {
  const db = getDB()

  return new Promise((resolve, reject) => {
    const { name, price } = product

    db.run(
      `INSERT INTO products (name, price) VALUES (?, ?)`,
      [name, price],
      function (err) {
        if (err) {
          reject(err.message)
        } else {
          resolve({
            id: this.lastID,
            name,
            price
          })
        }
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