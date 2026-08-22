import { APP_COLOR_PRESETS, type AppColorName } from '@oxyhq/bloom/color-presets'

/** Bloom is the source of truth for newsroom recipe names. */
export const NEWSROOM_THEME_PRESETS = Object.keys(APP_COLOR_PRESETS) as AppColorName[]

export function isNewsroomThemePreset(value: unknown): value is AppColorName {
  return typeof value === 'string' && NEWSROOM_THEME_PRESETS.includes(value as AppColorName)
}

export function newsroomThemeForSlug(slug: string): AppColorName {
  let hash = 0
  for (const character of slug) hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  return NEWSROOM_THEME_PRESETS[hash % NEWSROOM_THEME_PRESETS.length] ?? 'oxy'
}
