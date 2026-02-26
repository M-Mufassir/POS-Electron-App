// src/pages/Products/ProductDetails.jsx

import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"

export default function ProductDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)

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
      <div className="flex justify-center items-center h-screen text-gray-600">
        Loading product details...
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-gray-600">
        <p className="mb-4">Product not found.</p>
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Back to Products
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          Product Details
        </h1>

        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
        >
          ← Back
        </button>
      </div>

      {/* Main Card */}
      <div className="bg-white shadow-md rounded-xl p-6 space-y-6">

        {/* Basic Info */}
        <div>
          <h2 className="text-lg font-semibold mb-3 text-gray-700">
            Basic Information
          </h2>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Code:</span>
              <p className="font-medium">{product.code}</p>
            </div>

            <div>
              <span className="text-gray-500">Name:</span>
              <p className="font-medium">{product.name}</p>
            </div>

            <div>
              <span className="text-gray-500">Price:</span>
              <p className="font-medium">${product.base_price}</p>
            </div>

            <div>
              <span className="text-gray-500">Base Unit:</span>
              <p className="font-medium">{product.base_unit_name}</p>
              
            </div>
          </div>
        </div>

        {/* Units Section */}
        <div>
          <h2 className="text-lg font-semibold mb-3 text-gray-700">
            Available Units
          </h2>

          {product.units && product.units.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-600">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Symbol</th>
                    <th className="px-4 py-3">Conversion Multiplier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {product.units.map((unit) => (
                    <tr key={unit.id}>
                      <td className="px-4 py-3">{unit.name}</td>
                      <td className="px-4 py-3">{unit.symbol}</td>
                      <td className="px-4 py-3">
                        {unit.conversion_multiplier}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">
              No additional units available.
            </p>
          )}
        </div>

        {/* Categories Section */}
        <div>
          <h2 className="text-lg font-semibold mb-3 text-gray-700">
            Categories
          </h2>

          {product.categories && product.categories.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {product.categories.map((category) => (
                <span
                  key={category.id}
                  className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                >
                  {category.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">
              No categories assigned.
            </p>
          )}
        </div>

      </div>
    </div>
  )
}