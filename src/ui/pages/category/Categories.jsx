import { useCallback, useEffect, useMemo, useState } from "react"
import Banner from "../../components/Banner"
import AddCategoryCard from "./Components/AddCategoryCard"
import { useAuth } from "../../context/AuthContext"

function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [savingCategory, setSavingCategory] = useState(false)
  const [banner, setBanner] = useState({ type: "", message: "" })
  const { hasPermission } = useAuth()

  const fetchCategories = useCallback(async (showInitialLoading = false) => {
    if (showInitialLoading) {
      setLoading(true)
    } else {
      setRefreshing(true)
    }

    try {
      const data = await window.api.getCategoriesWithProductCounts()
      const normalized = Array.isArray(data)
        ? data.map((category) => ({
            ...category,
            product_count: Number(category.product_count || 0),
          }))
        : []
      setCategories(normalized)
    } catch (error) {
      console.error("Failed to fetch categories:", error)
      setBanner({ type: "error", message: "Failed to load categories. Please try again." })
    } finally {
      if (showInitialLoading) {
        setLoading(false)
      } else {
        setRefreshing(false)
      }
    }
  }, [])

  useEffect(() => {
    fetchCategories(true)
  }, [fetchCategories])

  const summary = useMemo(() => {
    const totalCategories = categories.length
    const totalAssignments = categories.reduce(
      (sum, category) => sum + Number(category.product_count || 0),
      0,
    )
    const categoriesWithProducts = categories.filter(
      (category) => Number(category.product_count || 0) > 0,
    ).length

    return {
      totalCategories,
      totalAssignments,
      categoriesWithProducts,
    }
  }, [categories])

  const handleAddCategory = async (categoryData) => {
    setSavingCategory(true)
    setBanner({ type: "", message: "" })

    try {
      await window.api.addCategory(categoryData)
      setIsAddModalOpen(false)
      setBanner({ type: "success", message: "Category added successfully." })
      await fetchCategories(false)
    } catch (error) {
      console.error("Failed to add category:", error)

      let message = "Failed to add category. Please try again."
      if (typeof error?.message === "string" && error.message.toLowerCase().includes("unique")) {
        message = "A category with this name already exists."
      }

      throw new Error(message)
    } finally {
      setSavingCategory(false)
    }
  }

  if (loading) {
    return (
      <div className="pos-container flex justify-center items-center h-screen">
        <p className="text-lg text-gray-600">Loading categories...</p>
      </div>
    )
  }

  if (!hasPermission("manage_catalog")) {
    return (
      <div className="pos-container flex justify-center items-center h-screen">
        <p className="text-lg text-gray-600">You do not have access to manage categories.</p>
      </div>
    )
  }

  return (
    <div className="pos-container">
      <div className="pos-header">
        <div>
          <h1 className="pos-section-title">Categories</h1>
          <p className="pos-section-subtitle">
            View all categories and product distribution by category
          </p>
        </div>
      </div>

      <div className="p-6 overflow-y-auto flex-1 space-y-6">
        <Banner
          type={banner.type}
          message={banner.message}
          onClose={() => setBanner({ type: "", message: "" })}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            {refreshing ? "Refreshing category list..." : "Keep categories organized for faster billing."}
          </p>
          <button className="pos-btn-success" onClick={() => setIsAddModalOpen(true)}>
            Add New Category
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="pos-card">
            <p className="text-sm text-slate-500">Total Categories</p>
            <p className="text-3xl font-bold text-slate-800 mt-2">{summary.totalCategories}</p>
          </div>
          <div className="pos-card">
            <p className="text-sm text-slate-500">Total Product Assignments</p>
            <p className="text-3xl font-bold text-slate-800 mt-2">{summary.totalAssignments}</p>
          </div>
          <div className="pos-card">
            <p className="text-sm text-slate-500">Categories With Products</p>
            <p className="text-3xl font-bold text-slate-800 mt-2">{summary.categoriesWithProducts}</p>
          </div>
        </div>

        <div className="space-y-3">
          {categories.length === 0 ? (
            <div className="pos-card">
              <p className="text-slate-600">No categories yet. Add your first category.</p>
            </div>
          ) : (
            categories.map((category) => (
              <div
                key={category.id}
                className="pos-card flex flex-wrap items-center justify-between gap-4"
              >
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">{category.name}</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {category.description || "No description provided."}
                  </p>
                </div>

                <div className="bg-slate-100 border border-slate-200 px-4 py-2 min-w-36 text-center">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Products</p>
                  <p className="text-2xl font-bold text-slate-800">{category.product_count}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <AddCategoryCard
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddCategory}
        saving={savingCategory}
      />
    </div>
  )
}

export default Categories
