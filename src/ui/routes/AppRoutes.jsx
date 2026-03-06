// src/routes/AppRoutes.jsx

import { Routes, Route } from "react-router-dom"
import ProductsList from "../pages/product/ProductsList"
import ProductDetails from "../pages/product/ProductDetails"
import AddProduct from "../pages/product/AddProduct"
import EditProduct from "../pages/product/EditProduct"
import Categories from "../pages/category/Categories"
import Units from "../pages/unit/Units"
import Barcodes from "../pages/barcode/Barcodes"
export default function AppRoutes() {
  return (
    <Routes>
      {/* Products List Page */}
      <Route path="/" element={<ProductsList />} />

      {/* Product Details Page */}
      <Route path="/products/:id" element={<ProductDetails />} />

      <Route path="/products/add" element={<AddProduct />} />
      <Route path="/products/:id/edit" element={<EditProduct />} />

      <Route path="/categories" element={<Categories />} />
      <Route path="/units" element={<Units />} />
      <Route path="/barcodes" element={<Barcodes />} />
    </Routes>
  )
}
