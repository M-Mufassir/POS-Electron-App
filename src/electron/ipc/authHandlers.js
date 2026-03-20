import {
  authenticateUser,
  createUser,
  getAuthBootstrapState,
  getUserById,
  listUsers,
  resetUserPassword,
} from "../services/authService.js"
import {
  createSession,
  destroySession,
  getSessionBySender,
  attachSessionToSender,
  clearSessionBySender,
  replaceSessionUser,
} from "../services/sessionService.js"
import { getPermissionsForRole } from "../../shared/authConfig.js"

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

  ipcMain.handle("auth-status", async () => {
    return await getAuthBootstrapState()
  })

  ipcMain.handle("auth-reset-password", async (event, payload) => {
    const user = requirePermission(event, "manage_passwords")
    await resetUserPassword(payload?.user_id, payload?.new_password, payload?.must_reset)
    const targetUserId = Number(payload?.user_id)
    if (Number(user.id) === targetUserId) {
      const refreshed = await getUserById(user.id)
      replaceSessionUser(event.sender?.id, refreshed)
      return {
        ok: true,
        by: user.id,
        user: refreshed,
        permissions: getPermissionsForRole(refreshed?.role_name),
      }
    }
    return { ok: true, by: user.id }
  })

  ipcMain.handle("auth-users", async (event) => {
    requirePermission(event, "manage_users")
    return await listUsers()
  })

  ipcMain.handle("auth-create-user", async (event, payload) => {
    requirePermission(event, "manage_users")
    return await createUser(payload)
  })

  ipcMain.handle("auth-change-own-password", async (event, payload) => {
    const user = requireAuth(event)
    if (user.is_bootstrap_admin) {
      throw new Error("Default admin password cannot be changed. Create a saved admin user instead.")
    }
    await resetUserPassword(user.id, payload?.new_password, 0)
    const refreshed = await getUserById(user.id)
    replaceSessionUser(event.sender?.id, refreshed)
    return {
      ok: true,
      user: refreshed,
      permissions: getPermissionsForRole(refreshed?.role_name),
    }
  })
}