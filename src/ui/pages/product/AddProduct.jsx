import React, { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import DynamicForm from "../../components/DynamicForm"
import Banner from "../../components/Banner"
import CategorySection from "./components/CategorySection"
import UnitSection from "./components/UnitSection"
import { useAuth } from "../../context/AuthContext"

function AddProduct() {
  const navigate = useNavigate()
  const [units, setUnits] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategories, setSelectedCategories] = useState([])
  const [selectedUnits, setSelectedUnits] = useState([])
  const [status, setStatus] = useState(1)
  const [productDraft, setProductDraft] = useState({
    created_at: new Date().toISOString().split("T")[0],
    stock_base_qty: 0,
    base_unit_id: "",
  })
  const [saving, setSaving] = useState(false)
  const [banner, setBanner] = useState({ type: "", message: "" })
  const { hasPermission } = useAuth()

  const productFormSchema = useMemo(
    () => [
      {
        name: "name",
        label: "Product Name",
        type: "text",
        required: true,
      },
      {
        name: "code",
        label: "Product Code",
        type: "text",
      },
      {
        name: "description",
        label: "Description",
        type: "textarea",
        fullWidth: true,
      },
      {
        name: "base_price",
        label: "Price",
        type: "number",
      },
      {
        name: "stock_base_qty",
        label: "Stock (Base Unit)",
        type: "number",
      },
      {
        name: "base_unit_id",
        label: "Base Unit",
        type: "select",
        options: units,
      },
      {
        name: "created_at",
        label: "Created At",
        type: "date",
      },
    ],
    [units],
  )

  const sanitizedSelectedUnits = useMemo(() => {
    const baseUnitId = Number(productDraft.base_unit_id)

    return selectedUnits.filter((unit) => Number(unit.unit_id) !== baseUnitId)
  }, [productDraft.base_unit_id, selectedUnits])

  const onSaveProduct = async (product) => {
    setBanner({ type: "", message: "" })
    setSaving(true)

    try {
      const payload = {
        ...product,
        name: String(product?.name || "").trim(),
        code: String(product?.code || "").trim(),
        description: String(product?.description || "").trim(),
        base_price: Number(product?.base_price),
        base_unit_id: Number(product?.base_unit_id),
        stock_base_qty: Number(product?.stock_base_qty),
        created_at: product?.created_at || new Date().toISOString(),
      }

      if (!payload.name) {
        setBanner({ type: "error", message: "Product name is required." })
        return
      }
      if (!Number.isFinite(payload.base_price) || payload.base_price < 0) {
        setBanner({ type: "error", message: "Base price must be a valid number." })
        return
      }
      if (!Number.isFinite(payload.base_unit_id) || payload.base_unit_id <= 0) {
        setBanner({ type: "error", message: "Base unit is required." })
        return
      }
      if (!Number.isFinite(payload.stock_base_qty) || payload.stock_base_qty < 0) {
        setBanner({ type: "error", message: "Stock must be a valid number." })
        return
      }

      const createdProduct = await window.api.addProduct(payload)

      await window.api.updateProduct(createdProduct.id, {
        ...payload,
        status,
        categories: selectedCategories,
        units: sanitizedSelectedUnits,
      })

      navigate(`/products/${createdProduct.id}`)
    } catch (error) {
      console.error("Failed to save product:", error)
      setBanner({ type: "error", message: "Failed to save product. Please try again." })
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    async function fetchDependencies() {
      try {
        const [unitData, categoryData] = await Promise.all([
          window.api.getAllUnits(),
          window.api.getAllCategories(),
        ])

        if (cancelled) return

        setUnits(Array.isArray(unitData) ? unitData : [])
        setCategories(Array.isArray(categoryData) ? categoryData : [])
      } catch (error) {
        console.error("Failed to load product form dependencies:", error)
        if (!cancelled) {
          setBanner({ type: "error", message: "Failed to load units and categories." })
        }
      }
    }

    fetchDependencies()

    return () => {
      cancelled = true
    }
  }, [])

  return !hasPermission("manage_products") ? (
    <div className="pos-container flex justify-center items-center h-screen">
      <div className="text-center">
        <div className="text-lg text-gray-600">You do not have access to add products.</div>
      </div>
    </div>
  ) : (
    <div className="pos-container">
      <div className="pos-header">
        <div>
          <h1 className="pos-section-title">Add New Product</h1>
          <p className="pos-section-subtitle">Create a new product in your inventory</p>
        </div>
      </div>

      <div className="p-6 overflow-y-auto flex-1 space-y-6">
        <Banner
          type={banner.type}
          message={banner.message}
          onClose={() => setBanner({ type: "", message: "" })}
        />

        <button onClick={() => navigate("/products")} className="pos-btn-secondary mb-2 py-2">
          Back to Products
        </button>

        <div className="pos-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="pos-section-title text-base">Product Status</h3>
              <p className="text-sm text-gray-600 mt-1">
                New products start as:
                <span
                  className={`ml-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    status === 1
                      ? "bg-green-100 text-green-800 border border-green-200"
                      : "bg-red-100 text-red-800 border border-red-200"
                  }`}
                >
                  {status === 1 ? "Active" : "Inactive"}
                </span>
              </p>
            </div>
            <button
              type="button"
              className={status === 1 ? "pos-btn-warning" : "pos-btn-success"}
              onClick={() => setStatus((prev) => (prev === 1 ? 0 : 1))}
            >
              {status === 1 ? "Set Inactive" : "Set Active"}
            </button>
          </div>
        </div>

        <CategorySection
          categories={categories}
          selectedCategories={selectedCategories}
          onChange={setSelectedCategories}
        />

        <UnitSection
          units={units}
          selectedUnits={sanitizedSelectedUnits}
          excludedUnitIds={[productDraft.base_unit_id]}
          onChange={setSelectedUnits}
        />

        <DynamicForm
          schema={productFormSchema}
          initialValues={productDraft}
          title="Create Product"
          subtitle="Add a new product to your inventory"
          submitLabel={saving ? "Saving..." : "Save Product"}
          onSubmit={onSaveProduct}
          onValuesChange={setProductDraft}
          resetOnSubmit={false}
        />
      </div>
    </div>
  )
}

export default AddProduct
