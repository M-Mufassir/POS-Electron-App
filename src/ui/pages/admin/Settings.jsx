import { useEffect, useState } from "react"
import Banner from "../../components/Banner"
import { useAuth } from "../../context/AuthContext"
import { useSettings } from "../../context/SettingsContext"
import { THEME_COLOR_GROUPS, THEME_PRESETS } from "../../../shared/themePresets"

export default function Settings() {
  const { hasPermission } = useAuth()
  const { settings, logoDataUrl, refreshSettings } = useSettings()
  const canManageSettings = hasPermission("manage_settings")

  const [form, setForm] = useState(settings)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [banner, setBanner] = useState({ type: "", message: "" })

  useEffect(() => {
    setForm(settings)
  }, [settings])

  if (!canManageSettings) {
    return (
      <div className="pos-container flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="text-lg text-gray-600">You do not have access to this page.</div>
        </div>
      </div>
    )
  }

  const handleFieldChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handlePickPreset = (presetKey) => {
    const preset = THEME_PRESETS[presetKey]
    setForm((prev) => ({
      ...prev,
      theme_preset: presetKey,
      theme_colors: { ...preset.colors },
    }))
  }

  const handlePickCustom = () => {
    setForm((prev) => ({ ...prev, theme_preset: "custom" }))
  }

  const handleColorChange = (cssVar, value) => {
    setForm((prev) => ({
      ...prev,
      theme_preset: "custom",
      theme_colors: { ...prev.theme_colors, [cssVar]: value },
    }))
  }

  const handleSave = async (event) => {
    event.preventDefault()
    setBanner({ type: "", message: "" })
    setSaving(true)
    try {
      await window.api.updateSettings({
        shop_name: form.shop_name,
        shop_address: form.shop_address,
        shop_phone: form.shop_phone,
        shop_email: form.shop_email,
        currency_symbol: form.currency_symbol,
        tax_rate: Number(form.tax_rate) || 0,
        theme_preset: form.theme_preset,
        theme_colors: form.theme_colors,
      })
      await refreshSettings()
      setBanner({ type: "success", message: "Settings saved." })
    } catch (error) {
      console.error("Failed to save settings:", error)
      setBanner({ type: "error", message: error?.message || "Failed to save settings." })
    } finally {
      setSaving(false)
    }
  }

  const handleChooseLogo = async () => {
    setBanner({ type: "", message: "" })
    try {
      const filePath = await window.api.selectLogoFile()
      if (!filePath) return

      setUploadingLogo(true)
      await window.api.uploadLogo(filePath)
      await refreshSettings()
      setBanner({ type: "success", message: "Logo updated." })
    } catch (error) {
      console.error("Failed to upload logo:", error)
      setBanner({ type: "error", message: error?.message || "Failed to upload logo." })
    } finally {
      setUploadingLogo(false)
    }
  }

  const activePreset = form.theme_preset || "light"
  const themeColors = form.theme_colors || {}

  return (
    <div className="pos-container">
      <div className="pos-header">
        <div>
          <h1 className="pos-section-title">Settings</h1>
          <p className="pos-section-subtitle">Shop identity, branding, theme, and tax — admin only</p>
        </div>
      </div>

      <div className="p-6 flex-1 overflow-y-auto space-y-6">
        <Banner
          type={banner.type}
          message={banner.message}
          onClose={() => setBanner({ type: "", message: "" })}
        />

        <form onSubmit={handleSave} className="space-y-6">
          <div className="pos-card">
            <h3 className="text-lg font-semibold text-slate-800">Shop Identity</h3>
            <p className="text-sm text-slate-500 mt-1 mb-4">
              Shown on receipts, the navigation bar, and the login screen.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="pos-form-group">
                <label className="pos-label">Shop Name</label>
                <input
                  type="text"
                  className="pos-input"
                  value={form.shop_name || ""}
                  onChange={(e) => handleFieldChange("shop_name", e.target.value)}
                />
              </div>
              <div className="pos-form-group">
                <label className="pos-label">Phone</label>
                <input
                  type="text"
                  className="pos-input"
                  value={form.shop_phone || ""}
                  onChange={(e) => handleFieldChange("shop_phone", e.target.value)}
                />
              </div>
              <div className="pos-form-group md:col-span-2">
                <label className="pos-label">Address</label>
                <input
                  type="text"
                  className="pos-input"
                  value={form.shop_address || ""}
                  onChange={(e) => handleFieldChange("shop_address", e.target.value)}
                />
              </div>
              <div className="pos-form-group">
                <label className="pos-label">Email</label>
                <input
                  type="email"
                  className="pos-input"
                  value={form.shop_email || ""}
                  onChange={(e) => handleFieldChange("shop_email", e.target.value)}
                />
              </div>
              <div className="pos-form-group">
                <label className="pos-label">Currency Symbol</label>
                <input
                  type="text"
                  className="pos-input"
                  value={form.currency_symbol || ""}
                  onChange={(e) => handleFieldChange("currency_symbol", e.target.value)}
                />
              </div>
              <div className="pos-form-group">
                <label className="pos-label">Tax Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  className="pos-input"
                  value={form.tax_rate ?? 0}
                  onChange={(e) => handleFieldChange("tax_rate", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="pos-card">
            <h3 className="text-lg font-semibold text-slate-800">Logo</h3>
            <p className="text-sm text-slate-500 mt-1 mb-4">
              Used on the receipt and next to the shop name in the navigation bar.
            </p>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                {logoDataUrl ? (
                  <img src={logoDataUrl} alt="Shop logo" className="max-w-full max-h-full object-contain" />
                ) : (
                  <span className="text-xs text-slate-400">No logo</span>
                )}
              </div>
              <button
                type="button"
                className="pos-btn-secondary"
                onClick={handleChooseLogo}
                disabled={uploadingLogo}
              >
                {uploadingLogo ? "Uploading..." : "Choose Logo Image"}
              </button>
            </div>
          </div>

          <div className="pos-card">
            <h3 className="text-lg font-semibold text-slate-800">Theme</h3>
            <p className="text-sm text-slate-500 mt-1 mb-4">
              Pick a preset to fill in every color at once, or choose Custom and edit any
              value below. Applied instantly across the app once saved.
            </p>

            <div className="theme-preset-row">
              {Object.entries(THEME_PRESETS).map(([presetKey, preset]) => (
                <button
                  key={presetKey}
                  type="button"
                  className={`theme-preset-btn ${activePreset === presetKey ? "active" : ""}`}
                  onClick={() => handlePickPreset(presetKey)}
                >
                  <span
                    className="theme-preset-swatch"
                    style={{
                      background: `linear-gradient(135deg, ${preset.colors["--primary"]} 50%, ${preset.colors["--bg-light"]} 50%)`,
                      borderColor: preset.colors["--border-gray-300"],
                    }}
                  />
                  {preset.label}
                </button>
              ))}
              <button
                type="button"
                className={`theme-preset-btn ${activePreset === "custom" ? "active" : ""}`}
                onClick={handlePickCustom}
              >
                <span className="theme-preset-swatch theme-preset-swatch-custom">+</span>
                Custom
              </button>
            </div>

            <div className="theme-color-groups">
              {THEME_COLOR_GROUPS.map((group) => (
                <div key={group.key} className="theme-color-group">
                  <h4>{group.label}</h4>
                  <div className="theme-color-grid">
                    {group.fields.map((field) => (
                      <div key={field.key} className="pos-form-group">
                        <label className="pos-label">{field.label}</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={themeColors[field.key] || "#000000"}
                            onChange={(e) => handleColorChange(field.key, e.target.value)}
                            className="h-10 w-14 border border-slate-200 p-0.5 bg-white"
                          />
                          <input
                            type="text"
                            className="pos-input"
                            value={themeColors[field.key] || ""}
                            onChange={(e) => handleColorChange(field.key, e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" className="pos-btn-primary min-w-[160px]" disabled={saving}>
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
