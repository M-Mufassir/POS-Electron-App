import sqlite3 from 'sqlite3'
import path from 'path'
import process from 'process'
import { app } from 'electron'

let db

export function initializeDatabase() {
  const isDev = process.env.NODE_ENV === 'development';
const basePath = isDev
  ? path.join(process.cwd(), 'data')         // development mode → project folder
  : path.join(app.getPath('userData'), 'data'); // production → user data folder

const dbPath = path.join(basePath, 'pos.db');

  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Database connection error:', err.message)
    } else {
      console.log('Connected to SQLite database.')
    }
  })

  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL
      )
    `)
  })
}

export function getDB() {
  return db
}