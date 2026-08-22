import { APP_COLOR_PRESETS, type AppColorName } from '@oxyhq/bloom/color-presets'
import type { NewsroomPost } from '../data/newsroom'

/** Bloom owns the available recipe names; newsroom only chooses among them. */
export const NEWSROOM_THEME_PRESETS = Object.keys(APP_COLOR_PRESETS) as AppColorName[]

const NEWSROOM_THEME_SET = new Set<string>(NEWSROOM_THEME_PRESETS)

export function isNewsroomThemePreset(value: unknown): value is AppColorName {
  return typeof value === 'string' && NEWSROOM_THEME_SET.has(value)
}

/** Stable fallback for legacy rows created before `themePreset` existed. */
export function newsroomThemeFor(post: Pick<NewsroomPost, 'slug' | 'themePreset'>): AppColorName {
  if (isNewsroomThemePreset(post.themePreset)) return post.themePreset

  let hash = 0
  for (const character of post.slug) hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  return NEWSROOM_THEME_PRESETS[hash % NEWSROOM_THEME_PRESETS.length] ?? 'oxy'
}
