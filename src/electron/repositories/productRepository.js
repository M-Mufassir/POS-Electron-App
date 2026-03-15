import { allQuery, getQuery, runQuery } from "./dbUtils.js"

export const insertProduct = (product) => {
  return runQuery(
    `INSERT INTO products
       (code, name, description, base_unit_id, base_price, status, stock_base_qty, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      product.code,
      product.name,
      product.description,
      product.base_unit_id,
      product.base_price,
      product.status,
      product.stock_base_qty ?? 0,
      product.created_at,
      product.updated_at,
    ],
  )
}

export const selectAllProducts = () => {
  return allQuery(
    `SELECT
       p.*,
       u.name AS base_unit_name,
       u.symbol AS base_unit_symbol
     FROM products p
     LEFT JOIN units u
       ON p.base_unit_id = u.id
     ORDER BY p.id ASC`,
  )
}

export const selectProductById = (id) => {
  return getQuery(
    `SELECT p.*, u.name as base_unit_name, u.symbol as base_unit_symbol
     FROM products p
     LEFT JOIN units u ON p.base_unit_id = u.id
     WHERE p.id = ?`,
    [id],
  )
}

export const selectProductCategories = (productId) => {
  return allQuery(
    `SELECT c.id, c.name, c.description
     FROM categories c
     JOIN product_categories pc ON c.id = pc.category_id
     WHERE pc.product_id = ?`,
    [productId],
  )
}

export const selectProductUnits = (productId) => {
  return allQuery(
    `SELECT u.id, u.name, u.symbol, pu.conversion_multiplier
     FROM units u
     JOIN product_units pu ON u.id = pu.unit_id
     WHERE pu.product_id = ?`,
    [productId],
  )
}

export const updateProductById = (productId, product) => {
  return runQuery(
    `UPDATE products
     SET code = ?,
         name = ?,
         description = ?,
         base_price = ?,
         base_unit_id = ?,
         stock_base_qty = ?,
         status = ?,
         updated_at = datetime('now')
     WHERE id = ?`,
    [
      product.code,
      product.name,
      product.description,
      product.base_price,
      product.base_unit_id,
      product.stock_base_qty,
      product.status,
      productId,
    ],
  )
}

export const deleteProductById = (productId) => {
  return runQuery(`DELETE FROM products WHERE id = ?`, [productId])
}

export const deleteProductCategories = (productId) => {
  return runQuery(`DELETE FROM product_categories WHERE product_id = ?`, [productId])
}

export const deleteProductCategory = (productId, categoryId) => {
  return runQuery(
    `DELETE FROM product_categories WHERE product_id = ? AND category_id = ?`,
    [productId, categoryId],
  )
}

export const insertProductCategory = (productId, categoryId) => {
  return runQuery(
    `INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)`,
    [productId, categoryId],
  )
}

export const deleteProductUnits = (productId) => {
  return runQuery(`DELETE FROM product_units WHERE product_id = ?`, [productId])
}

export const insertProductUnit = (productId, unitId, conversionMultiplier) => {
  return runQuery(
    `INSERT INTO product_units (product_id, unit_id, conversion_multiplier) VALUES (?, ?, ?)`,
    [productId, unitId, conversionMultiplier],
  )
}

export const deleteProductBarcodes = (productId) => {
  return runQuery(`DELETE FROM barCodes WHERE product_id = ?`, [productId])
}

export const updateProductStatus = (productId, status) => {
  return runQuery(
    `UPDATE products SET status = ?, updated_at = datetime('now') WHERE id = ?`,
    [status, productId],
  )
}

export const selectProductCategoriesByProductId = (productId) => {
  return allQuery(
    `SELECT c.id, c.name, c.description
     FROM categories c
     JOIN product_categories pc ON c.id = pc.category_id
     WHERE pc.product_id = ? AND c.status = 1
     ORDER BY c.name COLLATE NOCASE ASC`,
    [productId],
  )
}

