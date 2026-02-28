import React, { useEffect, useState } from "react";
import DynamicForm from '../components/DynamicForm'
import { useNavigate } from "react-router-dom";

function AddProduct() {
    const navigate = useNavigate();
    const [units, setUnits] = useState([])
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
  try {
    const response = await window.api.addProduct(product)
    console.log("Product saved successfully:", response)
  } catch (error) {
    console.error("Failed to save product:", error)
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
          submitLabel="Save Product"
          onSubmit={onSaveProduct}
        />
      </div>
    </div>
  )
}

export default AddProduct
