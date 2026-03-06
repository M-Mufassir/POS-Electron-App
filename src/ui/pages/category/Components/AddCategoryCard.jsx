import { useEffect, useState } from "react"

function AddCategoryCard({ isOpen, onClose, onSubmit, saving }) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isOpen) return

    setName("")
    setDescription("")
    setError("")
  }, [isOpen])

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
      await onSubmit({ name: trimmedName, description: trimmedDescription })
    } catch (submitError) {
      setError(submitError?.message || "Failed to add category.")
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/45 flex items-center justify-center p-4"
      onMouseDown={handleBackdropMouseDown}
    >
      <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-md p-6">
        <h3 className="text-xl font-bold text-slate-800">Add New Category</h3>
        <p className="text-sm text-slate-500 mt-1 mb-5">
          Create a category to organize your products.
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
              {saving ? "Saving..." : "Save Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddCategoryCard
