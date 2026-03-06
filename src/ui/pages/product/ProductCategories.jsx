import React, { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import Banner from "../../components/Banner"

function ProductCategories() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [savingSelection, setSavingSelection] = useState(false)
  const [deletingCategoryId, setDeletingCategoryId] = useState(null)
  const [productCategories, setProductCategories] = useState([])
  const [allCategories, setAllCategories] = useState([])
  const [selectedToAdd, setSelectedToAdd] = useState([])
  const [showAddExisting, setShowAddExisting] = useState(false)
  const [banner, setBanner] = useState({ type: "", message: "" })

  const productId = Number(id)
  const hasValidProductId = Number.isFinite(productId) && productId > 0

  useEffect(() => {
    let cancelled = false

    const fetchData = async () => {
      if (!hasValidProductId) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const [categories, assignedCategories] = await Promise.all([
          window.api.getAllCategories(),
          window.api.getProductCategoriesByProductId(productId),
        ])

        if (!cancelled) {
          setAllCategories(Array.isArray(categories) ? categories : [])
          setProductCategories(Array.isArray(assignedCategories) ? assignedCategories : [])
        }
      } catch (error) {
        console.error("Failed to fetch product categories:", error)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      cancelled = true
    }
  }, [hasValidProductId, productId])

  const refreshAssignedCategories = async () => {
    if (!hasValidProductId) return
    const assignedCategories = await window.api.getProductCategoriesByProductId(productId)
    setProductCategories(Array.isArray(assignedCategories) ? assignedCategories : [])
  }

  const availableCategories = useMemo(() => {
    const assignedIds = new Set(productCategories.map((category) => category.id))
    return allCategories.filter((category) => !assignedIds.has(category.id))
  }, [allCategories, productCategories])

  const toggleSelectCategory = (categoryId) => {
    setSelectedToAdd((prev) =>
      prev.includes(categoryId)
        ? prev.filter((idValue) => idValue !== categoryId)
        : [...prev, categoryId],
    )
  }

  const handleSaveSelected = async () => {
    if (!hasValidProductId || selectedToAdd.length === 0) return

    setBanner({ type: "", message: "" })
    setSavingSelection(true)
    try {
      for (const categoryId of selectedToAdd) {
        await window.api.addProductCategory(productId, categoryId)
      }
      await refreshAssignedCategories()
      setSelectedToAdd([])
      setShowAddExisting(false)
      setBanner({ type: "success", message: "Categories added successfully." })
    } catch (error) {
      console.error("Failed to save selected categories:", error)
      setBanner({ type: "error", message: "Failed to add categories. Please try again." })
    } finally {
      setSavingSelection(false)
    }
  }

  const handleDeleteCategory = async (categoryId) => {
    if (!hasValidProductId) return

    setBanner({ type: "", message: "" })
    setDeletingCategoryId(categoryId)
    try {
      await window.api.removeProductCategory(productId, categoryId)
      await refreshAssignedCategories()
      setBanner({ type: "success", message: "Category removed successfully." })
    } catch (error) {
      console.error("Failed to remove product category:", error)
      setBanner({ type: "error", message: "Failed to remove category. Please try again." })
    } finally {
      setDeletingCategoryId(null)
    }
  }

  if (loading) {
    return (
      <div className="pos-container flex justify-center items-center h-screen">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Loading product categories...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pos-container">
      <div className="pos-header">
        <div>
          <h1 className="pos-section-title">Product Categories</h1>
          <p className="pos-section-subtitle">Manage category assignments for this product</p>
        </div>
      </div>

      <div className="p-6 overflow-y-auto flex-1 space-y-6">
        <Banner
          type={banner.type}
          message={banner.message}
          onClose={() => setBanner({ type: "", message: "" })}
        />

        <button onClick={() => navigate(`/products/${id}`)} className="pos-btn-secondary">
          Back to Product Details
        </button>

        <div className="pos-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="pos-section-title text-base">Assigned Categories</h3>
            <button
              type="button"
              className="pos-btn-secondary"
              onClick={() => setShowAddExisting((prev) => !prev)}
            >
              {showAddExisting ? "Hide Add Existing" : "Add Existing Categories"}
            </button>
          </div>

          {productCategories.length === 0 ? (
            <div className="bg-gray-50 border border-gray-300 p-4 rounded-lg text-gray-600 text-sm">
              No categories assigned yet.
            </div>
          ) : (
            <div className="space-y-3">
              {productCategories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between border border-slate-200 bg-slate-50 p-3 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-800">{category.name}</p>
                    {category.description ? (
                      <p className="text-sm text-gray-500">{category.description}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    className="pos-btn-danger"
                    disabled={deletingCategoryId === category.id}
                    onClick={() => handleDeleteCategory(category.id)}
                  >
                    {deletingCategoryId === category.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {showAddExisting && (
            <div className="border border-slate-200 p-4 bg-slate-50 rounded-lg space-y-4">
              <h3 className="pos-section-title text-base">Add From Existing Categories</h3>

              {availableCategories.length === 0 ? (
                <p className="text-gray-600 text-sm">All categories are already assigned.</p>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availableCategories.map((category) => (
                      <label
                        key={category.id}
                        className="flex items-center gap-3 border border-slate-200 bg-white p-3 rounded-lg"
                      >
                        <input
                          type="checkbox"
                          checked={selectedToAdd.includes(category.id)}
                          onChange={() => toggleSelectCategory(category.id)}
                        />
                        <span className="text-sm text-gray-700">{category.name}</span>
                      </label>
                    ))}
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      className="pos-btn-secondary"
                      onClick={() => setSelectedToAdd([])}
                      disabled={savingSelection || selectedToAdd.length === 0}
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      className="pos-btn-primary"
                      onClick={handleSaveSelected}
                      disabled={savingSelection || selectedToAdd.length === 0}
                    >
                      {savingSelection
                        ? "Saving..."
                        : `Save Selected (${selectedToAdd.length})`}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductCategories
