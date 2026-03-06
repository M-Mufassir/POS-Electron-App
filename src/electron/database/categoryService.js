import { getDB } from './db.js'


export function getAllCategories(){
    const db = getDB()

    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM categories WHERE status = 1`, [], (err, rows) => {
          if (err) {
              console.error("Error fetching categories:", err);
              return reject(err);
          }
          resolve(rows);
      }
      );
  });

}

export function getCategoriesWithProductCounts() {
    const db = getDB()

    return new Promise((resolve, reject) => {
      db.all(
        `SELECT
            c.id,
            c.name,
            c.description,
            c.status,
            c.created_at,
            c.updated_at,
            COUNT(pc.product_id) AS product_count
         FROM categories c
         LEFT JOIN product_categories pc
           ON pc.category_id = c.id
         WHERE c.status = 1
         GROUP BY c.id, c.name, c.description, c.status, c.created_at, c.updated_at
         ORDER BY c.name COLLATE NOCASE ASC`,
        [],
        (err, rows) => {
          if (err) {
            console.error("Error fetching categories with counts:", err)
            return reject(err)
          }
          resolve(rows)
        },
      )
  })
}

export function addCategory(categoryInput) {
    const db = getDB()
    const isStringInput = typeof categoryInput === "string"
    const name = (isStringInput ? categoryInput : categoryInput?.name || "").trim()
    const description = (isStringInput ? "" : categoryInput?.description || "").trim()

    return new Promise((resolve, reject) => {
        if (!name) {
            return reject(new Error("Name is required"));
        }
        db.run(
            `INSERT INTO categories (name, description, status, created_at, updated_at) 
             VALUES (?, ?, 1, datetime('now'), datetime('now'))`,
            [name, description],
            function (err) {
                if (err) {
                    console.error("Error adding category:", err);
                    return reject(err);
                }
                resolve({ id: this.lastID, name, description, status: 1 });
            }
        );
    })};

export function getCategoryById(id) {
    const db = getDB()

    return new Promise((resolve, reject) => {
        if (!id) {
            return reject(new Error("Invalid category ID"));
        }
        db.get(`SELECT * FROM categories WHERE id = ?`, [id], (err, category) => {
            if (err) {
                console.error("Error fetching category:", err);
                return reject(err);
            }
            resolve(category);
        })})};

