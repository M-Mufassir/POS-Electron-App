/** @type {import('tailwindcss').Config} */

// Tailwind bakes these into generated CSS as plain strings - using
// color-mix() with our theme CSS variables means every existing
// bg-slate-*/text-slate-*/border-red-*/etc. utility class across the app
// resolves against the *current* theme at paint time, with no JSX changes
// required and no need to hunt down every raw Tailwind color usage.
const tint = (varName, percent, into = "white") => `color-mix(in srgb, var(${varName}) ${percent}%, ${into})`

// Neutral scale (slate/gray): 50 = lightest surface, 900 = darkest text.
// "slate" and "gray" are used interchangeably across this codebase for the
// same neutral UI text/background/border purpose, so both get this mapping.
const neutralScale = {
  50: "var(--bg-white)",
  100: "var(--bg-soft)",
  200: "var(--border-gray-200)",
  300: "var(--border-gray-300)",
  400: "var(--text-hint)",
  500: "var(--text-muted)",
  600: "var(--text-label)",
  700: "var(--text-h3)",
  800: "var(--text-h1)",
  900: "var(--text-h1)",
  950: "var(--text-h1)",
}

// Semantic scale (green/red/amber/blue): built from our base+dark pair for
// that color, interpolated toward white for tints (50-400) and toward black
// for shades (800-950), so badges/banners/pills stay legible in any theme.
const semanticScale = (baseVar, darkVar) => ({
  50: tint(baseVar, 10),
  100: tint(baseVar, 20),
  200: tint(baseVar, 35),
  300: tint(baseVar, 55),
  400: tint(baseVar, 75),
  500: `var(${baseVar})`,
  600: `color-mix(in srgb, var(${baseVar}) 60%, var(${darkVar}) 40%)`,
  700: `var(${darkVar})`,
  800: tint(darkVar, 85, "black"),
  900: tint(darkVar, 70, "black"),
  950: tint(darkVar, 55, "black"),
})

export default {
  content: [
  "./index.html",
  "./src/**/*.{js,jsx,ts,tsx}",
],
  theme: {
    extend: {
      colors: {
        slate: neutralScale,
        gray: neutralScale,
        green: semanticScale("--success", "--success-dark"),
        red: semanticScale("--danger", "--danger-dark"),
        amber: semanticScale("--warning", "--warning-dark"),
        blue: semanticScale("--primary", "--primary-dark"),
      },
    },
  },
  plugins: [],
}
