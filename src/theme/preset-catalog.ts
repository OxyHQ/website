import {
  COLOR_PRESET_FAMILY_REGISTRY,
  COLOR_PRESET_GROUPS,
  FREE_COLOR_NAMES,
  type ColorPresetRecipe,
} from '@oxyhq/bloom/color-presets'

export interface PublicColorPresetGroup {
  name: string
  displayName: string
  description: string
  presets: readonly ColorPresetRecipe[]
}

const FREE_COLOR_NAME_SET = new Set(FREE_COLOR_NAMES)

/**
 * Public website picker catalogue. Bloom owns the recipes, ordering and gates;
 * this projection only removes entries that need a real handle or subscription
 * entitlement. The website currently has neither signal, so it must not offer
 * a selection it cannot authorize.
 */
export const PUBLIC_COLOR_PRESET_GROUPS: readonly PublicColorPresetGroup[] =
  COLOR_PRESET_FAMILY_REGISTRY.flatMap((family) => {
    const group = COLOR_PRESET_GROUPS[family.name]
    const presets = group.presets.filter((preset) => FREE_COLOR_NAME_SET.has(preset.name))
    return presets.length > 0 ? [{ ...group, presets }] : []
  })
