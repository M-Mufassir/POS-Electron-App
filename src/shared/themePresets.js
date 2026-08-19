// Every CSS custom property in src/ui/css/index.css that carries a color
// (font-weight vars are excluded - those aren't "theme" in the color sense).
// Grouped for the Settings UI; THEME_COLOR_KEYS is the flat validation list.
export const THEME_COLOR_GROUPS = [
  {
    key: "brand",
    label: "Brand Colors",
    fields: [
      { key: "--primary", label: "Primary" },
      { key: "--primary-dark", label: "Primary (Dark)" },
      { key: "--primary-light", label: "Primary (Light)" },
      { key: "--success", label: "Success" },
      { key: "--success-dark", label: "Success (Dark)" },
      { key: "--warning", label: "Warning" },
      { key: "--warning-dark", label: "Warning (Dark)" },
      { key: "--danger", label: "Danger" },
      { key: "--danger-dark", label: "Danger (Dark)" },
    ],
  },
  {
    key: "backgrounds",
    label: "Backgrounds",
    fields: [
      { key: "--bg-light", label: "Page Background" },
      { key: "--bg-white", label: "Panel Background" },
      { key: "--bg-elevated", label: "Card / Elevated" },
      { key: "--bg-soft", label: "Soft Background" },
    ],
  },
  {
    key: "text",
    label: "Text",
    fields: [
      { key: "--text-h1", label: "Heading 1" },
      { key: "--text-h2", label: "Heading 2" },
      { key: "--text-h3", label: "Heading 3" },
      { key: "--text-body", label: "Body" },
      { key: "--text-label", label: "Label" },
      { key: "--text-muted", label: "Muted" },
      { key: "--text-hint", label: "Hint" },
    ],
  },
  {
    key: "borders",
    label: "Borders",
    fields: [
      { key: "--border-gray-200", label: "Border (Light)" },
      { key: "--border-gray-300", label: "Border (Strong)" },
    ],
  },
]

export const THEME_COLOR_KEYS = THEME_COLOR_GROUPS.flatMap((group) => group.fields.map((field) => field.key))

// LIGHT matches the app's original hardcoded index.css values exactly, so
// existing installs look unchanged until an admin actively picks something
// else.
const LIGHT = {
  "--primary": "#5b6670",
  "--primary-dark": "#474f57",
  "--primary-light": "#7d8791",
  "--success": "#56786d",
  "--success-dark": "#456056",
  "--warning": "#9f875b",
  "--warning-dark": "#816d49",
  "--danger": "#8c656c",
  "--danger-dark": "#725158",
  "--bg-light": "#e8ebef",
  "--bg-white": "#f7f8fa",
  "--bg-elevated": "#ffffff",
  "--bg-soft": "#d8dde3",
  "--text-h1": "#15191d",
  "--text-h2": "#1e252c",
  "--text-h3": "#252d35",
  "--text-body": "#2b333c",
  "--text-label": "#44505b",
  "--text-muted": "#62707d",
  "--text-hint": "#8994a0",
  "--border-gray-200": "#d3d8de",
  "--border-gray-300": "#c0c8d1",
}

const DARK = {
  "--primary": "#8b96a3",
  "--primary-dark": "#6b7580",
  "--primary-light": "#aab4bf",
  "--success": "#6fae95",
  "--success-dark": "#4f8a72",
  "--warning": "#d9b06b",
  "--warning-dark": "#b8934f",
  "--danger": "#d97b85",
  "--danger-dark": "#b85864",
  "--bg-light": "#1a1d21",
  "--bg-white": "#232730",
  "--bg-elevated": "#2b2f38",
  "--bg-soft": "#333844",
  "--text-h1": "#f5f6f8",
  "--text-h2": "#e8eaed",
  "--text-h3": "#dce0e5",
  "--text-body": "#cfd4da",
  "--text-label": "#b8bfc7",
  "--text-muted": "#8b93a0",
  "--text-hint": "#6b7280",
  "--border-gray-200": "#3a3f4a",
  "--border-gray-300": "#4a505c",
}

const OCEAN = {
  "--primary": "#2b6cb0",
  "--primary-dark": "#1e4e82",
  "--primary-light": "#4a89cc",
  "--success": "#2f9e6e",
  "--success-dark": "#22794f",
  "--warning": "#d69e2e",
  "--warning-dark": "#b7791f",
  "--danger": "#c53030",
  "--danger-dark": "#9b2c2c",
  "--bg-light": "#eaf2fb",
  "--bg-white": "#f7fafd",
  "--bg-elevated": "#ffffff",
  "--bg-soft": "#d7e6f5",
  "--text-h1": "#102a43",
  "--text-h2": "#1a3a5c",
  "--text-h3": "#24507a",
  "--text-body": "#2c3e50",
  "--text-label": "#3d5670",
  "--text-muted": "#64748b",
  "--text-hint": "#94a3b8",
  "--border-gray-200": "#cbdcee",
  "--border-gray-300": "#a9c4de",
}

const WARM = {
  "--primary": "#b45309",
  "--primary-dark": "#92400e",
  "--primary-light": "#d97706",
  "--success": "#4d7c0f",
  "--success-dark": "#3f6212",
  "--warning": "#ca8a04",
  "--warning-dark": "#a16207",
  "--danger": "#b91c1c",
  "--danger-dark": "#991b1b",
  "--bg-light": "#fdf6ec",
  "--bg-white": "#fffaf3",
  "--bg-elevated": "#ffffff",
  "--bg-soft": "#f5e8d3",
  "--text-h1": "#451a03",
  "--text-h2": "#5c2d0c",
  "--text-h3": "#713f12",
  "--text-body": "#44403c",
  "--text-label": "#57534e",
  "--text-muted": "#78716c",
  "--text-hint": "#a8a29e",
  "--border-gray-200": "#e7d8bd",
  "--border-gray-300": "#d6c19a",
}

export const THEME_PRESETS = {
  light: { label: "Light", colors: LIGHT },
  dark: { label: "Dark", colors: DARK },
  ocean: { label: "Ocean", colors: OCEAN },
  warm: { label: "Warm", colors: WARM },
}

export const DEFAULT_THEME_PRESET = "light"
export const DEFAULT_THEME_COLORS = LIGHT

// Fills in any color the caller's map is missing (e.g. an older saved
// custom theme from before a new variable was added) using the light
// preset, so the app never ends up with an unset CSS variable.
export const withThemeDefaults = (colors) => ({ ...DEFAULT_THEME_COLORS, ...(colors || {}) })
