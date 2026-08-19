import { useState } from "react"
import { useNavigate } from "react-router-dom"
import Banner from "../../components/Banner"
import { useAuth } from "../../context/AuthContext"
import { useSettings } from "../../context/SettingsContext"

export default function Login() {
  const navigate = useNavigate()
  const { login, authStatus } = useAuth()
  const { settings, logoDataUrl } = useSettings()
  const [form, setForm] = useState({ username: "", password: "" })
  const [banner, setBanner] = useState({ type: "", message: "" })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setBanner({ type: "", message: "" })
    setLoading(true)
    try {
      await login(form)
      navigate("/", { replace: true })
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
        {logoDataUrl ? (
          <img src={logoDataUrl} alt="" className="mx-auto mb-3 h-14 w-14 object-contain" />
        ) : null}
        <h2 className="pos-section-title text-center">{settings.shop_name || "Sign In"}</h2>
        <p className="pos-section-subtitle text-center">Access the POS workspace</p>
        {authStatus.can_use_default_admin && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mt-4 text-sm text-amber-900">
            <div className="font-semibold">First login detected</div>
            <p className="mt-1">
              No saved users were found. Sign in with the default admin account, then create
              permanent users from the Admin page if needed.
            </p>
            <p className="mt-2">
              Username: <strong>{authStatus.default_admin_username}</strong>
            </p>
            <p>
              Password: <strong>{authStatus.default_admin_password}</strong>
            </p>
            <button
              type="button"
              className="pos-btn-secondary mt-3"
              onClick={() =>
                setForm({
                  username: authStatus.default_admin_username,
                  password: authStatus.default_admin_password,
                })
              }
            >
              Use Default Admin
            </button>
          </div>
        )}
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