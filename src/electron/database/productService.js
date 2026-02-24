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

export function getProducts() {
  const db = getDB()

  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM products`, [], (err, rows) => {
      if (err) {
        reject(err.message)
      } else {
        resolve(rows)
      }
    })
  })
}