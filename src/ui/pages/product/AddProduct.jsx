import React, { useEffect, useState } from "react";
import DynamicForm from '../../components/DynamicForm'
import { useNavigate } from "react-router-dom";
import Banner from "../../components/Banner"

function AddProduct() {
    const navigate = useNavigate();
    const [units, setUnits] = useState([])
    const [saving, setSaving] = useState(false)
    const [banner, setBanner] = useState({ type: "", message: "" })
    const productFormSchema = [
  {
    name: "name",
    label: "Product Name",
    type: "text",
    required: true,
  },
  {
    name: "code",
    label: "Product Code",
    type: "text",
  },
  {
    name: "description",
    label: "Description",
    type: "textarea",
    fullWidth: true,
  },
  {
    name: "base_price",
    label: "Price",
    type: "number",
  },
  {
    name: "base_unit_id",
    label: "Base Unit",
    type: "select",
    options: units, // will come from API
  },
  {
    name: "created_at",
    label: "Created At",
    type: "date",
  },
];
const onSaveProduct = async (product) => {
  setBanner({ type: "", message: "" })
  setSaving(true)
  try {
    const payload = {
      ...product,
      name: String(product?.name || "").trim(),
      code: String(product?.code || "").trim(),
      description: String(product?.description || "").trim(),
      base_price: Number(product?.base_price),
      base_unit_id: Number(product?.base_unit_id),
      created_at: product?.created_at || new Date().toISOString(),
    }

    if (!payload.name) {
      setBanner({ type: "error", message: "Product name is required." })
      return
    }
    if (!Number.isFinite(payload.base_price) || payload.base_price < 0) {
      setBanner({ type: "error", message: "Base price must be a valid number." })
      return
    }
    if (!Number.isFinite(payload.base_unit_id) || payload.base_unit_id <= 0) {
      setBanner({ type: "error", message: "Base unit is required." })
      return
    }

    const response = await window.api.addProduct(payload)
    console.log("Product saved successfully:", response)
    navigate(`/products/${response.id}`)
  } catch (error) {
    console.error("Failed to save product:", error)
    setBanner({ type: "error", message: "Failed to save product. Please try again." })
  } finally {
    setSaving(false)
  }
}
    useEffect(() => {
    async function fetchUnits() {
      const data = await window.api.getAllUnits()
      setUnits(data);
      
      
    }

    fetchUnits();
  }, []);
  return (
    <div className="pos-container">
      <div className="pos-header">
        <div>
          <h1 className="pos-section-title">Add New Product</h1>
          <p className="pos-section-subtitle">Create a new product in your inventory</p>
        </div>
      </div>

      <div className="p-6 overflow-y-auto flex-1">
      <Banner
        type={banner.type}
        message={banner.message}
        onClose={() => setBanner({ type: "", message: "" })}
      />
      <button 
        onClick={() => navigate("/")} 
        className="pos-btn-secondary mb-6 py-2"
      >
        Back to Products
      </button>
        
        <DynamicForm
          schema={productFormSchema}
          initialValues={{ created_at: new Date().toISOString().split('T')[0] }}
          title="Create Product"
          subtitle="Add a new product to your inventory"
          submitLabel={saving ? "Saving..." : "Save Product"}
          onSubmit={onSaveProduct}
        />
      </div>
    </div>
  )
}

export default AddProduct
