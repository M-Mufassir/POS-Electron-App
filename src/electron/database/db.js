import sqlite3 from 'sqlite3'
import path from 'path'
import fs from 'fs'
import process from 'process'
import { app } from 'electron'

let db

export function initializeDatabase() {
  const isDev = process.env.NODE_ENV === 'development';
const basePath = isDev
  ? path.join(process.cwd(), 'data')         // development mode → project folder
  : path.join(app.getPath('userData'), 'data'); // production → user data folder

  // Ensure folder exists
if (!fs.existsSync(basePath)) fs.mkdirSync(basePath, { recursive: true });


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
        code TEXT UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        status boolean DEFAULT 1,
        base_unit_id INTEGER NOT NULL,
        base_price REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `),
    db.run(`
        CREATE TABLE IF NOT EXISTS users(
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          email TEXT,
          role_id INTEGER NOT NULL,
          status boolean DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `),
      db.run(`
        CREATE TABLE IF NOT EXISTS roles(
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          description TEXT
      )
        `),
    db.run(`
        CREATE TABLE IF NOT EXISTS categories(
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          status boolean DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `),
    db.run(`
        CREATE TABLE IF NOT EXISTS units(
          id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            status boolean DEFAULT 1,
            symbol TEXT NOT NULL,
            base_multiplier REAL NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
       `),
    db.run(`
        CREATE TABLE IF NOT EXISTS product_categories(
            product_id INTEGER NOT NULL,
            category_id INTEGER NOT NULL,
            PRIMARY KEY (product_id, category_id),
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
        )
       `),
    db.run(`
        CREATE TABLE IF NOT EXISTS product_units(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            unit_id INTEGER NOT NULL,
            conversion_multiplier REAL NOT NULL,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
            FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE
        )
       `),
    db.run(`
        CREATE TABLE IF NOT EXISTS barCodes(
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id INTEGER NOT NULL,
          unit_id INTEGER NOT NULL,
          barcode TEXT NOT NULL UNIQUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
          FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE
        )
         `)
  })
}

export function getDB() {
  return db
}