import { useState } from "react"
import Banner from "../../components/Banner"
import { useAuth } from "../../context/AuthContext"

export default function ResetPassword() {
  const { refresh, logout } = useAuth()
  const [form, setForm] = useState({ password: "", confirm: "" })
  const [banner, setBanner] = useState({ type: "", message: "" })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setBanner({ type: "", message: "" })

    if (!form.password || form.password.length < 6) {
      setBanner({ type: "error", message: "Password must be at least 6 characters." })
      return
    }
    if (form.password !== form.confirm) {
      setBanner({ type: "error", message: "Passwords do not match." })
      return
    }

    setLoading(true)
    try {
      await window.api.changeOwnPassword({ new_password: form.password })
      await refresh()
      setBanner({ type: "success", message: "Password updated successfully." })
    } catch (error) {
      console.error("Failed to reset password:", error)
      setBanner({ type: "error", message: error?.message || "Failed to reset password." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pos-container flex items-center justify-center h-screen">
      <div className="pos-card w-full max-w-md">
        <h2 className="pos-section-title">Reset Password</h2>
        <p className="pos-section-subtitle">Administrator must reset the default password</p>
        <Banner
          type={banner.type}
          message={banner.message}
          onClose={() => setBanner({ type: "", message: "" })}
        />
        <form className="space-y-4 mt-4" onSubmit={handleSubmit}>
          <div className="pos-form-group">
            <label className="pos-label">New Password</label>
            <input
              type="password"
              className="pos-input"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              required
            />
          </div>
          <div className="pos-form-group">
            <label className="pos-label">Confirm Password</label>
            <input
              type="password"
              className="pos-input"
              value={form.confirm}
              onChange={(e) => setForm((prev) => ({ ...prev, confirm: e.target.value }))}
              required
            />
          </div>
          <button type="submit" className="pos-btn-primary w-full" disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </button>
          <button type="button" className="pos-btn-secondary w-full" onClick={logout}>
            Logout
          </button>
        </form>
      </div>
    </div>
  )
}
