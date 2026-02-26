// src/routes/AppRoutes.jsx

import { Routes, Route } from "react-router-dom"
import ProductsList from "../pages/ProductsList"
import ProductDetails from "../pages/ProductDetails"
export default function AppRoutes() {
  return (
    <Routes>
      {/* Products List Page */}
      <Route path="/" element={<ProductsList />} />

      {/* Product Details Page */}
      <Route path="/products/:id" element={<ProductDetails />} />
    </Routes>
  )
}