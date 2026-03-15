import crypto from "crypto"
import { runQuery } from "../repositories/dbUtils.js"
import {
  insertUser,
  selectUserByUsername,
  selectUserById,
  updateUserPasswordById,
  selectUsersWithRoles,
} from "../repositories/userRepository.js"

const hashPassword = (password) => {
  return crypto.createHash("sha256").update(password).digest("hex")
}

export async function authenticateUser(username, password) {
  const user = await selectUserByUsername(username)
  if (!user) {
    throw new Error("Invalid credentials")
  }

  const rawPassword = String(password || "")
  const hashed = hashPassword(rawPassword)

  if (user.password !== hashed) {
    if (user.password !== rawPassword) {
      throw new Error("Invalid credentials")
    }
    // Upgrade plaintext to hashed.
    await updateUserPasswordById(user.id, hashed, 0)
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role_id: user.role_id,
    role_name: user.role_name,
    must_reset_password: Number(user.must_reset_password || 0) === 1,
  }
}

export async function getUserById(id) {
  const parsedId = Number(id)
  if (!Number.isFinite(parsedId) || parsedId <= 0) {
    throw new Error("Invalid user id")
  }
  const user = await selectUserById(parsedId)
  if (!user) return null
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role_id: user.role_id,
    role_name: user.role_name,
    must_reset_password: Number(user.must_reset_password || 0) === 1,
  }
}

export async function resetUserPassword(targetUserId, newPassword, forceReset = 0) {
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
  return await selectUsersWithRoles()
}

export async function markPasswordResetRequired(userId, required) {
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
    status,
    must_reset_password: mustReset,
  }
}
