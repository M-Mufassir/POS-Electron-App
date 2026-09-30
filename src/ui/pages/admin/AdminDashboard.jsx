import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Banner from "../../components/Banner"
import { useAuth } from "../../context/AuthContext"

const getPreferredRoleId = (roles) => {
  if (!Array.isArray(roles) || roles.length === 0) return ""
  return String(
    roles.find((role) => String(role.name || "").toLowerCase() === "cashier")?.id ||
      roles[0]?.id ||
      "",
  )
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { refresh, hasPermission, authStatus, roles, user } = useAuth()
  const canManageUsers = hasPermission("manage_users")
  const canManageSettings = hasPermission("manage_settings")
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
    role_id: "",
  })

  useEffect(() => {
    const nextRoleId = getPreferredRoleId(roles)
    if (!nextRoleId) return

    const currentRoleExists = roles.some((role) => String(role.id) === String(newUser.role_id))
    if (currentRoleExists) return

    setNewUser((prev) => ({
      ...prev,
      role_id: nextRoleId,
    }))
  }, [roles, newUser.role_id])

  useEffect(() => {
    if (!canManageUsers) {
      setLoading(false)
      return
    }

    let ignore = false

    const bootstrap = async () => {
      setLoading(true)
      try {
        const data = await window.api.listUsers()
        if (!ignore) {
          setUsers(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        console.error("Failed to load users:", error)
        if (!ignore) {
          setBanner({ type: "error", message: "Failed to load users." })
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    bootstrap()

    return () => {
      ignore = true
    }
  }, [canManageUsers])

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

  if (!canManageUsers) {
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
          <p className="pos-section-subtitle">Manage users, roles, and password access</p>
        </div>
        {canManageSettings ? (
          <button
            type="button"
            className="icon-btn"
            title="Settings"
            aria-label="Open settings"
            onClick={() => navigate("/settings")}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M19.14 12.94a7.14 7.14 0 0 0 .06-.94 7.14 7.14 0 0 0-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.03 7.03 0 0 0-1.63-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.59.24-1.14.56-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.65 8.84a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.62-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.14.24.42.32.6.22l2.39-.96c.49.38 1.04.7 1.63.94l.36 2.54c.05.24.26.42.5.42h3.84c.24 0 .45-.18.5-.42l.36-2.54c.59-.24 1.14-.56 1.63-.94l2.39.96c.24.1.46.02.6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58Z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </button>
        ) : null}
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        <Banner
          type={banner.type}
          message={banner.message}
          onClose={() => setBanner({ type: "", message: "" })}
        />

        {user?.is_bootstrap_admin && (
          <div className="pos-card mb-4 border border-amber-200 bg-amber-50">
            <h3 className="text-lg font-semibold text-amber-950">Default Admin Session</h3>
            <p className="text-sm text-amber-900 mt-1">
              {authStatus.has_users
                ? "This temporary session stays active until you sign out. After that, you must use a saved user account."
                : "You are signed in with the temporary bootstrap admin. It stays available only while there are no saved users in the database."}
            </p>
          </div>
        )}

        <div className="pos-card">
          <h3 className="text-lg font-semibold text-slate-800">Change My Password</h3>
          {user?.is_bootstrap_admin ? (
            <p className="text-sm text-slate-500 mt-1 mb-4">
              The default admin password is hardcoded. Create a saved admin user if you need a
              permanent credential that can be changed.
            </p>
          ) : (
            <>
              <p className="text-sm text-slate-500 mt-1 mb-4">Update your own password.</p>
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
                      await refresh()
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
            </>
          )}
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
                {users.map((entry) => (
                  <AdminUserRow key={entry.id} user={entry} onReset={handleReset} />
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
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              type="button"
              className="pos-btn-primary"
              disabled={creating || roles.length === 0}
              onClick={async () => {
                setBanner({ type: "", message: "" })
                if (!newUser.username || !newUser.password) {
                  setBanner({ type: "error", message: "Username and password are required." })
                  return
                }
                if (!newUser.role_id) {
                  setBanner({ type: "error", message: "Role is required." })
                  return
                }
                setCreating(true)
                try {
                  await window.api.createUser({
                    username: newUser.username,
                    email: newUser.email,
                    password: newUser.password,
                    role_id: Number(newUser.role_id),
                    must_reset_password: 0,
                  })
                  setBanner({ type: "success", message: "User created successfully." })
                  setNewUser({
                    username: "",
                    email: "",
                    password: "",
                    role_id: getPreferredRoleId(roles),
                  })
                  await loadUsers()
                  await refresh()
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
