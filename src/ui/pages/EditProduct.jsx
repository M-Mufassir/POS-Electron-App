import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import DynamicForm from "../components/DynamicForm"

export default function EditProduct() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [product, setProduct] = useState(null)
  const [units, setUnits] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategories, setSelectedCategories] = useState([])
  const [selectedUnits, setSelectedUnits] = useState([])
  const [showCategoryEditor, setShowCategoryEditor] = useState(false)
  const [showUnitEditor, setShowUnitEditor] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const numericId = Number(id)
        const [productData, allUnits, allCategories] = await Promise.all([
          window.api.getProductById(numericId),
          window.api.getAllUnits(),
          window.api.getAllCategories(),
        ])

        setProduct(productData)
        setUnits(Array.isArray(allUnits) ? allUnits : [])
        setCategories(Array.isArray(allCategories) ? allCategories : [])
        setSelectedCategories((productData?.categories || []).map((category) => category.id))
        setSelectedUnits(
          (productData?.units || []).map((unit) => ({
            unit_id: unit.id,
            conversion_multiplier: Number(unit.conversion_multiplier) || 1,
          })),
        )
      } catch (error) {
        console.error("Failed to fetch product edit data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchData()
    }
  }, [id])

  const formSchema = useMemo(
    () => [
      { name: "name", label: "Product Name", type: "text", required: true },
      { name: "code", label: "Product Code", type: "text" },
      { name: "base_price", label: "Base Unit Price", type: "number", required: true },
      {
        name: "base_unit_id",
        label: "Base Unit",
        type: "select",
        options: units,
        required: true,
      },
      {
        name: "description",
        label: "Description",
        type: "textarea",
        fullWidth: true,
      },
    ],
    [units],
  )

  const initialValues = useMemo(
    () => ({
      name: product?.name || "",
      code: product?.code || "",
      description: product?.description || "",
      base_price: product?.base_price ?? "",
      base_unit_id: product?.base_unit_id ?? "",
    }),
    [product],
  )

  const toggleCategory = (categoryId) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((idValue) => idValue !== categoryId)
        : [...prev, categoryId],
    )
  }

  const toggleUnit = (unitId) => {
    setSelectedUnits((prev) => {
      const exists = prev.some((entry) => entry.unit_id === unitId)
      if (exists) {
        return prev.filter((entry) => entry.unit_id !== unitId)
      }
      return [...prev, { unit_id: unitId, conversion_multiplier: 1 }]
    })
  }

  const updateUnitMultiplier = (unitId, value) => {
    const parsedValue = Number(value)
    setSelectedUnits((prev) =>
      prev.map((entry) =>
        entry.unit_id === unitId
          ? {
              ...entry,
              conversion_multiplier: Number.isNaN(parsedValue) ? 1 : parsedValue,
            }
          : entry,
      ),
    )
  }

  const handleUpdateProduct = async (formValues) => {
    setSaving(true)
    try {
      const numericId = Number(id)
      await window.api.updateProduct(numericId, {
        ...formValues,
        base_price: Number(formValues.base_price) || 0,
        base_unit_id: Number(formValues.base_unit_id),
        categories: selectedCategories,
        units: selectedUnits,
      })
      navigate(`/products/${numericId}`)
    } catch (error) {
      console.error("Failed to update product:", error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="pos-container flex justify-center items-center h-screen">
        <div className="text-lg text-gray-600">Loading product editor...</div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="pos-container flex flex-col items-center justify-center h-screen">
        <p className="text-gray-600 text-lg mb-6">Product not found.</p>
        <button onClick={() => navigate("/")} className="pos-btn-primary">
          Back to Products
        </button>
      </div>
    )
  }

  return (
    <div className="pos-container">
      <div className="pos-header">
        <div>
          <h1 className="pos-section-title">Edit Product</h1>
          <p className="pos-section-subtitle">Update product details, categories, and units</p>
        </div>
      </div>

      <div className="p-6 overflow-y-auto flex-1 space-y-6">
        <button onClick={() => navigate(`/products/${id}`)} className="pos-btn-secondary">
          Back to Product Details
        </button>

        <div className="pos-card p-6">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="pos-btn-secondary"
              onClick={() => setShowCategoryEditor((prev) => !prev)}
            >
              {showCategoryEditor ? "Hide Categories" : "Edit Categories"}
            </button>
            <button
              type="button"
              className="pos-btn-secondary"
              onClick={() => setShowUnitEditor((prev) => !prev)}
            >
              {showUnitEditor ? "Hide Units" : "Edit Units"}
            </button>
          </div>

          {showCategoryEditor && (
            <div className="mt-5 border border-slate-200 p-4 bg-slate-50">
              <h3 className="pos-section-title text-base mb-3">Categories</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {categories.map((category) => (
                  <label
                    key={category.id}
                    className="flex items-center gap-2 border border-slate-200 bg-white p-3"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category.id)}
                      onChange={() => toggleCategory(category.id)}
                    />
                    <span className="text-sm">{category.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {showUnitEditor && (
            <div className="mt-5 border border-slate-200 p-4 bg-slate-50">
              <h3 className="pos-section-title text-base mb-3">Units</h3>
              <div className="space-y-3">
                {units.map((unit) => {
                  const selectedUnit = selectedUnits.find((entry) => entry.unit_id === unit.id)
                  const isChecked = Boolean(selectedUnit)

                  return (
                    <div key={unit.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleUnit(unit.id)}
                        />
                        <span>{unit.name} ({unit.symbol})</span>
                      </label>
                      <div>
                        <input
                          type="number"
                          step="0.0001"
                          min="0"
                          className="pos-input"
                          disabled={!isChecked}
                          value={selectedUnit?.conversion_multiplier ?? ""}
                          onChange={(event) => updateUnitMultiplier(unit.id, event.target.value)}
                          placeholder="Conversion multiplier"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <DynamicForm
          schema={formSchema}
          initialValues={initialValues}
          onSubmit={handleUpdateProduct}
          title="Product Information"
          subtitle="Edit the core details for this product"
          submitLabel={saving ? "Updating..." : "Update Product"}
          resetOnSubmit={false}
          footerActions={
            <button
              type="button"
              className="pos-btn-secondary"
              onClick={() => navigate(`/products/${id}`)}
            >
              Cancel
            </button>
          }
        />
      </div>
    </div>
  )
}
