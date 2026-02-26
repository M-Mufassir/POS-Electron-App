// src/pages/Products/ProductsList.jsx

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Table from "../components/table"

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-600">
        Loading products...
      </div>
    )
  }

  return (
    <div className="p-6">
      
      <h1 className="text-2xl font-semibold mb-6 text-gray-800">
        Products
      </h1>

      <div className="bg-white shadow-md rounded-xl overflow-hidden">
        <Table 
          data={products}
          tableSchema={[
            { name: "ID", key: "code", type: "string" },
            { name: "Name", key: "name", type: "string" },
            { name: "Price", key: "base_price", type: "number" },
            { name: "Base Unit", key: "base_unit_name", type: "string" },
            { name: "Actions", key: "action", type: "action" }
          ]}
        />
      </div>
    </div>
  )
}