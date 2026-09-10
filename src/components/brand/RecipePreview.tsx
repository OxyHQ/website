import { useState, type CSSProperties } from 'react'
import { getPresetVars } from '@oxy.so/bloom/design-tokens'
import { APP_COLOR_NAMES, type AppColorName } from '@oxy.so/bloom/color-presets'

export function recipeStyle(preset: AppColorName, mode: 'light' | 'dark'): CSSProperties {
  const vars = getPresetVars(preset, mode)
  return {
    ...vars,
    ...Object.fromEntries(
      Object.entries(vars).map(([key, value]) => [`--color-${key.slice(2)}`, value]),
    ),
  } as CSSProperties
}

export default function RecipePreview() {
  const [preset, setPreset] = useState<AppColorName>('oxy')
  const [mode, setMode] = useState<'light' | 'dark'>('light')
  return (
    <div className="space-y-6">
      <div className="bloom-toolbar flex flex-wrap gap-4">
        <label className="grid gap-2 text-sm">
          Bloom recipe
          <select
            aria-label="Bloom recipe"
            value={preset}
            onChange={(e) => setPreset(e.target.value as AppColorName)}
          >
            {APP_COLOR_NAMES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm">
          Appearance
          <select
            aria-label="Appearance"
            value={mode}
            onChange={(e) => setMode(e.target.value as 'light' | 'dark')}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
      </div>
      <div
        style={recipeStyle(preset, mode)}
        className="rounded-3xl border border-border bg-background p-6 text-foreground md:p-10"
      >
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <p className="oxy-eyebrow mb-6">Oxy / {preset}</p>
            <p className="oxy-title">
              Room for
              <br />
              your ideas.
            </p>
            <p className="mt-6 max-w-sm text-lg">
              One family of colours. Different ways to express it.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(['primary', 'secondary', 'tertiary', 'card'] as const).map((role) => (
              <div
                key={role}
                className="oxy-recipe-swatch"
                style={{ background: `var(--${role})`, color: `var(--${role}-foreground)` }}
              >
                <span className="text-sm capitalize">{role}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-8 flex flex-wrap gap-3 border-t border-border pt-6">
          <span className="rounded-full bg-primary px-6 py-3 text-primary-foreground">
            Primary action
          </span>
          <span className="rounded-full border border-border bg-surface px-6 py-3">
            Supporting action
          </span>
          <span className="self-center text-sm text-muted-foreground">Preview specimen</span>
        </div>
      </div>
    </div>
  )
}
