
import './App.css'

function App() {
  const handleClick = async () => {
  const response = await window.api.ping("Hello Main")
  console.log(response)
}
const handleAdd = async () => {
  const result = await window.api.addProduct({
    name: "Apple",
    price: 20
  })
  console.log(result)
}

const loadProducts = async () => {
  const products = await window.api.getProducts()
  console.log(products)
}

  return (
    <>
      <button onClick={handleClick}>
        Test IPC
      </button>
      <button onClick={handleAdd}>
        Add Product
      </button>
      <button onClick={loadProducts}>
        Load Products
      </button>
    </>
  )
}

export default App
