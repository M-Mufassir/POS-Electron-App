import { createContext, useContext, useEffect, useMemo, useState } from "react"

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [permissions, setPermissions] = useState({})
  const [loading, setLoading] = useState(true)

  const loadSession = async () => {
    setLoading(true)
    try {
      const session = await window.api.getSession()
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
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSession()
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
      loading,
      login,
      logout,
      refresh: loadSession,
      hasPermission: (perm) => Boolean(permissions?.[perm]),
    }),
    [user, permissions, loading],
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
