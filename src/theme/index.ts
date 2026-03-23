/**
 * Theme system powered by @oxyhq/bloom color presets.
 *
 * Reads the "oxy" preset (or any preset) from Bloom's APP_COLOR_PRESETS
 * and injects CSS custom properties on <html>. Tailwind @theme references
 * these variables so all utility classes update automatically.
 *
 * Persistence: localStorage keys "theme" (dark|light) and "colorPreset" (AppColorName).
 */

import {
  APP_COLOR_PRESETS,
  APP_COLOR_NAMES,
  hexToAppColorName,
  type AppColorName,
} from '@oxyhq/bloom/theme'

export { APP_COLOR_PRESETS, APP_COLOR_NAMES, hexToAppColorName }
export type { AppColorName }

export type ThemeMode = 'light' | 'dark'

const STORAGE_KEY_MODE = 'theme'
const STORAGE_KEY_PRESET = 'colorPreset'

export const DEFAULT_PRESET: AppColorName = 'oxy'
export const DEFAULT_MODE: ThemeMode = 'dark'

/* ── Getters ── */

export function getSavedMode(): ThemeMode {
  const saved = localStorage.getItem(STORAGE_KEY_MODE)
  return saved === 'light' ? 'light' : DEFAULT_MODE
}

export function getSavedPreset(): AppColorName {
  const saved = localStorage.getItem(STORAGE_KEY_PRESET) as AppColorName | null
  if (saved && APP_COLOR_PRESETS[saved]) return saved
  return DEFAULT_PRESET
}

/* ── Setters ── */

export function setMode(mode: ThemeMode) {
  localStorage.setItem(STORAGE_KEY_MODE, mode)
  document.documentElement.classList.toggle('dark', mode === 'dark')
  // Re-apply preset to pick up light/dark variant
  applyPreset(getSavedPreset(), mode)
}

export function setColorPreset(preset: AppColorName) {
  localStorage.setItem(STORAGE_KEY_PRESET, preset)
  applyPreset(preset, getSavedMode())
}

/* ── Core: inject Bloom CSS variables onto :root ── */

export function applyPreset(preset: AppColorName, mode: ThemeMode) {
  const config = APP_COLOR_PRESETS[preset]
  if (!config) return

  const vars = mode === 'dark' ? config.dark : config.light
  const root = document.documentElement

  for (const [key, value] of Object.entries(vars)) {
    // Bloom stores bare HSL values like "277 66% 56%"
    // We wrap in hsl() for CSS consumption
    root.style.setProperty(key, `hsl(${value})`)
  }
}

/**
 * Apply user's color as the theme preset (like Mention does).
 * Called when auth state changes. Falls back to saved preset if no user color.
 */
export function applyUserColor(userColorHex?: string | null) {
  if (userColorHex) {
    const presetName = hexToAppColorName(userColorHex)
    setColorPreset(presetName)
  }
}

/* ── Initialise on import (called once from main.tsx) ── */

export function initTheme() {
  const mode = getSavedMode()
  const preset = getSavedPreset()
  document.documentElement.classList.toggle('dark', mode === 'dark')
  applyPreset(preset, mode)
}
