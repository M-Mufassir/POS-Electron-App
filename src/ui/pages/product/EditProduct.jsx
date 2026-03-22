import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import DynamicForm from "../../components/DynamicForm"
import Banner from "../../components/Banner"
import CategorySection from "./components/CategorySection"
import UnitSection from "./components/UnitSection"
import { useAuth } from "../../context/AuthContext"

const buildProductFormValues = (productData) => ({
  name: productData?.name || "",
  code: productData?.code || "",
  description: productData?.description || "",
  base_price: productData?.base_price ?? "",
  base_unit_id: productData?.base_unit_id ?? "",
  stock_base_qty: productData?.stock_base_qty ?? 0,
})

const formatQuantity = (value) => {
  const amount = Number(value || 0)
  if (!Number.isFinite(amount)) return "0"
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2).replace(/\.?0+$/, "")
}

export default function EditProduct() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingProduct, setDeletingProduct] = useState(false)
  const [addingStock, setAddingStock] = useState(false)
  const [showStockAdder, setShowStockAdder] = useState(false)
  const [stockToAdd, setStockToAdd] = useState("")
  const [product, setProduct] = useState(null)
  const [units, setUnits] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategories, setSelectedCategories] = useState([])
  const [selectedUnits, setSelectedUnits] = useState([])
  const [formValues, setFormValues] = useState({})
  const [status, setStatus] = useState(1)
  const [banner, setBanner] = useState({ type: "", message: "" })
  const { hasPermission } = useAuth()

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
        setStatus(Number(productData?.status) === 0 ? 0 : 1)
        setSelectedCategories((productData?.categories || []).map((category) => category.id))
        setSelectedUnits(
          (productData?.units || []).map((unit) => ({
            unit_id: unit.id,
            conversion_multiplier: Number(unit.conversion_multiplier) || 1,
          })),
        )
        setFormValues(buildProductFormValues(productData))
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
      { name: "stock_base_qty", label: "Stock (Base Unit)", type: "number", required: true },
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

  const currentStock = Math.max(0, Number(product?.stock_base_qty || 0))
  const baseUnitLabel = product?.base_unit_symbol || product?.base_unit_name || "base units"
  const handleGoBack = () => {
    const canGoBack = Number(window.history?.state?.idx) > 0
    if (canGoBack) {
      navigate(-1)
      return
    }

    if (id) {
      navigate(`/products/${id}`)
      return
    }

    navigate("/products")
  }

  const handleUpdateProduct = async (nextFormValues) => {
    setBanner({ type: "", message: "" })
    setSaving(true)
    try {
      const numericId = Number(id)
      const sanitizedUnits = selectedUnits.filter(
        (unit) => Number(unit.unit_id) !== Number(nextFormValues.base_unit_id),
      )
      await window.api.updateProduct(numericId, {
        ...nextFormValues,
        base_price: Number(nextFormValues.base_price) || 0,
        base_unit_id: Number(nextFormValues.base_unit_id),
        stock_base_qty: Number(nextFormValues.stock_base_qty) || 0,
        status: Number(status) === 0 ? 0 : 1,
        categories: selectedCategories,
        units: sanitizedUnits,
      })

      navigate(`/products/${numericId}`)
    } catch (error) {
      console.error("Failed to update product:", error)
      setBanner({ type: "error", message: error?.message || "Failed to update product. Please try again." })
    } finally {
      setSaving(false)
    }
  }

  const handleAddStock = async (event) => {
    event.preventDefault()
    setBanner({ type: "", message: "" })

    const quantity = Number(stockToAdd)
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setBanner({ type: "warning", message: "Enter a stock amount greater than 0." })
      return
    }

    setAddingStock(true)
    try {
      const updatedProduct = await window.api.addProductStock(Number(id), quantity)
      setProduct(updatedProduct)
      setFormValues((prev) => ({
        ...prev,
        stock_base_qty: updatedProduct?.stock_base_qty ?? prev.stock_base_qty,
      }))
      setStockToAdd("")
      setBanner({
        type: "success",
        message: `Stock added successfully. Remaining stock is now ${formatQuantity(updatedProduct?.stock_base_qty)} ${updatedProduct?.base_unit_symbol || updatedProduct?.base_unit_name || "base units"}.`,
      })
    } catch (error) {
      console.error("Failed to add product stock:", error)
      setBanner({ type: "error", message: error?.message || "Failed to add stock. Please try again." })
    } finally {
      setAddingStock(false)
    }
  }

  const handleDeleteProduct = async () => {
    const shouldDelete = window.confirm(
      "Delete this product permanently? This will also remove related barcodes and product mappings.",
    )
    if (!shouldDelete) return

    setBanner({ type: "", message: "" })
    setDeletingProduct(true)

    try {
      await window.api.deleteProduct(Number(id))
      navigate("/products")
    } catch (error) {
      console.error("Failed to delete product:", error)
      setBanner({ type: "error", message: "Failed to delete product. Please try again." })
    } finally {
      setDeletingProduct(false)
    }
  }

  if (loading) {
    return (
      <div className="pos-container flex justify-center items-center h-screen">
        <div className="text-lg text-gray-600">Loading product editor...</div>
      </div>
    )
  }

  if (!hasPermission("manage_products")) {
    return (
      <div className="pos-container flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="text-lg text-gray-600">You do not have access to edit products.</div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="pos-container flex flex-col items-center justify-center h-screen">
        <p className="text-gray-600 text-lg mb-6">Product not found.</p>
        <button type="button" onClick={() => navigate("/products")} className="pos-btn-primary">
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
        <Banner
          type={banner.type}
          message={banner.message}
          onClose={() => setBanner({ type: "", message: "" })}
        />

        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={handleGoBack} className="pos-btn-secondary">
            Go Back
          </button>
          <button
            type="button"
            onClick={() => navigate(`/barcodes?productId=${id}`)}
            className="pos-btn-success"
          >
            Manage Barcodes
          </button>
          <button
            type="button"
            className={showStockAdder ? "pos-btn-secondary" : "pos-btn-primary"}
            onClick={() => {
              setShowStockAdder((prev) => !prev)
              setStockToAdd("")
            }}
          >
            {showStockAdder ? "Hide Add Stock" : "Add Stock"}
          </button>
        </div>

        {showStockAdder ? (
          <div className="pos-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="pos-section-title text-base">Add Stock</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Add more stock to the current remaining quantity without overwriting it.
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-right min-w-[200px]">
                <p className="text-xs uppercase tracking-wide text-gray-500">Current Remaining</p>
                <strong className="block text-lg text-slate-800 mt-1">
                  {formatQuantity(currentStock)} {baseUnitLabel}
                </strong>
              </div>
            </div>

            <form onSubmit={handleAddStock} className="mt-5 space-y-4">
              <div className="pos-form-group max-w-md">
                <label className="pos-label">Stock To Add ({baseUnitLabel})</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  className="pos-input"
                  value={stockToAdd}
                  onChange={(event) => setStockToAdd(event.target.value)}
                  placeholder={`Enter stock amount in ${baseUnitLabel}`}
                />
              </div>

              <p className="text-xs text-gray-500">
                New remaining stock will be current remaining + entered amount.
              </p>

              <div className="flex flex-wrap gap-3">
                <button type="submit" className="pos-btn-primary" disabled={addingStock}>
                  {addingStock ? "Adding..." : "Add to Remaining"}
                </button>
                <button
                  type="button"
                  className="pos-btn-secondary"
                  onClick={() => {
                    setShowStockAdder(false)
                    setStockToAdd("")
                  }}
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        ) : null}

        <div className="pos-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="pos-section-title text-base">Product Status</h3>
              <p className="text-sm text-gray-600 mt-1">
                Current status:
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
              <p className="text-xs text-gray-500 mt-2">Status is saved when you click Update Product.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm text-emerald-900">
                Remaining stock: <strong>{formatQuantity(currentStock)} {baseUnitLabel}</strong>
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
        </div>

        <CategorySection
          categories={categories}
          selectedCategories={selectedCategories}
          onChange={setSelectedCategories}
        />

        <UnitSection
          units={units}
          selectedUnits={selectedUnits}
          excludedUnitIds={[formValues.base_unit_id || product?.base_unit_id]}
          onChange={setSelectedUnits}
        />

        <DynamicForm
          schema={formSchema}
          initialValues={formValues}
          onValuesChange={setFormValues}
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
              Product Details
            </button>
          }
        />

        {hasPermission("delete_product") && (
          <div className="pos-card p-6">
            <h3 className="pos-section-title text-base text-red-700">Danger Zone</h3>
            <p className="text-sm text-gray-600 mt-1 mb-4">
              Permanently delete this product and related product mappings.
            </p>
            <button
              type="button"
              className="pos-btn-danger"
              disabled={deletingProduct}
              onClick={handleDeleteProduct}
            >
              {deletingProduct ? "Deleting..." : "Delete Product"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
