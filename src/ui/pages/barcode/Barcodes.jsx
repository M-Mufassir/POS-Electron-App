import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import Banner from "../../components/Banner"
import { useAuth } from "../../context/AuthContext"

const groupBarcodesByUnit = (rows = []) => {
  const grouped = new Map()

  rows.forEach((row) => {
    const unitId = Number(row.unit_id)
    if (!grouped.has(unitId)) {
      grouped.set(unitId, [])
    }
    grouped.get(unitId).push(row)
  })

  return grouped
}

export default function Barcodes() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [selectedProductId, setSelectedProductId] = useState("")
  const [units, setUnits] = useState([])
  const [barcodes, setBarcodes] = useState([])
  const [barcodeDrafts, setBarcodeDrafts] = useState({})
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [savingUnitId, setSavingUnitId] = useState(null)
  const [deletingBarcodeId, setDeletingBarcodeId] = useState(null)
  const [banner, setBanner] = useState({ type: "", message: "" })
  const { hasPermission } = useAuth()

  const selectedProduct = useMemo(
    () => products.find((product) => String(product.id) === String(selectedProductId)) || null,
    [products, selectedProductId],
  )
  const productIdFromQuery = searchParams.get("productId")
  const groupedBarcodes = useMemo(() => groupBarcodesByUnit(barcodes), [barcodes])

  const summary = useMemo(() => {
    const assignedUnits = units.filter((unit) => (groupedBarcodes.get(Number(unit.id)) || []).length > 0).length
    const duplicateUnits = units.filter((unit) => (groupedBarcodes.get(Number(unit.id)) || []).length > 1).length

    return {
      totalUnits: units.length,
      assignedUnits,
      missingUnits: Math.max(0, units.length - assignedUnits),
      duplicateUnits,
    }
  }, [groupedBarcodes, units])

  const fetchBarcodesForSelectedProduct = useCallback(async (productId) => {
    const parsedProductId = Number(productId)
    if (!Number.isFinite(parsedProductId) || parsedProductId <= 0) {
      setUnits([])
      setBarcodes([])
      setBarcodeDrafts({})
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
      const nextDrafts = {}
      const grouped = groupBarcodesByUnit(normalizedBarcodes)

      normalizedUnits.forEach((unit) => {
        const primaryBarcode = grouped.get(Number(unit.id))?.[0]
        nextDrafts[unit.id] = primaryBarcode?.barcode || ""
      })

      setUnits(normalizedUnits)
      setBarcodes(normalizedBarcodes)
      setBarcodeDrafts(nextDrafts)
    } catch (error) {
      console.error("Failed to fetch product barcode data:", error)
      setBanner({ type: "error", message: "Failed to load barcodes for the selected product." })
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

  const handleDraftChange = (unitId, value) => {
    setBarcodeDrafts((prev) => ({
      ...prev,
      [unitId]: value,
    }))
  }

  const handleSaveBarcode = async (unit) => {
    const parsedProductId = Number(selectedProductId)
    const parsedUnitId = Number(unit.id)
    const trimmedBarcode = String(barcodeDrafts[unit.id] || "").trim()
    const unitBarcodes = groupedBarcodes.get(parsedUnitId) || []
    const primaryBarcode = unitBarcodes[0] || null

    if (!trimmedBarcode) {
      setBanner({ type: "error", message: `Barcode is required for ${unit.name}.` })
      return
    }

    setBanner({ type: "", message: "" })
    setSavingUnitId(parsedUnitId)

    try {
      const payload = {
        product_id: parsedProductId,
        unit_id: parsedUnitId,
        barcode: trimmedBarcode,
      }

      if (primaryBarcode) {
        await window.api.updateBarcode(primaryBarcode.id, payload)
      } else {
        await window.api.addBarcode(payload)
      }

      await fetchBarcodesForSelectedProduct(parsedProductId)
      setBanner({
        type: "success",
        message: primaryBarcode
          ? `${unit.name} barcode updated successfully.`
          : `${unit.name} barcode added successfully.`,
      })
    } catch (error) {
      console.error("Failed to save barcode:", error)
      const rawMessage = String(error?.message || "").toLowerCase()
      const message = rawMessage.includes("unique")
        ? "This barcode already exists. Use a unique barcode value."
        : "Failed to save barcode. Please try again."
      setBanner({ type: "error", message })
    } finally {
      setSavingUnitId(null)
    }
  }

  const handleDeleteBarcode = async (barcodeId) => {
    const shouldDelete = window.confirm("Delete this barcode?")
    if (!shouldDelete) return

    setBanner({ type: "", message: "" })
    setDeletingBarcodeId(barcodeId)

    try {
      await window.api.deleteBarcode(barcodeId)
      await fetchBarcodesForSelectedProduct(selectedProductId)
      setBanner({ type: "success", message: "Barcode deleted successfully." })
    } catch (error) {
      console.error("Failed to delete barcode:", error)
      setBanner({ type: "error", message: "Failed to delete barcode. Please try again." })
    } finally {
      setDeletingBarcodeId(null)
    }
  }

  if (loadingProducts) {
    return (
      <div className="pos-container flex justify-center items-center h-screen">
        <p className="text-lg text-gray-600">Loading products for barcode mapping...</p>
      </div>
    )
  }

  if (!hasPermission("manage_products")) {
    return (
      <div className="pos-container flex justify-center items-center h-screen">
        <p className="text-lg text-gray-600">You do not have access to manage barcodes.</p>
      </div>
    )
  }

  return (
    <div className="pos-container">
      <div className="pos-header">
        <div>
          <h1 className="pos-section-title">All Units And Barcodes</h1>
          <p className="pos-section-subtitle">
            Manage one barcode per unit and spot missing barcode assignments quickly
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
              {products.length === 0 ? <option value="">No products available</option> : null}
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.code ? `${product.code} - ` : ""}{product.name}
                  {Number(product.status) === 1 ? "" : " (Inactive)"}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="border border-slate-200 p-4 bg-slate-50">
              <p className="text-sm text-slate-500">Total Units</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">{summary.totalUnits}</p>
            </div>
            <div className="border border-slate-200 p-4 bg-slate-50">
              <p className="text-sm text-slate-500">Assigned</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">{summary.assignedUnits}</p>
            </div>
            <div className="border border-slate-200 p-4 bg-slate-50">
              <p className="text-sm text-slate-500">Missing</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">{summary.missingUnits}</p>
            </div>
            <div className="border border-slate-200 p-4 bg-slate-50">
              <p className="text-sm text-slate-500">Duplicate Units</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">{summary.duplicateUnits}</p>
            </div>
          </div>
        </div>

        <div className="pos-card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Unit Barcode Table</h3>
              <p className="text-sm text-slate-500 mt-1">
                {selectedProduct
                  ? `Product: ${selectedProduct.name}`
                  : "Select a product to manage its unit barcodes."}
              </p>
            </div>
            {loadingDetails ? <p className="text-sm text-slate-500">Loading...</p> : null}
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="pos-table">
              <thead>
                <tr>
                  <th>Unit</th>
                  <th>Current Barcode</th>
                  <th>Scan / Enter Barcode</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {units.map((unit) => {
                  const unitBarcodes = groupedBarcodes.get(Number(unit.id)) || []
                  const primaryBarcode = unitBarcodes[0] || null
                  const duplicateBarcodes = unitBarcodes.slice(1)
                  const hasBarcode = Boolean(primaryBarcode)

                  return (
                    <tr key={unit.id}>
                      <td>
                        <div className="font-semibold text-slate-800">{unit.name}</div>
                        <div className="text-xs text-slate-500">{unit.symbol}</div>
                      </td>
                      <td>
                        {hasBarcode ? (
                          <div className="space-y-2">
                            <div className="font-semibold text-slate-800">{primaryBarcode.barcode}</div>
                            {duplicateBarcodes.length > 0 && (
                              <div className="space-y-2">
                                <div className="text-xs text-amber-700">
                                  Multiple barcodes exist for this unit. Remove the extras below.
                                </div>
                                {duplicateBarcodes.map((barcode) => (
                                  <div key={barcode.id} className="flex items-center gap-2">
                                    <span className="text-xs text-slate-600">{barcode.barcode}</span>
                                    <button
                                      type="button"
                                      className="pos-btn-danger"
                                      disabled={deletingBarcodeId === barcode.id}
                                      onClick={() => handleDeleteBarcode(barcode.id)}
                                    >
                                      {deletingBarcodeId === barcode.id ? "Deleting..." : "Delete Extra"}
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500">No barcode assigned</span>
                        )}
                      </td>
                      <td>
                        <form
                          className="flex flex-wrap gap-2"
                          onSubmit={(event) => {
                            event.preventDefault()
                            handleSaveBarcode(unit)
                          }}
                        >
                          <input
                            type="text"
                            className="pos-input min-w-[220px]"
                            placeholder="Scan or type barcode"
                            value={barcodeDrafts[unit.id] || ""}
                            onChange={(event) => handleDraftChange(unit.id, event.target.value)}
                            disabled={loadingDetails}
                          />
                          <button
                            type="submit"
                            className="pos-btn-primary"
                            disabled={savingUnitId === unit.id || loadingDetails || !selectedProductId}
                          >
                            {savingUnitId === unit.id ? "Saving..." : hasBarcode ? "Update" : "Save"}
                          </button>
                        </form>
                      </td>
                      <td>
                        <span className={`billing-pill ${hasBarcode ? "paid" : "open"}`}>
                          {hasBarcode ? "Assigned" : "Missing"}
                        </span>
                      </td>
                      <td>
                        {primaryBarcode ? (
                          <button
                            type="button"
                            className="pos-btn-danger"
                            disabled={deletingBarcodeId === primaryBarcode.id}
                            onClick={() => handleDeleteBarcode(primaryBarcode.id)}
                          >
                            {deletingBarcodeId === primaryBarcode.id ? "Deleting..." : "Delete"}
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  )
                })}
                {units.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center text-gray-500 py-6">
                      No units available for the selected product.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
