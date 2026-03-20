import { createContext, useContext, useEffect, useMemo, useState } from "react"

const AuthContext = createContext(null)

const defaultAuthStatus = {
  has_users: true,
  can_use_default_admin: false,
  default_admin_username: "Admin",
  default_admin_password: "12345",
  roles: [],
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [permissions, setPermissions] = useState({})
  const [authStatus, setAuthStatus] = useState(defaultAuthStatus)
  const [loading, setLoading] = useState(true)

  const loadAuthState = async () => {
    setLoading(true)
    try {
      const [session, status] = await Promise.all([window.api.getSession(), window.api.getAuthStatus()])

      setAuthStatus({
        ...defaultAuthStatus,
        ...(status || {}),
        roles: Array.isArray(status?.roles) ? status.roles : [],
      })

      if (session?.user) {
        setUser(session.user)
        setPermissions(session.permissions || {})
      } else {
        setUser(null)
        setPermissions({})
      }
    } catch (error) {
      console.error("Failed to load session:", error)
      setUser(null)
      setPermissions({})
      setAuthStatus(defaultAuthStatus)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAuthState()
  }, [])

  const login = async (credentials) => {
    const result = await window.api.login(credentials)
    setUser(result.user)
    setPermissions(result.permissions || {})
    return result.user
  }

  const logout = async () => {
    await window.api.logout()
    setUser(null)
    setPermissions({})
  }

  const value = useMemo(
    () => ({
      user,
      permissions,
      authStatus,
      roles: authStatus.roles || [],
      loading,
      login,
      logout,
      refresh: loadAuthState,
      hasPermission: (perm) => Boolean(permissions?.[perm]),
    }),
    [user, permissions, authStatus, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider")
  }
  return ctx
}