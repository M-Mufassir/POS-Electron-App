// src/routes/AppRoutes.jsx

import { Routes, Route } from "react-router-dom"
import ProductsList from "../pages/ProductsList"
import ProductDetails from "../pages/ProductDetails"
import AddProduct from "../pages/AddProduct"
import EditProduct from "../pages/EditProduct"
export default function AppRoutes() {
  return (
    <Routes>
      {/* Products List Page */}
      <Route path="/" element={<ProductsList />} />

      {/* Product Details Page */}
      <Route path="/products/:id" element={<ProductDetails />} />

      <Route path="/products/add" element={<AddProduct />} />
      <Route path="/products/:id/edit" element={<EditProduct />} />
    </Routes>
  )
}
