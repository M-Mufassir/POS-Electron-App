import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import Banner from "../../components/Banner"

function Barcodes() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [selectedProductId, setSelectedProductId] = useState("")
  const [units, setUnits] = useState([])
  const [barcodes, setBarcodes] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingBarcodeId, setDeletingBarcodeId] = useState(null)
  const [editingBarcodeId, setEditingBarcodeId] = useState(null)
  const [form, setForm] = useState({ unit_id: "", barcode: "" })
  const [banner, setBanner] = useState({ type: "", message: "" })

  const selectedProduct = useMemo(
    () => products.find((product) => String(product.id) === String(selectedProductId)) || null,
    [products, selectedProductId],
  )
  const productIdFromQuery = searchParams.get("productId")

  const summary = useMemo(() => {
    const totalBarcodes = barcodes.length
    const unitsUsed = new Set(barcodes.map((item) => item.unit_id)).size

    return {
      totalBarcodes,
      unitsUsed,
      availableUnits: units.length,
    }
  }, [barcodes, units])

  const fetchBarcodesForSelectedProduct = useCallback(async (productId) => {
    const parsedProductId = Number(productId)
    if (!Number.isFinite(parsedProductId) || parsedProductId <= 0) {
      setUnits([])
      setBarcodes([])
      setEditingBarcodeId(null)
      setForm({ unit_id: "", barcode: "" })
      return
    }

    setLoadingDetails(true)
    try {
      const [unitData, barcodeData] = await Promise.all([
        window.api.getAssignableUnitsByProductId(parsedProductId),
        window.api.getBarcodesByProductId(parsedProductId),
      ])

      const normalizedUnits = Array.isArray(unitData) ? unitData : []
      const normalizedBarcodes = Array.isArray(barcodeData) ? barcodeData : []

      setUnits(normalizedUnits)
      setBarcodes(normalizedBarcodes)
      setEditingBarcodeId(null)
      setForm((prev) => {
        const selectedUnitStillExists = normalizedUnits.some(
          (unit) => String(unit.id) === String(prev.unit_id),
        )

        return {
          unit_id: selectedUnitStillExists ? prev.unit_id : String(normalizedUnits[0]?.id || ""),
          barcode: "",
        }
      })
    } catch (error) {
      console.error("Failed to fetch product barcode data:", error)
      setBanner({ type: "error", message: "Failed to load barcodes for selected product." })
    } finally {
      setLoadingDetails(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const fetchProducts = async () => {
      setLoadingProducts(true)
      try {
        const productData = await window.api.getAllProducts()
        const allProducts = (Array.isArray(productData) ? productData : [])
          .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")))

        if (cancelled) return

        setProducts(allProducts)

        const parsedPreferredId = Number(productIdFromQuery)
        const preferredExists = allProducts.some((item) => item.id === parsedPreferredId)
        const defaultSelectedId = preferredExists
          ? String(parsedPreferredId)
          : allProducts.length > 0
            ? String(allProducts[0].id)
            : ""

        setSelectedProductId(defaultSelectedId)
      } catch (error) {
        console.error("Failed to fetch products:", error)
        if (!cancelled) {
          setBanner({ type: "error", message: "Failed to load products for barcode mapping." })
        }
      } finally {
        if (!cancelled) {
          setLoadingProducts(false)
        }
      }
    }

    fetchProducts()

    return () => {
      cancelled = true
    }
  }, [productIdFromQuery])

  useEffect(() => {
    fetchBarcodesForSelectedProduct(selectedProductId)
  }, [fetchBarcodesForSelectedProduct, selectedProductId])

  useEffect(() => {
    if (!selectedProductId) return

    if (searchParams.get("productId") !== String(selectedProductId)) {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.set("productId", String(selectedProductId))
      setSearchParams(nextParams, { replace: true })
    }
  }, [searchParams, selectedProductId, setSearchParams])

  const handleStartEdit = (row) => {
    setEditingBarcodeId(row.id)
    setForm({
      unit_id: String(row.unit_id),
      barcode: row.barcode || "",
    })
    setBanner({ type: "", message: "" })
  }

  const handleCancelEdit = () => {
    setEditingBarcodeId(null)
    setForm((prev) => ({ ...prev, barcode: "" }))
  }

  const handleDeleteBarcode = async (barcodeId) => {
    const shouldDelete = window.confirm("Delete this barcode?")
    if (!shouldDelete) return

    setBanner({ type: "", message: "" })
    setDeletingBarcodeId(barcodeId)

    try {
      await window.api.deleteBarcode(barcodeId)
      await fetchBarcodesForSelectedProduct(selectedProductId)
      if (editingBarcodeId === barcodeId) {
        setEditingBarcodeId(null)
        setForm((prev) => ({ ...prev, barcode: "" }))
      }
      setBanner({ type: "success", message: "Barcode deleted successfully." })
    } catch (error) {
      console.error("Failed to delete barcode:", error)
      setBanner({ type: "error", message: "Failed to delete barcode. Please try again." })
    } finally {
      setDeletingBarcodeId(null)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setBanner({ type: "", message: "" })

    const parsedProductId = Number(selectedProductId)
    const parsedUnitId = Number(form.unit_id)
    const trimmedBarcode = String(form.barcode || "").trim()

    if (!Number.isFinite(parsedProductId) || parsedProductId <= 0) {
      setBanner({ type: "error", message: "Please select a product." })
      return
    }
    if (!Number.isFinite(parsedUnitId) || parsedUnitId <= 0) {
      setBanner({ type: "error", message: "Please select a unit." })
      return
    }
    if (!trimmedBarcode) {
      setBanner({ type: "error", message: "Barcode is required." })
      return
    }

    const payload = {
      product_id: parsedProductId,
      unit_id: parsedUnitId,
      barcode: trimmedBarcode,
    }

    setSaving(true)
    try {
      if (editingBarcodeId) {
        await window.api.updateBarcode(editingBarcodeId, payload)
      } else {
        await window.api.addBarcode(payload)
      }

      await fetchBarcodesForSelectedProduct(parsedProductId)
      setForm((prev) => ({ ...prev, barcode: "" }))
      setEditingBarcodeId(null)
      setBanner({
        type: "success",
        message: editingBarcodeId ? "Barcode updated successfully." : "Barcode added successfully.",
      })
    } catch (error) {
      console.error("Failed to save barcode:", error)
      const rawMessage = String(error?.message || "").toLowerCase()
      const message = rawMessage.includes("unique")
        ? "This barcode already exists. Use a unique barcode value."
        : "Failed to save barcode. Please try again."
      setBanner({ type: "error", message })
    } finally {
      setSaving(false)
    }
  }

  if (loadingProducts) {
    return (
      <div className="pos-container flex justify-center items-center h-screen">
        <p className="text-lg text-gray-600">Loading products for barcode mapping...</p>
      </div>
    )
  }

  return (
    <div className="pos-container">
      <div className="pos-header">
        <div>
          <h1 className="pos-section-title">Barcodes</h1>
          <p className="pos-section-subtitle">
            Create, view, and edit product barcodes in one place
          </p>
        </div>
      </div>

      <div className="p-6 overflow-y-auto flex-1 space-y-6">
        <Banner
          type={banner.type}
          message={banner.message}
          onClose={() => setBanner({ type: "", message: "" })}
        />

        <div className="pos-card space-y-4">
          <div className="pos-form-group">
            <label htmlFor="barcode-product" className="pos-label">Select Product</label>
            <select
              id="barcode-product"
              className="pos-input"
              value={selectedProductId}
              onChange={(event) => setSelectedProductId(event.target.value)}
            >
              {products.length === 0 ? (
                <option value="">No products available</option>
              ) : null}
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.code ? `${product.code} - ` : ""}{product.name}
                  {Number(product.status) === 1 ? "" : " (Inactive)"}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-slate-200 p-4 bg-slate-50">
              <p className="text-sm text-slate-500">Total Barcodes</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">{summary.totalBarcodes}</p>
            </div>
            <div className="border border-slate-200 p-4 bg-slate-50">
              <p className="text-sm text-slate-500">Units Used</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">{summary.unitsUsed}</p>
            </div>
            <div className="border border-slate-200 p-4 bg-slate-50">
              <p className="text-sm text-slate-500">Units Available</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">{summary.availableUnits}</p>
            </div>
          </div>
        </div>

        <div className="pos-card">
          <h3 className="text-lg font-semibold text-slate-800">
            {editingBarcodeId ? "Edit Barcode" : "Add Barcode"}
          </h3>
          <p className="text-sm text-slate-500 mt-1 mb-4">
            {selectedProduct
              ? `Selected product: ${selectedProduct.name}`
              : "Select a product to manage barcodes."}
          </p>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="pos-form-group">
              <label htmlFor="barcode-unit" className="pos-label">Unit</label>
              <select
                id="barcode-unit"
                className="pos-input"
                value={form.unit_id}
                onChange={(event) => setForm((prev) => ({ ...prev, unit_id: event.target.value }))}
                disabled={loadingDetails || units.length === 0}
              >
                {units.length === 0 ? <option value="">No units available</option> : null}
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name} ({unit.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div className="pos-form-group">
              <label htmlFor="barcode-value" className="pos-label">Barcode Value</label>
              <input
                id="barcode-value"
                type="text"
                className="pos-input"
                placeholder="Enter barcode"
                value={form.barcode}
                onChange={(event) => setForm((prev) => ({ ...prev, barcode: event.target.value }))}
                disabled={loadingDetails}
              />
            </div>

            <div className="flex gap-3 md:justify-end">
              {editingBarcodeId ? (
                <button
                  type="button"
                  className="pos-btn-secondary"
                  onClick={handleCancelEdit}
                  disabled={saving}
                >
                  Cancel
                </button>
              ) : null}
              <button
                type="submit"
                className="pos-btn-primary"
                disabled={saving || loadingDetails || !selectedProductId}
              >
                {saving
                  ? "Saving..."
                  : editingBarcodeId
                    ? "Update Barcode"
                    : "Add Barcode"}
              </button>
            </div>
          </form>
        </div>

        <div className="pos-card">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800">Existing Barcodes</h3>
            {loadingDetails ? <p className="text-sm text-slate-500">Loading...</p> : null}
          </div>

          <div className="mt-4 space-y-3">
            {barcodes.length === 0 ? (
              <div className="border border-slate-200 p-4 bg-slate-50">
                <p className="text-slate-600">No barcodes found for the selected product.</p>
              </div>
            ) : (
              barcodes.map((row) => (
                <div
                  key={row.id}
                  className="border border-slate-200 bg-slate-50 p-4 flex flex-wrap items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-sm text-slate-500">
                      Unit: <span className="text-slate-700 font-semibold">{row.unit_name} ({row.unit_symbol})</span>
                    </p>
                    <p className="text-xl font-bold text-slate-800 mt-1">{row.barcode}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Updated: {row.updated_at ? new Date(row.updated_at).toLocaleString() : "-"}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="pos-btn-secondary"
                      onClick={() => handleStartEdit(row)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="pos-btn-danger"
                      onClick={() => handleDeleteBarcode(row.id)}
                      disabled={deletingBarcodeId === row.id}
                    >
                      {deletingBarcodeId === row.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Barcodes
