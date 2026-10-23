import { bloomThemeCss, getPresetVars } from '@oxy.so/bloom/design-tokens';
import type { AppColorName } from '@oxy.so/bloom/color-presets';

// Bloom exposes its complete preset and CSS vocabulary publicly. Its internal
// scope builder is not exported, so derive the alias map from that vocabulary
// instead of copying role names or reconstructing a recipe from its seed.
const aliases = [...bloomThemeCss().matchAll(/(--color-[\w-]+):\s*var\((--[\w-]+)\);/g)];

export function presetScopeVars(preset: AppColorName, mode: 'light' | 'dark') {
  const tokens = getPresetVars(preset, mode);
  const vars: Record<string, string> = { ...tokens };
  for (const [token, value] of Object.entries(tokens)) {
    vars[`--color-${token.slice(2)}`] = value;
  }
  for (const [, alias, token] of aliases) {
    if (tokens[token] !== undefined) vars[alias] = tokens[token];
  }
  return vars;
}
