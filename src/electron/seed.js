// seed.js
import process from "process"
import { initializeDatabase, getDB } from "./database/db.js"
import { AUTH_ROLE_DEFINITIONS } from "../shared/authConfig.js"

process.env.NODE_ENV = process.env.NODE_ENV || "development"

initializeDatabase()
const db = getDB()

db.serialize(() => {
  console.log("Seeding database...")

  // --- ROLES ---
  AUTH_ROLE_DEFINITIONS.forEach((role) => {
    db.run(
      `
        INSERT OR IGNORE INTO roles (name, description) VALUES (?, ?)
      `,
      [role.name, role.description],
    )
  })

  // // --- USERS ---
  // db.run(`
  //   INSERT OR IGNORE INTO users (username, password, email, role_id, must_reset_password) VALUES
  //   ('admin', 'admin123', 'admin@shop.com', 1, 1),
  //   ('cashier1', 'cash123', 'cashier1@shop.com', 2, 0),
  //   ('manager1', 'man123', 'manager1@shop.com', 3, 0)
  // `)

  // // --- UNITS ---
  // db.run(`
  //   INSERT INTO units (name, description, symbol, base_multiplier) VALUES
  //   ('Piece', 'Single item', 'pc', 1),
  //   ('Kilogram', 'Weight in kg', 'kg', 1),
  //   ('Gram', 'Weight in grams', 'g', 0.001),
  //   ('Liter', 'Volume in liters', 'l', 1),
  //   ('Milliliter', 'Volume in milliliters', 'ml', 0.001)
  // `);

  // // --- CATEGORIES ---
  // db.run(`
  //   INSERT INTO categories (name, description) VALUES
  //   ('Beverages', 'Drinks and juices'),
  //   ('Snacks', 'Chips, chocolates, biscuits'),
  //   ('Household', 'Cleaning and utility products'),
  //   ('Dairy', 'Milk, cheese, yogurt')
  // `);

  // // --- PRODUCTS ---
  // db.run(`
  //   INSERT INTO products (name, description, base_unit_id, base_price) VALUES
  //   ('Coca Cola 500ml', 'Refreshing soft drink', 1, 1.50),
  //   ('Lays Chips', 'Potato chips, salted', 1, 2.00),
  //   ('Milk 1L', 'Fresh milk carton', 1, 1.20),
  //   ('Cheddar Cheese 200g', 'Pack of cheese slices', 1, 3.00)
  // `);

  // // --- PRODUCT-CATEGORIES ---
  // db.run(`
  //   INSERT INTO product_categories (product_id, category_id) VALUES
  //   (1, 1),
  //   (2, 2),
  //   (3, 4),
  //   (4, 4)
  // `);

  // // --- PRODUCT-UNITS ---
  // db.run(`
  //   INSERT INTO product_units (product_id, unit_id, conversion_multiplier) VALUES
  //   (1, 4, 0.5),
  //   (3, 5, 1000),
  //   (4, 3, 0.2)
  // `);

  // // --- BARCODES ---
  // db.run(`
  //   INSERT INTO barCodes (product_id, unit_id, barcode) VALUES
  //   (1, 1, '123456789012'),
  //   (2, 1, '234567890123'),
  //   (3, 1, '345678901234'),
  //   (4, 1, '456789012345')
  // `);

  console.log("Database seeding done!")
  db.close()
})