// src/App.jsx

import AppRoutes from "./routes/AppRoutes"
import Navbar from "./components/Navbar"
import { useAuth } from "./context/AuthContext"
import Login from "./pages/auth/Login"
import ResetPassword from "./pages/auth/ResetPassword"

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="pos-container flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="text-lg text-gray-600">Loading session...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

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
