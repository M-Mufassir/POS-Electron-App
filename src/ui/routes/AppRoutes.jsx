// src/routes/AppRoutes.jsx

import { Navigate, Route, Routes } from "react-router-dom"
import Home from "../pages/Home"
import ProductsList from "../pages/product/ProductsList"
import ProductDetails from "../pages/product/ProductDetails"
import AddProduct from "../pages/product/AddProduct"
import EditProduct from "../pages/product/EditProduct"
import Categories from "../pages/category/Categories"
import Units from "../pages/unit/Units"
import Barcodes from "../pages/barcode/Barcodes"
import BillingWorkspace from "../pages/billing/BillingWorkspace"
import BillsList from "../pages/billing/BillsList"
import AdminDashboard from "../pages/admin/AdminDashboard"

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/products" element={<ProductsList />} />
      <Route path="/products/:id" element={<ProductDetails />} />
      <Route path="/products/add" element={<AddProduct />} />
      <Route path="/products/:id/edit" element={<EditProduct />} />
      <Route path="/categories" element={<Categories />} />
      <Route path="/units" element={<Units />} />
      <Route path="/barcodes" element={<Barcodes />} />
      <Route path="/billing" element={<BillingWorkspace />} />
      <Route path="/billing/all" element={<BillsList />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}