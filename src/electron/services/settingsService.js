import fs from "fs"
import path from "path"
import { getDataBasePath } from "../database/db.js"
import { selectSettings, updateSettingsRow } from "../repositories/settingsRepository.js"
import {
  DEFAULT_THEME_COLORS,
  DEFAULT_THEME_PRESET,
  THEME_COLOR_KEYS,
  THEME_PRESETS,
  withThemeDefaults,
} from "../../shared/themePresets.js"

const DEFAULTS = Object.freeze({
  shop_name: "My Store",
  shop_address: "",
  shop_phone: "",
  shop_email: "",
  logo_path: null,
  currency_symbol: "Rs.",
  tax_rate: 0,
  theme_preset: DEFAULT_THEME_PRESET,
  theme_colors: DEFAULT_THEME_COLORS,
})

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/

const isValidHexColor = (value) => HEX_COLOR_PATTERN.test(String(value || ""))

const parseStoredThemeColors = (raw) => {
  if (!raw) return DEFAULT_THEME_COLORS
  try {
    return withThemeDefaults(JSON.parse(raw))
  } catch {
    return DEFAULT_THEME_COLORS
  }
}

export async function getSettings() {
  const row = await selectSettings()
  return {
    ...DEFAULTS,
    ...(row || {}),
    theme_preset: row?.theme_preset || DEFAULTS.theme_preset,
    theme_colors: parseStoredThemeColors(row?.theme_colors),
  }
}

export async function updateSettings(input = {}) {
  const current = await getSettings()

  // A known preset key replaces the whole palette with that preset's
  // colors; "custom" (or an unrecognized key) keeps whatever colors are
  // supplied/already saved - that's what lets per-field edits in the
  // Settings UI naturally fall into a "Custom" theme.
  const requestedPreset = input.theme_preset && THEME_PRESETS[input.theme_preset] ? input.theme_preset : null
  const baseColors = requestedPreset ? THEME_PRESETS[requestedPreset].colors : current.theme_colors

  const incomingColors = input.theme_colors && typeof input.theme_colors === "object" ? input.theme_colors : {}
  const mergedColors = { ...baseColors }
  for (const key of THEME_COLOR_KEYS) {
    if (isValidHexColor(incomingColors[key])) {
      mergedColors[key] = incomingColors[key]
    }
  }

  const next = {
    shop_name: String(input.shop_name ?? current.shop_name).trim() || DEFAULTS.shop_name,
    shop_address: String(input.shop_address ?? current.shop_address).trim(),
    shop_phone: String(input.shop_phone ?? current.shop_phone).trim(),
    shop_email: String(input.shop_email ?? current.shop_email).trim(),
    logo_path: input.logo_path !== undefined ? input.logo_path : current.logo_path,
    currency_symbol: String(input.currency_symbol ?? current.currency_symbol).trim() || DEFAULTS.currency_symbol,
    tax_rate: Math.min(100, Math.max(0, Number(input.tax_rate ?? current.tax_rate) || 0)),
    theme_preset: input.theme_preset ? String(input.theme_preset) : current.theme_preset,
    theme_colors: mergedColors,
  }

  await updateSettingsRow({ ...next, theme_colors: JSON.stringify(next.theme_colors) })
  return next
}

// Copies the user-selected logo file into the app's data directory so it
// survives independently of wherever the original file lives on disk, then
// persists the (relative) path on the settings row.
export async function saveLogo(sourceFilePath) {
  if (!sourceFilePath || !fs.existsSync(sourceFilePath)) {
    throw new Error("Selected logo file could not be found")
  }

  const extension = path.extname(sourceFilePath).toLowerCase()
  const allowedExtensions = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"]
  if (!allowedExtensions.includes(extension)) {
    throw new Error("Logo must be a PNG, JPG, GIF, WEBP, or SVG image")
  }

  const brandingDir = path.join(getDataBasePath(), "branding")
  if (!fs.existsSync(brandingDir)) {
    fs.mkdirSync(brandingDir, { recursive: true })
  }

  const destinationFileName = `logo${extension}`
  const destinationPath = path.join(brandingDir, destinationFileName)
  fs.copyFileSync(sourceFilePath, destinationPath)

  return await updateSettings({ logo_path: destinationPath })
}

const MIME_TYPES_BY_EXTENSION = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
}

// The renderer runs with contextIsolation and no filesystem access, so the
// logo is handed over as a data URL rather than a raw file path.
export async function getLogoDataUrl() {
  const settings = await getSettings()
  if (!settings.logo_path || !fs.existsSync(settings.logo_path)) {
    return null
  }

  const extension = path.extname(settings.logo_path).toLowerCase()
  const mimeType = MIME_TYPES_BY_EXTENSION[extension] || "application/octet-stream"
  const fileBuffer = fs.readFileSync(settings.logo_path)
  return `data:${mimeType};base64,${fileBuffer.toString("base64")}`
}
