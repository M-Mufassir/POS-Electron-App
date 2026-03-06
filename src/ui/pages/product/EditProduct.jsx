import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import DynamicForm from "../../components/DynamicForm"
import Banner from "../../components/Banner"
import CategorySection from "./components/CategorySection"
import UnitSection from "./components/UnitSection"

export default function EditProduct() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingProduct, setDeletingProduct] = useState(false)
  const [product, setProduct] = useState(null)
  const [units, setUnits] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategories, setSelectedCategories] = useState([])
  const [selectedUnits, setSelectedUnits] = useState([])
  const [status, setStatus] = useState(1)
  const [banner, setBanner] = useState({ type: "", message: "" })

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

  const handleUpdateProduct = async (formValues) => {
    setBanner({ type: "", message: "" })
    setSaving(true)
    try {
      const numericId = Number(id)
      await window.api.updateProduct(numericId, {
        ...formValues,
        base_price: Number(formValues.base_price) || 0,
        base_unit_id: Number(formValues.base_unit_id),
        status: Number(status) === 0 ? 0 : 1,
        categories: selectedCategories,
        units: selectedUnits,
      })
      const latestProduct = await window.api.getProductById(numericId)
      setProduct(latestProduct)
      setStatus(Number(latestProduct?.status) === 0 ? 0 : 1)
      setBanner({ type: "success", message: "Product updated successfully." })
    } catch (error) {
      console.error("Failed to update product:", error)
      setBanner({ type: "error", message: "Failed to update product. Please try again." })
    } finally {
      setSaving(false)
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
      navigate("/")
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
        <Banner
          type={banner.type}
          message={banner.message}
          onClose={() => setBanner({ type: "", message: "" })}
        />

        <div className="flex flex-wrap gap-3">
          <button onClick={() => navigate(`/products/${id}`)} className="pos-btn-secondary">
            Back to Product Details
          </button>
          <button
            onClick={() => navigate(`/barcodes?productId=${id}`)}
            className="pos-btn-success"
          >
            Manage Barcodes
          </button>
        </div>

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
          selectedUnits={selectedUnits}
          onChange={setSelectedUnits}
        />

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
      </div>
    </div>
  )
}
