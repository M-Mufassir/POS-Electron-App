import {
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
} from "../repositories/dbUtils.js"
import {
  deleteProductBarcodes,
  deleteProductCategory,
  deleteProductById,
  deleteProductCategories,
  deleteProductUnits,
  incrementProductStockById,
  insertProduct,
  insertProductCategory,
  insertProductUnit,
  selectAllProducts,
  selectProductById,
  selectProductCategories,
  selectProductCategoriesByProductId,
  selectProductUnits,
  updateProductById,
  updateProductStatus,
} from "../repositories/productRepository.js"

export async function addProduct(product) {
  const {
    code,
    name,
    description,
    base_price,
    base_unit_id,
    created_at,
    stock_base_qty = 0,
  } = product

  if (!name || !String(name).trim()) {
    throw new Error("Product name is required")
  }

  const parsedBasePrice = Number(base_price)
  const parsedBaseUnitId = Number(base_unit_id)

  if (!Number.isFinite(parsedBasePrice) || parsedBasePrice < 0) {
    throw new Error("Base price must be a valid number")
  }
  if (!Number.isFinite(parsedBaseUnitId) || parsedBaseUnitId <= 0) {
    throw new Error("Base unit is required")
  }

  const result = await insertProduct({
    code,
    name: String(name).trim(),
    description: String(description || "").trim(),
    base_price: parsedBasePrice,
    base_unit_id: parsedBaseUnitId,
    status: 1,
    stock_base_qty: Number(stock_base_qty) || 0,
    created_at: created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  return {
    id: result.lastID,
    code,
    name: String(name).trim(),
    description: String(description || "").trim(),
    base_price: parsedBasePrice,
    base_unit_id: parsedBaseUnitId,
  }
}

export async function getAllProducts() {
  return await selectAllProducts()
}

export async function getProductById(id) {
  const parsedId = Number(id)
  if (!Number.isFinite(parsedId) || parsedId <= 0) {
    throw new Error("Invalid product ID")
  }

  const product = await selectProductById(parsedId)
  if (!product) return null

  const categories = await selectProductCategories(parsedId)
  const units = await selectProductUnits(parsedId)

  return {
    ...product,
    categories,
    units,
  }
}

export async function updateProduct(id, product) {
  const parsedProductId = Number(id)
  if (!Number.isFinite(parsedProductId) || parsedProductId <= 0) {
    throw new Error("Invalid product ID")
  }

  const {
    code,
    name,
    description,
    base_price,
    base_unit_id,
    stock_base_qty = 0,
    status = 1,
    categories = [],
    units = [],
  } = product

  const parsedBasePrice = Number(base_price)
  const parsedBaseUnitId = Number(base_unit_id)
  const parsedStatus = Number(status) === 0 ? 0 : 1
  const parsedStock = Number(stock_base_qty)

  if (!Number.isFinite(parsedBasePrice) || parsedBasePrice < 0) {
    throw new Error("Base price must be a valid number")
  }
  if (!Number.isFinite(parsedBaseUnitId) || parsedBaseUnitId <= 0) {
    throw new Error("Base unit is required")
  }
  if (!Number.isFinite(parsedStock) || parsedStock < 0) {
    throw new Error("Stock must be a valid number")
  }

  try {
    await beginTransaction()

    const updateResult = await updateProductById(parsedProductId, {
      code,
      name,
      description,
      base_price: parsedBasePrice,
      base_unit_id: parsedBaseUnitId,
      stock_base_qty: parsedStock,
      status: parsedStatus,
    })

    if (updateResult.changes === 0) {
      throw new Error("Product not found")
    }

    await deleteProductCategories(parsedProductId)
    for (const categoryId of categories) {
      const parsedCategoryId = Number(categoryId)
      if (!Number.isFinite(parsedCategoryId)) {
        continue
      }
      await insertProductCategory(parsedProductId, parsedCategoryId)
    }

    await deleteProductUnits(parsedProductId)
    for (const unit of units) {
      const parsedUnitId = Number(unit?.unit_id ?? unit?.id)
      const parsedMultiplier = Number(unit?.conversion_multiplier)

      if (
        Number.isNaN(parsedUnitId) ||
        Number.isNaN(parsedMultiplier) ||
        parsedMultiplier <= 0
      ) {
        continue
      }

      await insertProductUnit(parsedProductId, parsedUnitId, parsedMultiplier)
    }

    await commitTransaction()

    return {
      id: parsedProductId,
      code,
      name,
      description,
      base_price: parsedBasePrice,
      base_unit_id: parsedBaseUnitId,
      status: parsedStatus,
      categories,
      units,
    }
  } catch (err) {
    try {
      await rollbackTransaction()
    } catch {
      // Ignore rollback failure
    }
    throw new Error("Failed to update product: " + err.message)
  }
}

export async function deleteProduct(id) {
  const parsedId = Number(id)
  if (!Number.isFinite(parsedId) || parsedId <= 0) {
    throw new Error("Invalid product ID")
  }

  try {
    await beginTransaction()
    await deleteProductBarcodes(parsedId)
    await deleteProductCategories(parsedId)
    await deleteProductUnits(parsedId)

    const deleteResult = await deleteProductById(parsedId)
    if (deleteResult.changes === 0) {
      throw new Error("Product not found")
    }

    await commitTransaction()
  } catch (err) {
    try {
      await rollbackTransaction()
    } catch {
      // Ignore rollback failure
    }
    throw new Error("Failed to delete product: " + err.message)
  }
}

export async function inactivateProduct(id) {
  const parsedId = Number(id)
  if (!Number.isFinite(parsedId) || parsedId <= 0) {
    throw new Error("Invalid product ID")
  }
  await updateProductStatus(parsedId, 0)
}

export async function addProductStock(id, quantity) {
  const parsedId = Number(id)
  const parsedQuantity = Number(quantity)

  if (!Number.isFinite(parsedId) || parsedId <= 0) {
    throw new Error("Invalid product ID")
  }
  if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
    throw new Error("Stock addition must be greater than 0")
  }

  const updateResult = await incrementProductStockById(parsedId, parsedQuantity)
  if (updateResult.changes === 0) {
    throw new Error("Product not found")
  }

  return await getProductById(parsedId)
}

export async function addProductCategory(productId, categoryId) {
  await insertProductCategory(productId, categoryId)
}

export async function removeProductCategory(productId, categoryId) {
  const parsedProductId = Number(productId)
  const parsedCategoryId = Number(categoryId)
  if (!Number.isFinite(parsedProductId) || parsedProductId <= 0) {
    throw new Error("Invalid product ID")
  }
  if (!Number.isFinite(parsedCategoryId) || parsedCategoryId <= 0) {
    throw new Error("Invalid category ID")
  }
  await deleteProductCategory(parsedProductId, parsedCategoryId)
}

export async function getProductCategoriesByProductId(productId) {
  const parsedProductId = Number(productId)
  if (!Number.isFinite(parsedProductId) || parsedProductId <= 0) {
    throw new Error("Invalid product ID")
  }
  return await selectProductCategoriesByProductId(parsedProductId)
}
