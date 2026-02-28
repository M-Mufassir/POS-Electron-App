// src/App.jsx

import AppRoutes from "./routes/AppRoutes"
import Navbar from "./components/Navbar"

function App() {
  return (
    <div className="app-layout">
      <Navbar />
      <div className="app-main">
        <div className="app-content">
          <AppRoutes />
        </div>
      </div>
    </div>
  )
}

export default App