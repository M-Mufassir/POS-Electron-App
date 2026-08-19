import { allQuery, getQuery, runQuery } from "./dbUtils.js"

export const selectAllCategories = () => {
  return allQuery(`SELECT * FROM categories WHERE status = 1`, [])
}

export const selectCategoriesWithProductCounts = () => {
  return allQuery(
    `SELECT
        c.id,
        c.name,
        c.description,
        c.status,
        c.parent_id,
        c.sort_order,
        c.created_at,
        c.updated_at,
        COUNT(pc.product_id) AS product_count
     FROM categories c
     LEFT JOIN product_categories pc
       ON pc.category_id = c.id
     WHERE c.status = 1
     GROUP BY c.id, c.name, c.description, c.status, c.parent_id, c.sort_order, c.created_at, c.updated_at
     ORDER BY c.sort_order ASC, c.name COLLATE NOCASE ASC`,
    [],
  )
}

export const insertCategory = (category) => {
  return runQuery(
    `INSERT INTO categories (name, description, parent_id, sort_order, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
    [category.name, category.description, category.parent_id, category.sort_order || 0],
  )
}

export const selectCategoryById = (categoryId) => {
  return getQuery(`SELECT * FROM categories WHERE id = ?`, [categoryId])
}

export const selectAllCategoriesIncludingInactive = () => {
  return allQuery(
    `SELECT id, name, parent_id, sort_order, status FROM categories ORDER BY sort_order ASC, name COLLATE NOCASE ASC`,
    [],
  )
}

export const updateCategoryById = (categoryId, category) => {
  return runQuery(
    `UPDATE categories
     SET name = ?, description = ?, parent_id = ?, sort_order = ?, updated_at = datetime('now')
     WHERE id = ?`,
    [category.name, category.description, category.parent_id, category.sort_order || 0, categoryId],
  )
}

export const updateCategoryStatus = (categoryId, status) => {
  return runQuery(
    `UPDATE categories SET status = ?, updated_at = datetime('now') WHERE id = ?`,
    [status, categoryId],
  )
}

export const updateCategoriesStatusBulk = (categoryIds, status) => {
  if (!categoryIds.length) return Promise.resolve({ changes: 0 })
  const placeholders = categoryIds.map(() => "?").join(", ")
  return runQuery(
    `UPDATE categories SET status = ?, updated_at = datetime('now') WHERE id IN (${placeholders})`,
    [status, ...categoryIds],
  )
}
