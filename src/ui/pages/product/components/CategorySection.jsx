import React, { useEffect, useMemo, useState } from "react"

export default function CategorySection({
  categories = [],
  selectedCategories = [],
  defaultOpen = false,
  onChange,
}) {
  const [showEditor, setShowEditor] = useState(defaultOpen)

  useEffect(() => {
    setShowEditor(defaultOpen)
  }, [defaultOpen])

  const selectedSet = useMemo(() => new Set(selectedCategories), [selectedCategories])

  const toggleCategory = (categoryId) => {
    if (selectedSet.has(categoryId)) {
      onChange(selectedCategories.filter((idValue) => idValue !== categoryId))
      return
    }
    onChange([...selectedCategories, categoryId])
  }

  return (
    <div className="pos-card p-6">
      <div className="flex items-center justify-between">
        <h3 className="pos-section-title text-base">Categories</h3>
        <button
          type="button"
          className="pos-btn-secondary"
          onClick={() => setShowEditor((prev) => !prev)}
        >
          {showEditor ? "Hide Categories" : "Edit Categories"}
        </button>
      </div>

      {showEditor && (
        <div className="mt-5 border border-slate-200 p-4 bg-slate-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {categories.map((category) => (
              <label
                key={category.id}
                className="flex items-center gap-2 border border-slate-200 bg-white p-3 rounded-lg"
              >
                <input
                  type="checkbox"
                  checked={selectedSet.has(category.id)}
                  onChange={() => toggleCategory(category.id)}
                />
                <span className="text-sm">{category.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
