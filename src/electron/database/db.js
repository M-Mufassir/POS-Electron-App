import sqlite3 from 'sqlite3'
import path from 'path'
import fs from 'fs'
import process from 'process'
import { createRequire } from 'module'
import { AUTH_ROLE_DEFINITIONS } from "../../shared/authConfig.js"

const require = createRequire(import.meta.url)
let electronApp = null
try {
  const electron = require('electron')
  electronApp = electron?.app || null
} catch {
  electronApp = null
}

let db

export function initializeDatabase() {
  if (db) {
    return db
  }

  const isPackaged = Boolean(electronApp?.isPackaged)
  const basePath = !isPackaged || !electronApp
    ? path.join(process.cwd(), 'data')
    : path.join(electronApp.getPath('userData'), 'data')

  // Ensure folder exists

  if (!fs.existsSync(basePath)) fs.mkdirSync(basePath, { recursive: true })

  const dbPath = path.join(basePath, 'pos.db')

  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Database connection error:', err.message)
    } else {
      console.log(`Connected to SQLite database at ${dbPath}.`)
    }
  })

  db.serialize(() => {
    db.run(`PRAGMA foreign_keys = ON`)

    db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        status boolean DEFAULT 1,
        base_unit_id INTEGER NOT NULL,
        base_price REAL NOT NULL,
        stock_base_qty REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (base_unit_id) REFERENCES units(id)
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
          must_reset_password INTEGER DEFAULT 0,
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
    AUTH_ROLE_DEFINITIONS.forEach((role) => {
      db.run(
        `
          INSERT OR IGNORE INTO roles (name, description)
          VALUES (?, ?)
        `,
        [role.name, role.description],
      )
    }),
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
            unit_type TEXT DEFAULT 'COUNT',
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
         `),
    db.run(`
        CREATE TABLE IF NOT EXISTS bills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_no TEXT UNIQUE NOT NULL,

        customer_name TEXT,
        user_id INTEGER,

        status TEXT DEFAULT 'OPEN',
         -- OPEN
         -- PARTIAL
        -- PAID
        -- CANCELLED

        subtotal REAL DEFAULT 0,
        discount_type TEXT,       -- PERCENTAGE | AMOUNT
        discount_value REAL DEFAULT 0,
        total_amount REAL DEFAULT 0,

        paid_amount REAL DEFAULT 0,
        balance_amount REAL DEFAULT 0,
        inventory_applied INTEGER DEFAULT 0,

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `),
    
    db.run(`
        CREATE TABLE IF NOT EXISTS bill_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        bill_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        unit_id INTEGER NOT NULL,
        barcode_id INTEGER,

        quantity REAL NOT NULL,
        unit_price REAL NOT NULL,
        subtotal REAL NOT NULL,

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (unit_id) REFERENCES units(id),
        FOREIGN KEY (barcode_id) REFERENCES barcodes(id)
      )
      `),
    db.run(`
        CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        bill_id INTEGER NOT NULL,

        payment_method TEXT,
        -- CASH
        -- CARD
        -- BANK
        -- ONLINE

        reference_no TEXT,
        amount REAL NOT NULL,

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE
      );
      `)

  })

  return db
}

export function getDB() {
  return db
}





