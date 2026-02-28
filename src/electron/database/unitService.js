import { getDB } from "./db.js"

export function getAllCategories() {
  const db = getDB()

  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM categories WHERE status = 1`, [], (err, rows) => {
      if (err) {
        console.error("Error fetching categories:", err)
        return reject(err)
      }
      resolve(rows)
    })
  })
}
