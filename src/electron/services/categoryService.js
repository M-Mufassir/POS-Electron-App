import {
  insertCategory,
  selectAllCategories,
  selectCategoriesWithProductCounts,
  selectCategoryById,
} from "../repositories/categoryRepository.js"

export async function getAllCategories() {
  return await selectAllCategories()
}

export async function getCategoriesWithProductCounts() {
  return await selectCategoriesWithProductCounts()
}

export async function addCategory(categoryInput) {
  const isStringInput = typeof categoryInput === "string"
  const name = (isStringInput ? categoryInput : categoryInput?.name || "").trim()
  const description = (isStringInput ? "" : categoryInput?.description || "").trim()

  if (!name) {
    throw new Error("Name is required")
  }

  const result = await insertCategory({ name, description })
  return { id: result.lastID, name, description, status: 1 }
}

export async function getCategoryById(id) {
  if (!id) {
    throw new Error("Invalid category ID")
  }
  return await selectCategoryById(id)
}
