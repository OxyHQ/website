import { type CSSProperties } from 'react'
import { getPresetVars } from '@oxy.so/bloom/design-tokens'
import type { AppColorName } from '@oxy.so/bloom/color-presets'

/**
 * Bloom's resolved variables for one recipe, as inline style. Kept out of the
 * component file: a module that exports both a component and a helper cannot
 * be fast-refreshed, and this helper is used by whole pages, not just the
 * preview.
 */
export function recipeStyle(preset: AppColorName, mode: 'light' | 'dark'): CSSProperties {
  const vars = getPresetVars(preset, mode)
  return {
    ...vars,
    ...Object.fromEntries(
      Object.entries(vars).map(([key, value]) => [`--color-${key.slice(2)}`, value]),
    ),
  } as CSSProperties
}
