// src/pages/Products/ProductDetails.jsx

import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"

export default function ProductDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const { hasPermission } = useAuth()

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await window.api.getProductById(Number(id))
        setProduct(data)
      } catch (error) {
        console.error("Failed to fetch product:", error)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchProduct()
    }
  }, [id])

  if (loading) {
    return (
      <div className="pos-container flex justify-center items-center h-screen">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Loading product details...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="pos-container flex flex-col items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-600 text-lg mb-6">Product not found.</p>
          <button
            onClick={() => navigate("/products")}
            className="pos-btn-primary"
          >
            Back to Products
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="pos-container">
      {/* Header */}
      <div className="pos-header">
        <div>
          <h1 className="pos-section-title">Product Details</h1>
          <p className="pos-section-subtitle">View and manage product information</p>
        </div>
      </div>

      {/* Main Card */}
      <div className="p-6 overflow-y-auto flex-1">
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={() => navigate("/products")}
          className="pos-btn-secondary"
        >
          Back to Products
        </button>
        {hasPermission("manage_products") && (
          <>
            <button
              onClick={() => navigate(`/products/${id}/edit`)}
              className="pos-btn-primary"
            >
              Edit Product
            </button>
            <button
              onClick={() => navigate(`/barcodes?productId=${id}`)}
              className="pos-btn-success"
            >
              Manage Barcodes
            </button>
          </>
        )}
      </div>
      <div className="pos-card p-8 space-y-8">

        {/* Basic Info */}
        <div>
          <h3 className="pos-section-title">Basic Information</h3>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-gray-500 text-sm mb-1">Code</p>
              <p className="text-xl font-bold text-gray-800">{product.code}</p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-gray-500 text-sm mb-1">Name</p>
              <p className="text-xl font-bold text-blue-700">{product.name}</p>
            </div>

            <div className="bg-gray-100 p-4 rounded-lg border border-gray-300">
              <p className="text-gray-500 text-sm mb-1">Price</p>
              <p className="text-2xl font-bold text-gray-900">${product.base_price?.toFixed(2) || '0.00'}</p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-gray-500 text-sm mb-1">Base Unit</p>
              <p className="text-xl font-bold text-blue-700">{product.base_unit_name}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-gray-500 text-sm mb-1">Stock (Base Unit)</p>
              <p className="text-xl font-bold text-gray-800">
                {Number(product.stock_base_qty ?? 0).toFixed(2)} {product.base_unit_symbol || ""}
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-gray-500 text-sm mb-1">Status</p>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                  Number(product.status) === 1
                    ? "bg-green-100 text-green-800 border border-green-200"
                    : "bg-red-100 text-red-800 border border-red-200"
                }`}
              >
                {Number(product.status) === 1 ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>

        {/* Units Section */}
        <div>
          <h3 className="pos-section-title">Available Units</h3>

          {product.units && product.units.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="pos-table">
                <thead>
                  <tr>
                    <th>Unit Name</th>
                    <th>Symbol</th>
                    <th>Multiplier</th>
                  </tr>
                </thead>
                <tbody>
                  {product.units.map((unit) => (
                    <tr key={unit.id}>
                      <td className="font-medium text-gray-800">{unit.name}</td>
                      <td className="text-center font-bold text-gray-700">{unit.symbol}</td>
                      <td className="text-center font-bold text-gray-700">×{unit.conversion_multiplier}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-300 p-4 rounded-lg text-gray-600 text-sm">
              No additional units available.
            </div>
          )}
        </div>

        {/* Categories Section */}
        <div>
          <h3 className="pos-section-title">Categories</h3>

          {product.categories && product.categories.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {product.categories.map((category) => (
                <span
                  key={category.id}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-full shadow-md"
                >
                  {category.name}
                </span>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-300 p-4 rounded-lg text-gray-600 text-sm">
              No categories assigned yet.
            </div>
          )}
        </div>

      </div>
      </div>
      </div>
  )
  
}
