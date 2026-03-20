import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import Table from "../../components/Table"
import { useAuth } from "../../context/AuthContext"

const formatCurrency = (value) => {
  const amount = Number(value || 0)
  if (!Number.isFinite(amount)) return "0.00"
  return amount.toFixed(2)
}

export default function ProductsList() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const navigate = useNavigate()
  const { hasPermission } = useAuth()

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await window.api.getAllProducts()
        setProducts(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error("Failed to fetch products:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    return products.filter((product) => {
      const matchesSearch =
        !term ||
        String(product.name || "").toLowerCase().includes(term) ||
        String(product.code || "").toLowerCase().includes(term) ||
        String(product.base_unit_name || "").toLowerCase().includes(term)

      const matchesStatus =
        statusFilter === "all" || String(Number(product.status || 0)) === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [products, searchTerm, statusFilter])

  const productSummary = useMemo(() => {
    const activeProducts = products.filter((product) => Number(product.status) === 1).length
    const inactiveProducts = products.length - activeProducts
    const stockUnits = products.reduce(
      (sum, product) => sum + Math.max(0, Number(product.stock_base_qty || 0)),
      0,
    )
    const estimatedValue = products.reduce(
      (sum, product) =>
        sum +
        Math.max(0, Number(product.stock_base_qty || 0)) * Math.max(0, Number(product.base_price || 0)),
      0,
    )

    return {
      totalProducts: products.length,
      activeProducts,
      inactiveProducts,
      stockUnits,
      estimatedValue,
    }
  }, [products])

  const handleViewDetails = (id) => {
    navigate(`/products/${id}`)
  }

  const handleEditProduct = (id) => {
    navigate(`/products/${id}/edit`)
  }

  if (loading) {
    return (
      <div className="pos-container flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="text-lg text-gray-600">Loading your products...</div>
        </div>
      </div>
    )
  }

  if (!hasPermission("manage_products")) {
    return (
      <div className="pos-container flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="text-lg text-gray-600">You do not have access to manage products.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="pos-container">
      <div className="pos-header">
        <div>
          <h1 className="pos-section-title">Products Inventory</h1>
          <p className="pos-section-subtitle">
            Search stock faster, review status at a glance, and keep the catalog operational.
          </p>
        </div>
      </div>

      <div className="page-body">
        <div className="page-summary-grid">
          <div className="page-summary-card">
            <span className="page-summary-label">Total Products</span>
            <strong>{productSummary.totalProducts}</strong>
          </div>
          <div className="page-summary-card success">
            <span className="page-summary-label">Active</span>
            <strong>{productSummary.activeProducts}</strong>
          </div>
          <div className="page-summary-card warning">
            <span className="page-summary-label">Inactive</span>
            <strong>{productSummary.inactiveProducts}</strong>
          </div>
          <div className="page-summary-card info">
            <span className="page-summary-label">Stock Units</span>
            <strong>{productSummary.stockUnits}</strong>
          </div>
          <div className="page-summary-card accent">
            <span className="page-summary-label">Estimated Stock Value</span>
            <strong>Rs. {formatCurrency(productSummary.estimatedValue)}</strong>
          </div>
        </div>

        <div className="page-toolbar">
          <form
            className="page-search-row"
            onSubmit={(event) => event.preventDefault()}
          >
            <div className="page-search-group">
              <label className="pos-label">Search Products</label>
              <input
                type="text"
                className="pos-input"
                placeholder="Search by code, name, or unit"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <div className="page-search-group page-search-filter">
              <label className="pos-label">Status</label>
              <select
                className="pos-input"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="all">All Products</option>
                <option value="1">Active Only</option>
                <option value="0">Inactive Only</option>
              </select>
            </div>
            <div className="page-search-actions">
              <button type="submit" className="pos-btn-primary">
                Search
              </button>
              <button
                type="button"
                className="pos-btn-secondary"
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("all")
                }}
              >
                Clear
              </button>
            </div>
          </form>

          <div className="page-toolbar-actions">
            <div className="page-filter-note">
              Showing {filteredProducts.length} of {products.length} products
            </div>
            <button onClick={() => navigate("/products/add")} className="pos-btn-success">
              Add New Product
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <Table
            data={filteredProducts}
            tableSchema={[
              { name: "Code", key: "code", type: "string" },
              { name: "Name", key: "name", type: "string" },
              { name: "Base Price", key: "base_price", type: "currency" },
              { name: "Base Unit", key: "base_unit_name", type: "string" },
              { name: "Stock", key: "stock_base_qty", type: "number" },
              { name: "Status", key: "status", type: "status" },
              { name: "Actions", key: "action", type: "action" },
            ]}
            onRowClick={handleViewDetails}
            onActionClick={handleEditProduct}
            actionLabel="Edit"
            emptyMessage="No matching products found. Adjust your search or add a new product."
          />
        </div>
      </div>
    </div>
  )
}
