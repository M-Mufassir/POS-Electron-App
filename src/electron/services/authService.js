import crypto from "crypto"
import { runQuery } from "../repositories/dbUtils.js"
import {
  insertUser,
  selectRoleById,
  selectRoles,
  selectUserCount,
  selectUserByUsername,
  selectUserById,
  updateUserPasswordById,
  selectUsersWithRoles,
} from "../repositories/userRepository.js"
import { AUTH_ROLE_DEFINITIONS, DEFAULT_ADMIN_CREDENTIALS } from "../../shared/authConfig.js"

const hashPassword = (password) => {
  return crypto.createHash("sha256").update(password).digest("hex")
}

const toAppUser = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  role_id: user.role_id,
  role_name: user.role_name,
  status: Number(user.status ?? 1),
  must_reset_password: Number(user.must_reset_password || 0) === 1,
  is_bootstrap_admin: Number(user.is_bootstrap_admin || 0) === 1,
})

export async function ensureDefaultRoles() {
  for (const role of AUTH_ROLE_DEFINITIONS) {
    await runQuery(`INSERT OR IGNORE INTO roles (name, description) VALUES (?, ?)`, [
      role.name,
      role.description,
    ])
  }
}

export async function countPersistedUsers() {
  await ensureDefaultRoles()
  const result = await selectUserCount()
  return Number(result?.total || 0)
}

export async function listRoles() {
  await ensureDefaultRoles()
  return await selectRoles()
}

export async function getAuthBootstrapState() {
  const totalUsers = await countPersistedUsers()
  return {
    has_users: totalUsers > 0,
    can_use_default_admin: totalUsers === 0,
    default_admin_username: DEFAULT_ADMIN_CREDENTIALS.username,
    default_admin_password: DEFAULT_ADMIN_CREDENTIALS.password,
    roles: await listRoles(),
  }
}

export async function authenticateUser(username, password) {
  const normalizedUsername = String(username || "").trim()
  const rawPassword = String(password || "")

  if (!normalizedUsername || !rawPassword) {
    throw new Error("Username and password are required")
  }

  const totalUsers = await countPersistedUsers()
  if (
    totalUsers === 0 &&
    normalizedUsername.toLowerCase() === DEFAULT_ADMIN_CREDENTIALS.username.toLowerCase() &&
    rawPassword === DEFAULT_ADMIN_CREDENTIALS.password
  ) {
    return {
      id: "bootstrap-admin",
      username: DEFAULT_ADMIN_CREDENTIALS.username,
      email: null,
      role_id: null,
      role_name: "Admin",
      status: 1,
      must_reset_password: false,
      is_bootstrap_admin: true,
    }
  }

  const user = await selectUserByUsername(normalizedUsername)
  if (!user) {
    throw new Error("Invalid credentials")
  }
  if (Number(user.status ?? 1) !== 1) {
    throw new Error("User is inactive")
  }

  const hashed = hashPassword(rawPassword)

  if (user.password !== hashed) {
    if (user.password !== rawPassword) {
      throw new Error("Invalid credentials")
    }
    await updateUserPasswordById(user.id, hashed, Number(user.must_reset_password || 0))
  }

  return toAppUser(user)
}

export async function getUserById(id) {
  await ensureDefaultRoles()
  const parsedId = Number(id)
  if (!Number.isFinite(parsedId) || parsedId <= 0) {
    throw new Error("Invalid user id")
  }
  const user = await selectUserById(parsedId)
  if (!user) return null
  return toAppUser(user)
}

export async function resetUserPassword(targetUserId, newPassword, forceReset = 0) {
  await ensureDefaultRoles()
  const parsedId = Number(targetUserId)
  if (!Number.isFinite(parsedId) || parsedId <= 0) {
    throw new Error("Invalid user id")
  }
  const hashed = hashPassword(String(newPassword || ""))
  if (!String(newPassword || "").trim()) {
    throw new Error("Password is required")
  }
  await updateUserPasswordById(parsedId, hashed, Number(forceReset) === 1 ? 1 : 0)
}

export async function listUsers() {
  await ensureDefaultRoles()
  const users = await selectUsersWithRoles()
  return users.map(toAppUser)
}

export async function markPasswordResetRequired(userId, required) {
  await ensureDefaultRoles()
  const parsedId = Number(userId)
  if (!Number.isFinite(parsedId) || parsedId <= 0) {
    throw new Error("Invalid user id")
  }
  await runQuery(`UPDATE users SET must_reset_password = ? WHERE id = ?`, [
    Number(required) === 1 ? 1 : 0,
    parsedId,
  ])
}

export async function createUser(input) {
  await ensureDefaultRoles()
  const username = String(input?.username || "").trim()
  const email = String(input?.email || "").trim()
  const password = String(input?.password || "").trim()
  const roleId = Number(input?.role_id)
  const status = Number(input?.status) === 0 ? 0 : 1
  const mustReset = Number(input?.must_reset_password) === 1 ? 1 : 0

  if (!username) {
    throw new Error("Username is required")
  }
  if (!password) {
    throw new Error("Password is required")
  }
  if (!Number.isFinite(roleId) || roleId <= 0) {
    throw new Error("Role is required")
  }

  const existingUser = await selectUserByUsername(username)
  if (existingUser) {
    throw new Error("Username already exists")
  }

  const role = await selectRoleById(roleId)
  if (!role) {
    throw new Error("Selected role does not exist")
  }

  const hashed = hashPassword(password)
  const result = await insertUser({
    username,
    email: email || null,
    password: hashed,
    role_id: roleId,
    status,
    must_reset_password: mustReset,
  })

  return {
    id: result.lastID,
    username,
    email: email || null,
    role_id: roleId,
    role_name: role.name,
    status,
    must_reset_password: Boolean(mustReset),
    is_bootstrap_admin: false,
  }
}