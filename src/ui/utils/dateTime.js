export const parseAppDateTime = (value) => {
  if (!value) return null
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  const raw = String(value).trim()
  if (!raw) return null

  const sqliteMatch = raw.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})$/)
  if (sqliteMatch) {
    const parsed = new Date(`${sqliteMatch[1]}T${sqliteMatch[2]}Z`)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export const formatAppDateTime = (value) => {
  const parsed = parseAppDateTime(value)
  return parsed ? parsed.toLocaleString() : "-"
}
