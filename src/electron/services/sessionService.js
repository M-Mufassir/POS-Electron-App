import crypto from "crypto"

const sessions = new Map()

// In-memory login throttling, keyed by normalized username. Resets on app
// restart, same lifetime as the session store above - this is meant to slow
// down casual brute-forcing on a local desktop app, not survive a restart.
const failedLoginAttempts = new Map()
const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_MS = 60 * 1000

const normalizeUsernameKey = (username) => String(username || "").trim().toLowerCase()

export function assertLoginNotLocked(username) {
  const key = normalizeUsernameKey(username)
  const entry = failedLoginAttempts.get(key)
  if (!entry) return

  if (entry.count >= MAX_FAILED_ATTEMPTS && Date.now() < entry.lockedUntil) {
    const secondsLeft = Math.ceil((entry.lockedUntil - Date.now()) / 1000)
    throw new Error(`Too many failed attempts. Try again in ${secondsLeft}s.`)
  }

  if (entry.count >= MAX_FAILED_ATTEMPTS && Date.now() >= entry.lockedUntil) {
    failedLoginAttempts.delete(key)
  }
}

export function recordFailedLogin(username) {
  const key = normalizeUsernameKey(username)
  const entry = failedLoginAttempts.get(key) || { count: 0, lockedUntil: 0 }
  entry.count += 1
  if (entry.count >= MAX_FAILED_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCKOUT_MS
  }
  failedLoginAttempts.set(key, entry)
}

export function resetFailedLogins(username) {
  failedLoginAttempts.delete(normalizeUsernameKey(username))
}

const generateToken = () => crypto.randomBytes(24).toString("hex")

export function createSession(user) {
  const token = generateToken()
  sessions.set(token, {
    token,
    user,
    created_at: Date.now(),
  })
  return token
}

export function getSession(token) {
  return sessions.get(token) || null
}

export function destroySession(token) {
  sessions.delete(token)
}

export function attachSessionToSender(senderId, token) {
  if (!senderId) return
  const session = getSession(token)
  if (!session) return
  sessions.set(`${senderId}`, { ...session, token })
}

export function getSessionBySender(senderId) {
  if (!senderId) return null
  return sessions.get(`${senderId}`) || null
}

export function clearSessionBySender(senderId) {
  if (!senderId) return
  sessions.delete(`${senderId}`)
}

export function replaceSessionUser(senderId, user) {
  if (!senderId) return null

  const senderKey = `${senderId}`
  const session = sessions.get(senderKey)
  if (!session) return null

  const nextSession = {
    ...session,
    user,
  }

  sessions.set(senderKey, nextSession)
  if (session.token && sessions.has(session.token)) {
    sessions.set(session.token, {
      ...sessions.get(session.token),
      user,
    })
  }

  return nextSession
}