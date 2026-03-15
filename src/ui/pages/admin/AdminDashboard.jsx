import { useEffect, useState } from "react"
import Banner from "../../components/Banner"
import { useAuth } from "../../context/AuthContext"

export default function AdminDashboard() {
  const { refresh, hasPermission } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [banner, setBanner] = useState({ type: "", message: "" })
  const [creating, setCreating] = useState(false)
  const [selfPassword, setSelfPassword] = useState("")
  const [changingSelf, setChangingSelf] = useState(false)
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    role_id: "2",
    must_reset_password: true,
  })

  const loadUsers = async () => {
    setLoading(true)
    try {
      const data = await window.api.listUsers()
      setUsers(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Failed to load users:", error)
      setBanner({ type: "error", message: "Failed to load users." })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleReset = async (userId, password, mustReset) => {
    if (!password) {
      setBanner({ type: "error", message: "Password is required." })
      return
    }
    try {
      await window.api.resetPassword({
        user_id: userId,
        new_password: password,
        must_reset: mustReset ? 1 : 0,
      })
      setBanner({ type: "success", message: "Password reset successfully." })
      await refresh()
    } catch (error) {
      console.error("Password reset failed:", error)
      setBanner({ type: "error", message: error?.message || "Password reset failed." })
    }
  }

  if (!hasPermission("manage_passwords")) {
    return (
      <div className="pos-container flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="text-lg text-gray-600">You do not have access to this page.</div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="pos-container flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="text-lg text-gray-600">Loading admin dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="pos-container">
      <div className="pos-header">
        <div>
          <h1 className="pos-section-title">Admin Dashboard</h1>
          <p className="pos-section-subtitle">Reset passwords for all roles</p>
        </div>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        <Banner
          type={banner.type}
          message={banner.message}
          onClose={() => setBanner({ type: "", message: "" })}
        />

        <div className="pos-card">
          <h3 className="text-lg font-semibold text-slate-800">Change My Password</h3>
          <p className="text-sm text-slate-500 mt-1 mb-4">Update your own admin password.</p>
          <div className="flex flex-wrap gap-3">
            <input
              type="password"
              className="pos-input max-w-sm"
              placeholder="New password"
              value={selfPassword}
              onChange={(e) => setSelfPassword(e.target.value)}
            />
            <button
              type="button"
              className="pos-btn-secondary"
              disabled={changingSelf}
              onClick={async () => {
                if (!selfPassword) {
                  setBanner({ type: "error", message: "Password is required." })
                  return
                }
                setChangingSelf(true)
                try {
                  await window.api.changeOwnPassword({ new_password: selfPassword })
                  setBanner({ type: "success", message: "Password updated." })
                  setSelfPassword("")
                } catch (error) {
                  console.error("Failed to change password:", error)
                  setBanner({
                    type: "error",
                    message: error?.message || "Failed to change password.",
                  })
                } finally {
                  setChangingSelf(false)
                }
              }}
            >
              {changingSelf ? "Updating..." : "Update Password"}
            </button>
          </div>
        </div>

        <div className="pos-card mt-4 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="pos-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>New Password</th>
                  <th>Force Reset</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <AdminUserRow key={user.id} user={user} onReset={handleReset} />
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center text-gray-500 py-6">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="pos-card mt-6">
          <h3 className="text-lg font-semibold text-slate-800">Add New User</h3>
          <p className="text-sm text-slate-500 mt-1 mb-4">Create a new login and assign a role.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="pos-form-group">
              <label className="pos-label">Username</label>
              <input
                type="text"
                className="pos-input"
                value={newUser.username}
                onChange={(e) => setNewUser((prev) => ({ ...prev, username: e.target.value }))}
              />
            </div>
            <div className="pos-form-group">
              <label className="pos-label">Email</label>
              <input
                type="email"
                className="pos-input"
                value={newUser.email}
                onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="pos-form-group">
              <label className="pos-label">Password</label>
              <input
                type="password"
                className="pos-input"
                value={newUser.password}
                onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))}
              />
            </div>
            <div className="pos-form-group">
              <label className="pos-label">Role</label>
              <select
                className="pos-input"
                value={newUser.role_id}
                onChange={(e) => setNewUser((prev) => ({ ...prev, role_id: e.target.value }))}
              >
                <option value="1">Admin</option>
                <option value="2">Cashier</option>
                <option value="3">Manager</option>
              </select>
            </div>
            <div className="pos-form-group">
              <label className="billing-radio">
                <input
                  type="checkbox"
                  checked={newUser.must_reset_password}
                  onChange={(e) =>
                    setNewUser((prev) => ({ ...prev, must_reset_password: e.target.checked }))
                  }
                />
                Require password reset on first login
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              type="button"
              className="pos-btn-primary"
              disabled={creating}
              onClick={async () => {
                setBanner({ type: "", message: "" })
                if (!newUser.username || !newUser.password) {
                  setBanner({ type: "error", message: "Username and password are required." })
                  return
                }
                setCreating(true)
                try {
                  await window.api.createUser({
                    username: newUser.username,
                    email: newUser.email,
                    password: newUser.password,
                    role_id: Number(newUser.role_id),
                    must_reset_password: newUser.must_reset_password ? 1 : 0,
                  })
                  setBanner({ type: "success", message: "User created successfully." })
                  setNewUser({
                    username: "",
                    email: "",
                    password: "",
                    role_id: "2",
                    must_reset_password: true,
                  })
                  await loadUsers()
                } catch (error) {
                  console.error("Failed to create user:", error)
                  setBanner({
                    type: "error",
                    message: error?.message || "Failed to create user.",
                  })
                } finally {
                  setCreating(false)
                }
              }}
            >
              {creating ? "Creating..." : "Create User"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const AdminUserRow = ({ user, onReset }) => {
  const [password, setPassword] = useState("")
  const [mustReset, setMustReset] = useState(true)

  return (
    <tr>
      <td>{user.username}</td>
      <td>{user.role_name}</td>
      <td>
        <input
          type="password"
          className="pos-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password"
        />
      </td>
      <td>
        <input
          type="checkbox"
          checked={mustReset}
          onChange={(e) => setMustReset(e.target.checked)}
        />
      </td>
      <td>
        <button
          type="button"
          className="pos-btn-primary"
          onClick={() => onReset(user.id, password, mustReset)}
        >
          Reset
        </button>
      </td>
    </tr>
  )
}
