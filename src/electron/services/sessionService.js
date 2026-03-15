import crypto from "crypto"

const sessions = new Map()

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
