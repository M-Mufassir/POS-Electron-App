// src/pages/Products/ProductsList.jsx

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Table from "../components/Table"

export default function ProductsList() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await window.api.getAllProducts()
        setProducts(data)
      } catch (error) {
        console.error("Failed to fetch products:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

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

  return (
    <div className="pos-container">
      <div className="pos-header">
        <div>
          <h1 className="pos-section-title">
            Products Inventory
          </h1>
          <p className="pos-section-subtitle">Manage your product catalog</p>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col overflow-hidden">
        <div className="mb-6">
          <button
            onClick={() => navigate("/products/add")}
            className="pos-btn-success"
          >
            Add New Product
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          <Table 
            data={products}
            tableSchema={[
            { name: "ID", key: "code", type: "string" },
            { name: "Name", key: "name", type: "string" },
            { name: "Price", key: "base_price", type: "number" },
            { name: "Base Unit", key: "base_unit_name", type: "string" },
            { name: "Actions", key: "action", type: "action" }
          ]}
            onRowClick={handleViewDetails}
            onActionClick={handleEditProduct}
            actionLabel="Edit"
          />
        </div>
      </div>
    </div>
  )
}
