// Chart colors are deliberately NOT drawn from the app's brand theme
// (--primary/--success/--warning/--danger): those are low-chroma "muted"
// brand colors that fail categorical-palette validation (colorblind
// separation, contrast) when used as chart series. This is the dataviz
// skill's own validated reference palette instead - see
// node_modules-adjacent skill docs, palette.md - fixed hex, not themed,
// picked per light/dark based on the app's current preset since this app's
// "dark" theme uses a genuinely dark card surface while the others don't.

const LIGHT = {
  surface: "#fcfcfb",
  ink: "#0b0b0b",
  secondaryInk: "#52514e",
  mutedInk: "#898781",
  gridline: "#e1e0d9",
  axis: "#c3c2b7",
  // Validated 2-series pair (Sales vs Collected) - passes CVD/contrast in full.
  series: {
    sales: "#2a78d6",
    collected: "#008300",
  },
  // Validated 4-slot categorical order (reused for both breakdown charts).
  categorical: ["#2a78d6", "#eb6834", "#1baf7a", "#eda100"],
}

const DARK = {
  surface: "#1a1a19",
  ink: "#ffffff",
  secondaryInk: "#c3c2b7",
  mutedInk: "#898781",
  gridline: "#2c2c2a",
  axis: "#383835",
  series: {
    sales: "#3987e5",
    collected: "#008300",
  },
  categorical: ["#3987e5", "#d95926", "#199e70", "#c98500"],
}

// The app has explicit theme presets rather than a light/dark toggle; only
// the "dark" preset uses a genuinely dark card surface, so that's the only
// one that should get the dark chart variant. "Custom" defaults to light,
// which is right for the common case of a custom theme built on a light
// card surface.
export function getChartPalette(themePreset) {
  return themePreset === "dark" ? DARK : LIGHT
}
