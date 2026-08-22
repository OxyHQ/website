import type { AppColorName } from '@oxyhq/bloom/color-presets'
import { getPresetVars } from '@oxyhq/bloom/design-tokens'

export type ColorMode = 'light' | 'dark'

export interface LabPalette {
  canvas: string
  shell: string
  surface: string
  raised: string
  text: string
  textMuted: string
  identity: string
  onIdentity: string
  action: string
  onAction: string
  actionSoft: string
}

function requiredToken(tokens: Record<string, string>, name: string): string {
  const value = tokens[`--${name}`]
  if (!value) throw new Error(`Bloom did not resolve the required --${name} token`)
  return value
}

/** Resolve only the semantic Bloom roles painted by the public color lab. */
export function resolveLabPalette(name: AppColorName, mode: ColorMode): LabPalette {
  const tokens = getPresetVars(name, mode)
  const token = (role: string): string => requiredToken(tokens, role)

  return {
    canvas: token('background'),
    shell: token('surface'),
    surface: token('popover'),
    raised: token('card'),
    text: token('foreground'),
    textMuted: token('muted-foreground'),
    identity: token('primary'),
    onIdentity: token('primary-foreground'),
    action: token('tertiary'),
    onAction: token('tertiary-foreground'),
    actionSoft: token('tertiary-subtle'),
  }
}
