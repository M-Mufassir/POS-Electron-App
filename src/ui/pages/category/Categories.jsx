import { useCallback, useEffect, useMemo, useState } from "react"
import Banner from "../../components/Banner"
import CategoryFormModal from "./Components/CategoryFormModal"
import { useAuth } from "../../context/AuthContext"
import { buildCategoryTree, getSubtreeProductCount } from "../../utils/categoryTree"

function CategoryRow({ node, depth, onEdit, onAddSubcategory, onDeactivate }) {
  const rolledUpCount = getSubtreeProductCount(node)

  return (
    <>
      <div className="pos-card flex flex-wrap items-center justify-between gap-4">
        <div style={{ paddingLeft: `${depth * 24}px` }}>
          <h3 className="text-lg font-semibold text-slate-800">
            {depth > 0 ? <span className="text-slate-400 mr-1">└</span> : null}
            {node.name}
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            {node.description || "No description provided."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-100 border border-slate-200 px-4 py-2 min-w-36 text-center">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Products</p>
            <p className="text-2xl font-bold text-slate-800">{rolledUpCount}</p>
          </div>
          <button type="button" className="pos-btn-secondary" onClick={() => onAddSubcategory(node)}>
            Add Subcategory
          </button>
          <button type="button" className="pos-btn-secondary" onClick={() => onEdit(node)}>
            Edit
          </button>
          <button type="button" className="pos-btn-danger" onClick={() => onDeactivate(node)}>
            Deactivate
          </button>
        </div>
      </div>

      {node.children.map((child) => (
        <CategoryRow
          key={child.id}
          node={child}
          depth={depth + 1}
          onEdit={onEdit}
          onAddSubcategory={onAddSubcategory}
          onDeactivate={onDeactivate}
        />
      ))}
    </>
  )
}

function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [defaultParentId, setDefaultParentId] = useState(null)
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

  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories])

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

  const openAddModal = () => {
    setEditingCategory(null)
    setDefaultParentId(null)
    setIsFormOpen(true)
  }

  const openAddSubcategoryModal = (parentCategory) => {
    setEditingCategory(null)
    setDefaultParentId(parentCategory.id)
    setIsFormOpen(true)
  }

  const openEditModal = (category) => {
    setEditingCategory(category)
    setDefaultParentId(null)
    setIsFormOpen(true)
  }

  const handleSubmitCategory = async (categoryData) => {
    setSavingCategory(true)
    setBanner({ type: "", message: "" })

    try {
      if (editingCategory) {
        await window.api.updateCategory(editingCategory.id, categoryData)
        setBanner({ type: "success", message: "Category updated successfully." })
      } else {
        await window.api.addCategory(categoryData)
        setBanner({ type: "success", message: "Category added successfully." })
      }
      setIsFormOpen(false)
      await fetchCategories(false)
    } catch (error) {
      console.error("Failed to save category:", error)

      let message = error?.message || "Failed to save category. Please try again."
      if (typeof error?.message === "string" && error.message.toLowerCase().includes("unique")) {
        message = "A category with this name already exists."
      }

      throw new Error(message)
    } finally {
      setSavingCategory(false)
    }
  }

  const handleDeactivate = async (category) => {
    const confirmed = window.confirm(
      `Deactivate "${category.name}"? Its subcategories will be deactivated too.`,
    )
    if (!confirmed) return

    setBanner({ type: "", message: "" })
    try {
      await window.api.deactivateCategory(category.id)
      setBanner({ type: "success", message: "Category deactivated." })
      await fetchCategories(false)
    } catch (error) {
      console.error("Failed to deactivate category:", error)
      setBanner({ type: "error", message: error?.message || "Failed to deactivate category." })
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
            Organize products into a category tree for faster billing and browsing
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
          <button className="pos-btn-success" onClick={openAddModal}>
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
          {categoryTree.length === 0 ? (
            <div className="pos-card">
              <p className="text-slate-600">No categories yet. Add your first category.</p>
            </div>
          ) : (
            categoryTree.map((node) => (
              <CategoryRow
                key={node.id}
                node={node}
                depth={0}
                onEdit={openEditModal}
                onAddSubcategory={openAddSubcategoryModal}
                onDeactivate={handleDeactivate}
              />
            ))
          )}
        </div>
      </div>

      <CategoryFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmitCategory}
        saving={savingCategory}
        categories={categories}
        editingCategory={editingCategory}
        defaultParentId={defaultParentId}
      />
    </div>
  )
}

export default Categories
