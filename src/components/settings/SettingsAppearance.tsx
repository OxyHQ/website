import { useBloomTheme } from '@oxyhq/bloom/theme'
import { getPresetVars } from '@oxyhq/bloom/design-tokens'
import { type ColorPresetRecipe } from '@oxyhq/bloom/color-presets'
import { type AppColorName } from '../../theme'
import { PUBLIC_COLOR_PRESET_GROUPS } from '../../theme/preset-catalog'
import { AnimatedTitle } from '../ui/AnimatedTitle'

export default function SettingsAppearance() {
  const { mode: currentMode, colorPreset: currentPreset, setMode, setColorPreset } = useBloomTheme()
  const previewMode = currentMode === 'dark' ? 'dark' : 'light'

  return (
    <div className="container py-16 lg:py-24">
      <div className="mx-auto max-w-2xl">
        {/* Page header */}
        <AnimatedTitle as="h1" className="text-heading-responsive-md">Settings</AnimatedTitle>
        <p className="mt-3 text-base text-muted-foreground">
          Customize the look and feel of the website.
        </p>

        {/* Appearance section */}
        <section className="mt-12">
          <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose your preferred theme mode and accent color.
          </p>

          {/* Mode toggle */}
          <div className="mt-8">
            <h3 className="text-sm font-medium text-foreground">Theme</h3>
            <div className="mt-3 flex gap-3">
              <ModeCard
                label="Light"
                active={currentMode === 'light'}
                onClick={() => setMode('light')}
              >
                <ThemePreview preset={currentPreset} mode="light" />
              </ModeCard>
              <ModeCard
                label="Dark"
                active={currentMode === 'dark'}
                onClick={() => setMode('dark')}
              >
                <ThemePreview preset={currentPreset} mode="dark" />
              </ModeCard>
            </div>
          </div>

          {/* Color presets */}
          <div className="mt-10">
            <h3 className="text-sm font-medium text-foreground">Accent color</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Each recipe resolves its own surfaces and supporting action colors in light and dark mode.
            </p>
            <div className="mt-6 space-y-8">
              {PUBLIC_COLOR_PRESET_GROUPS.map((group) => (
                <section key={group.name} aria-labelledby={`preset-family-${group.name}`}>
                  <div className="mb-3">
                    <h4 id={`preset-family-${group.name}`} className="text-sm font-semibold text-foreground">
                      {group.displayName}
                    </h4>
                    <p className="text-body-xs text-muted-foreground">{group.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {group.presets.map((recipe) => (
                      <PresetChoice
                        key={recipe.name}
                        recipe={recipe}
                        mode={previewMode}
                        active={currentPreset === recipe.name}
                        onClick={() => setColorPreset(recipe.name)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function PresetChoice({
  recipe,
  mode,
  active,
  onClick,
}: {
  recipe: ColorPresetRecipe
  mode: 'light' | 'dark'
  active: boolean
  onClick: () => void
}) {
  const tokens = getPresetVars(recipe.name, mode)
  return (
    <button
      type="button"
      data-color-preset={recipe.name}
      onClick={onClick}
      className={`group flex min-w-0 items-center gap-3 rounded-2xl p-2.5 text-left transition-colors duration-200 ${
        active ? 'bg-surface ring-2 ring-primary' : 'hover:bg-surface'
      }`}
      title={`${recipe.displayName}: ${recipe.description}`}
      aria-pressed={active}
    >
      <span className="relative size-10 shrink-0 overflow-hidden rounded-xl shadow-s" aria-hidden="true">
        <span className="absolute inset-y-0 left-0 w-1/2" style={{ backgroundColor: tokens['--primary'] }} />
        <span className="absolute top-0 right-0 h-1/2 w-1/2" style={{ backgroundColor: tokens['--secondary'] }} />
        <span className="absolute right-0 bottom-0 h-1/2 w-1/2" style={{ backgroundColor: tokens['--tertiary'] }} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium leading-tight text-foreground">{recipe.displayName}</span>
        <span className="mt-0.5 block text-body-xs leading-tight text-muted-foreground">
          {recipe.pairing === 'curated' ? 'Curated pairing' : 'Dynamic pairing'}
        </span>
      </span>
    </button>
  )
}

/* ── Mode card ── */

function ModeCard({
  label,
  active,
  onClick,
  children,
}: {
  label: string
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full max-w-[200px] cursor-pointer flex-col overflow-hidden rounded-xl border-2 transition-all duration-200 ${
        active
          ? 'border-primary shadow-[0_0_0_1px_var(--primary)]'
          : 'border-border hover:border-muted-foreground'
      }`}
    >
      <div className="aspect-[4/3] w-full overflow-hidden">{children}</div>
      <div
        className={`flex w-full items-center justify-center gap-2 border-t px-3 py-2.5 text-sm font-medium transition-colors ${
          active
            ? 'border-primary/20 bg-primary/5 text-primary'
            : 'border-border bg-background text-foreground'
        }`}
      >
        {active && (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M2.5 7l3 3 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {label}
      </div>
    </button>
  )
}

/* ── Theme preview thumbnails ── */

function ThemePreview({ preset, mode }: { preset: AppColorName; mode: 'light' | 'dark' }) {
  const tokens = getPresetVars(preset, mode)
  return (
    <div className="flex h-full w-full flex-col p-2.5" style={{ backgroundColor: tokens['--background'] }}>
      <div className="flex items-center gap-1.5 rounded-md p-1.5 shadow-sm" style={{ backgroundColor: tokens['--card'] }}>
        <div className="h-1.5 w-6 rounded-full" style={{ backgroundColor: tokens['--primary'] }} />
        <div className="h-1.5 w-4 rounded-full" style={{ backgroundColor: tokens['--muted'] }} />
        <div className="ml-auto h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tokens['--secondary'] }} />
      </div>
      <div className="mt-2 flex flex-1 gap-1.5">
        <div className="w-1/3 rounded-md p-1.5" style={{ backgroundColor: tokens['--surface'] }}>
          <div className="h-1 w-full rounded-full" style={{ backgroundColor: tokens['--muted-foreground'] }} />
          <div className="mt-1 h-1 w-3/4 rounded-full" style={{ backgroundColor: tokens['--border'] }} />
        </div>
        <div className="flex-1 rounded-md p-1.5 shadow-sm" style={{ backgroundColor: tokens['--card'] }}>
          <div className="h-1 w-3/4 rounded-full" style={{ backgroundColor: tokens['--foreground'] }} />
          <div className="mt-1 h-1 w-1/2 rounded-full" style={{ backgroundColor: tokens['--muted-foreground'] }} />
          <div className="mt-2 h-3 w-full rounded" style={{ backgroundColor: tokens['--primary-subtle'] }} />
        </div>
      </div>
    </div>
  )
}
