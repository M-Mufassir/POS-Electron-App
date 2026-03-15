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
  )
}

export const insertCategory = (category) => {
  return runQuery(
    `INSERT INTO categories (name, description, status, created_at, updated_at)
     VALUES (?, ?, 1, datetime('now'), datetime('now'))`,
    [category.name, category.description],
  )
}

export const selectCategoryById = (categoryId) => {
  return getQuery(`SELECT * FROM categories WHERE id = ?`, [categoryId])
}
