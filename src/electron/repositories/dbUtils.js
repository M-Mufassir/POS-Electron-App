import { getDB } from "../database/db.js"

export const runQuery = (sql, params = []) => {
  const db = getDB()
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err)
        return
      }
      resolve(this)
    })
  })
}

export const getQuery = (sql, params = []) => {
  const db = getDB()
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err)
        return
      }
      resolve(row)
    })
  })
}

export const allQuery = (sql, params = []) => {
  const db = getDB()
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err)
        return
      }
      resolve(rows)
    })
  })
}

export const beginTransaction = () => runQuery("BEGIN TRANSACTION")
export const commitTransaction = () => runQuery("COMMIT")
export const rollbackTransaction = () => runQuery("ROLLBACK")
