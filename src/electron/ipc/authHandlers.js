import { authenticateUser, createUser, getUserById, listUsers, resetUserPassword } from "../services/authService.js"
import { createSession, destroySession, getSessionBySender, attachSessionToSender, clearSessionBySender } from "../services/sessionService.js"

const rolePermissions = {
  admin: {
    delete_product: true,
    manage_passwords: true,
    manage_products: true,
    manage_catalog: true,
    manage_users: true,
  },
  manager: {
    delete_product: false,
    manage_passwords: false,
    manage_products: true,
    manage_catalog: true,
    manage_users: false,
  },
  cashier: {
    delete_product: false,
    manage_passwords: false,
    manage_products: false,
    manage_catalog: false,
    manage_users: false,
  },
}

export const getPermissionsForRole = (roleName) => {
  const normalized = String(roleName || "").trim().toLowerCase()
  return rolePermissions[normalized] || rolePermissions.cashier
}

const isAdminRole = (roleName) => String(roleName || "").trim().toLowerCase() === "admin"

export const getSessionUser = (event) => {
  const session = getSessionBySender(event.sender?.id)
  return session?.user || null
}

export const requireAuth = (event) => {
  const session = getSessionBySender(event.sender?.id)
  if (!session) {
    throw new Error("Not authenticated")
  }
  return session.user
}

export const requirePermission = (event, permission) => {
  const user = requireAuth(event)
  if (isAdminRole(user.role_name)) {
    return user
  }
  const perms = getPermissionsForRole(user.role_name)
  if (!perms[permission]) {
    throw new Error("Not authorized")
  }
  return user
}

export function registerAuthHandlers(ipcMain) {
  ipcMain.handle("auth-login", async (event, credentials) => {
    const user = await authenticateUser(credentials?.username, credentials?.password)
    const token = createSession(user)
    attachSessionToSender(event.sender?.id, token)
    return { token, user, permissions: getPermissionsForRole(user.role_name) }
  })

  ipcMain.handle("auth-logout", async (event) => {
    const session = getSessionBySender(event.sender?.id)
    if (session) {
      destroySession(session.token)
      clearSessionBySender(event.sender?.id)
    }
    return true
  })

  ipcMain.handle("auth-session", async (event) => {
    const session = getSessionBySender(event.sender?.id)
    if (!session) return null
    return { user: session.user, permissions: getPermissionsForRole(session.user.role_name) }
  })

  ipcMain.handle("auth-reset-password", async (event, payload) => {
    const user = requirePermission(event, "manage_passwords")
    await resetUserPassword(payload?.user_id, payload?.new_password, payload?.must_reset)
    return { ok: true, by: user.id }
  })

  ipcMain.handle("auth-users", async (event) => {
    requirePermission(event, "manage_passwords")
    return await listUsers()
  })

  ipcMain.handle("auth-create-user", async (event, payload) => {
    requirePermission(event, "manage_users")
    return await createUser(payload)
  })

  ipcMain.handle("auth-change-own-password", async (event, payload) => {
    const user = requireAuth(event)
    await resetUserPassword(user.id, payload?.new_password, 0)
    const refreshed = await getUserById(user.id)
    return { ok: true, user: refreshed }
  })
}
