import { useState } from "react"
import Banner from "../../components/Banner"
import { useAuth } from "../../context/AuthContext"

export default function Login() {
  const { login } = useAuth()
  const [form, setForm] = useState({ username: "", password: "" })
  const [banner, setBanner] = useState({ type: "", message: "" })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setBanner({ type: "", message: "" })
    setLoading(true)
    try {
      await login(form)
    } catch (error) {
      console.error("Login failed:", error)
      setBanner({ type: "error", message: error?.message || "Login failed" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pos-container flex items-center justify-center h-screen">
      <div className="pos-card w-full max-w-md">
        <h2 className="pos-section-title">Sign In</h2>
        <p className="pos-section-subtitle">Access the POS workspace</p>
        <Banner
          type={banner.type}
          message={banner.message}
          onClose={() => setBanner({ type: "", message: "" })}
        />
        <form className="space-y-4 mt-4" onSubmit={handleSubmit}>
          <div className="pos-form-group">
            <label className="pos-label">Username</label>
            <input
              type="text"
              className="pos-input"
              value={form.username}
              onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
              required
            />
          </div>
          <div className="pos-form-group">
            <label className="pos-label">Password</label>
            <input
              type="password"
              className="pos-input"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              required
            />
          </div>
          <button type="submit" className="pos-btn-primary w-full" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  )
}
