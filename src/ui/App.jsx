// src/App.jsx

import AppRoutes from "./routes/AppRoutes"
import Navbar from "./components/Navbar"
import TitleBar from "./components/TitleBar"
import { useAuth } from "./context/AuthContext"
import Login from "./pages/auth/Login"
import ResetPassword from "./pages/auth/ResetPassword"

function App() {
  const { user, loading } = useAuth()

  return (
    <div className="app-shell">
      <TitleBar />
      <div className="app-shell-body">
        {loading ? (
          <div className="pos-container flex justify-center items-center h-screen">
            <div className="text-center">
              <div className="text-lg text-gray-600">Loading session...</div>
            </div>
          </div>
        ) : !user ? (
          <Login />
        ) : user.must_reset_password ? (
          <ResetPassword />
        ) : (
          <div className="app-layout">
            <Navbar />
            <div className="app-main">
              <div className="app-content">
                <AppRoutes />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App