import { useEffect, useMemo, useState } from "react"
import { buildCategoryTree, collectSubtreeIds, flattenCategoryTree } from "../../../utils/categoryTree"

// Handles both "Add category" / "Add subcategory" and "Edit category".
// `editingCategory` (null for create) and `defaultParentId` (pre-selects a
// parent when adding a subcategory from a tree row) drive the two modes.
function CategoryFormModal({ isOpen, onClose, onSubmit, saving, categories, editingCategory, defaultParentId }) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [parentId, setParentId] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isOpen) return

    setName(editingCategory?.name || "")
    setDescription(editingCategory?.description || "")
    setParentId(
      editingCategory
        ? String(editingCategory.parent_id || "")
        : defaultParentId
          ? String(defaultParentId)
          : "",
    )
    setError("")
  }, [isOpen, editingCategory, defaultParentId])

  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (event) => {
      if (event.key === "Escape" && !saving) {
        onClose()
      }
    }

    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [isOpen, onClose, saving])

  const parentOptions = useMemo(() => {
    const excludedIds = editingCategory
      ? collectSubtreeIds(categories, editingCategory.id)
      : new Set()

    const tree = buildCategoryTree(categories.filter((category) => !excludedIds.has(category.id)))
    return flattenCategoryTree(tree)
  }, [categories, editingCategory])

  if (!isOpen) return null

  const handleBackdropMouseDown = (event) => {
    if (event.target === event.currentTarget && !saving) {
      onClose()
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const trimmedName = name.trim()
    const trimmedDescription = description.trim()

    if (!trimmedName) {
      setError("Category name is required.")
      return
    }

    setError("")

    try {
      await onSubmit({
        name: trimmedName,
        description: trimmedDescription,
        parent_id: parentId ? Number(parentId) : null,
      })
    } catch (submitError) {
      setError(submitError?.message || "Failed to save category.")
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/45 flex items-center justify-center p-4"
      onMouseDown={handleBackdropMouseDown}
    >
      <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-md p-6">
        <h3 className="text-xl font-bold text-slate-800">
          {editingCategory ? "Edit Category" : "Add New Category"}
        </h3>
        <p className="text-sm text-slate-500 mt-1 mb-5">
          {editingCategory ? "Update this category's details." : "Create a category to organize your products."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="pos-form-group">
            <label htmlFor="category-name" className="pos-label">Name</label>
            <input
              id="category-name"
              type="text"
              className="pos-input"
              placeholder="Category name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={saving}
              autoFocus
            />
          </div>

          <div className="pos-form-group">
            <label htmlFor="category-parent" className="pos-label">Parent Category (optional)</label>
            <select
              id="category-parent"
              className="pos-input"
              value={parentId}
              onChange={(event) => setParentId(event.target.value)}
              disabled={saving}
            >
              <option value="">No parent (top level)</option>
              {parentOptions.map(({ category, depth }) => (
                <option key={category.id} value={category.id}>
                  {"— ".repeat(depth)}{category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="pos-form-group">
            <label htmlFor="category-description" className="pos-label">Description (optional)</label>
            <textarea
              id="category-description"
              className="pos-input"
              rows={3}
              placeholder="Describe this category"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={saving}
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="pos-btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="pos-btn-primary" disabled={saving}>
              {saving ? "Saving..." : editingCategory ? "Save Changes" : "Save Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CategoryFormModal
