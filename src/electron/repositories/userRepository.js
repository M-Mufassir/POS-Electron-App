import { getQuery, allQuery, runQuery } from "./dbUtils.js"

export const selectUserByUsername = (username) => {
  return getQuery(
    `SELECT u.*, r.name AS role_name
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.username = ?`,
    [username],
  )
}

export const selectUserById = (userId) => {
  return getQuery(
    `SELECT u.*, r.name AS role_name
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.id = ?`,
    [userId],
  )
}

export const updateUserPasswordById = (userId, passwordHash, mustReset = 0) => {
  return runQuery(
    `UPDATE users
     SET password = ?, must_reset_password = ?, updated_at = datetime('now')
     WHERE id = ?`,
    [passwordHash, Number(mustReset) === 1 ? 1 : 0, userId],
  )
}

export const selectUsersWithRoles = () => {
  return allQuery(
    `SELECT u.id, u.username, u.email, u.status, u.role_id, r.name AS role_name
     FROM users u
     JOIN roles r ON r.id = u.role_id
     ORDER BY u.id ASC`,
  )
}

export const insertUser = (user) => {
  return runQuery(
    `INSERT INTO users (username, password, email, role_id, status, must_reset_password, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    [
      user.username,
      user.password,
      user.email,
      user.role_id,
      user.status,
      user.must_reset_password,
    ],
  )
}
