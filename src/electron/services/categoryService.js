import {
  insertCategory,
  selectAllCategories,
  selectAllCategoriesIncludingInactive,
  selectCategoriesWithProductCounts,
  selectCategoryById,
  updateCategoriesStatusBulk,
  updateCategoryById,
  updateCategoryStatus,
} from "../repositories/categoryRepository.js"

export async function getAllCategories() {
  return await selectAllCategories()
}

export async function getCategoriesWithProductCounts() {
  return await selectCategoriesWithProductCounts()
}

const parseCategoryInput = (categoryInput) => {
  const isStringInput = typeof categoryInput === "string"
  const name = (isStringInput ? categoryInput : categoryInput?.name || "").trim()
  const description = (isStringInput ? "" : categoryInput?.description || "").trim()
  const rawParentId = isStringInput ? null : categoryInput?.parent_id
  const parentId = rawParentId === "" || rawParentId === undefined || rawParentId === null
    ? null
    : Number(rawParentId)
  const sortOrder = Number(isStringInput ? 0 : categoryInput?.sort_order || 0) || 0

  return { name, description, parentId, sortOrder }
}

// Walks the flat category list to find every descendant of `categoryId`,
// used both to block a category from becoming its own ancestor and to
// cascade-deactivate a subtree.
const collectDescendantIds = (allCategories, categoryId) => {
  const descendants = new Set()
  const stack = [categoryId]

  while (stack.length > 0) {
    const currentId = stack.pop()
    for (const category of allCategories) {
      if (Number(category.parent_id) === Number(currentId) && !descendants.has(category.id)) {
        descendants.add(category.id)
        stack.push(category.id)
      }
    }
  }

  return descendants
}

const assertValidParent = async (parentId, categoryId = null) => {
  if (parentId === null) return

  const parent = await selectCategoryById(parentId)
  if (!parent) {
    throw new Error("Selected parent category does not exist")
  }

  if (categoryId !== null) {
    if (Number(parentId) === Number(categoryId)) {
      throw new Error("A category cannot be its own parent")
    }

    const allCategories = await selectAllCategoriesIncludingInactive()
    const descendants = collectDescendantIds(allCategories, categoryId)
    if (descendants.has(Number(parentId))) {
      throw new Error("A category cannot be moved under one of its own subcategories")
    }
  }
}

export async function addCategory(categoryInput) {
  const { name, description, parentId, sortOrder } = parseCategoryInput(categoryInput)

  if (!name) {
    throw new Error("Name is required")
  }

  await assertValidParent(parentId)

  const result = await insertCategory({ name, description, parent_id: parentId, sort_order: sortOrder })
  return { id: result.lastID, name, description, parent_id: parentId, sort_order: sortOrder, status: 1 }
}

export async function updateCategory(categoryId, categoryInput) {
  const parsedId = Number(categoryId)
  if (!Number.isFinite(parsedId) || parsedId <= 0) {
    throw new Error("Invalid category ID")
  }

  const existing = await selectCategoryById(parsedId)
  if (!existing) {
    throw new Error("Category not found")
  }

  const { name, description, parentId, sortOrder } = parseCategoryInput(categoryInput)
  if (!name) {
    throw new Error("Name is required")
  }

  await assertValidParent(parentId, parsedId)

  const result = await updateCategoryById(parsedId, {
    name,
    description,
    parent_id: parentId,
    sort_order: sortOrder,
  })

  if (result.changes === 0) {
    throw new Error("Category not found")
  }

  return { id: parsedId, name, description, parent_id: parentId, sort_order: sortOrder }
}

export async function deactivateCategory(categoryId) {
  const parsedId = Number(categoryId)
  if (!Number.isFinite(parsedId) || parsedId <= 0) {
    throw new Error("Invalid category ID")
  }

  const allCategories = await selectAllCategoriesIncludingInactive()
  const descendants = collectDescendantIds(allCategories, parsedId)

  await updateCategoryStatus(parsedId, 0)
  if (descendants.size > 0) {
    await updateCategoriesStatusBulk(Array.from(descendants), 0)
  }

  return { ok: true, deactivatedIds: [parsedId, ...descendants] }
}

export async function reactivateCategory(categoryId) {
  const parsedId = Number(categoryId)
  if (!Number.isFinite(parsedId) || parsedId <= 0) {
    throw new Error("Invalid category ID")
  }

  const result = await updateCategoryStatus(parsedId, 1)
  if (result.changes === 0) {
    throw new Error("Category not found")
  }
  return { ok: true }
}

export async function getCategoryById(id) {
  if (!id) {
    throw new Error("Invalid category ID")
  }
  return await selectCategoryById(id)
}
