import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { DEFAULT_THEME_COLORS, DEFAULT_THEME_PRESET } from "../../shared/themePresets"

const SettingsContext = createContext(null)

const defaultSettings = {
  shop_name: "My Store",
  shop_address: "",
  shop_phone: "",
  shop_email: "",
  logo_path: null,
  currency_symbol: "Rs.",
  tax_rate: 0,
  theme_preset: DEFAULT_THEME_PRESET,
  theme_colors: DEFAULT_THEME_COLORS,
}

const applyThemeVars = (settings) => {
  const root = document.documentElement
  Object.entries(settings.theme_colors || {}).forEach(([cssVar, value]) => {
    if (value) {
      root.style.setProperty(cssVar, value)
    }
  })
}

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings)
  const [logoDataUrl, setLogoDataUrl] = useState(null)
  const [loading, setLoading] = useState(true)

  const refreshSettings = async () => {
    setLoading(true)
    try {
      const [data, logo] = await Promise.all([
        window.api.getSettings(),
        window.api.getLogoDataUrl(),
      ])
      const merged = {
        ...defaultSettings,
        ...(data || {}),
        theme_colors: { ...DEFAULT_THEME_COLORS, ...(data?.theme_colors || {}) },
      }
      setSettings(merged)
      setLogoDataUrl(logo || null)
      applyThemeVars(merged)
    } catch (error) {
      console.error("Failed to load settings:", error)
      setSettings(defaultSettings)
      setLogoDataUrl(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshSettings()
  }, [])

  const value = useMemo(
    () => ({ settings, logoDataUrl, loading, refreshSettings }),
    [settings, logoDataUrl, loading],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export const useSettings = () => {
  const ctx = useContext(SettingsContext)
  if (!ctx) {
    throw new Error("useSettings must be used inside SettingsProvider")
  }
  return ctx
}
