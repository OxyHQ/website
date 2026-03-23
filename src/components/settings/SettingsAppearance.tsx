import { useState } from 'react'
import {
  APP_COLOR_PRESETS,
  APP_COLOR_NAMES,
  type AppColorName,
  type ThemeMode,
  getSavedMode,
  getSavedPreset,
  setMode,
  setColorPreset,
} from '../../theme'

const ALL_PRESETS: AppColorName[] = [...APP_COLOR_NAMES, 'oxy']

export default function SettingsAppearance() {
  const [currentMode, setCurrentMode] = useState<ThemeMode>(getSavedMode)
  const [currentPreset, setCurrentPreset] = useState<AppColorName>(getSavedPreset)

  const handleMode = (mode: ThemeMode) => {
    setMode(mode)
    setCurrentMode(mode)
  }

  const handlePreset = (preset: AppColorName) => {
    setColorPreset(preset)
    setCurrentPreset(preset)
  }

  return (
    <div className="container py-16 lg:py-24">
      <div className="mx-auto max-w-2xl">
        {/* Page header */}
        <h1 className="text-heading-responsive-md">Settings</h1>
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
                onClick={() => handleMode('light')}
              >
                <LightPreview />
              </ModeCard>
              <ModeCard
                label="Dark"
                active={currentMode === 'dark'}
                onClick={() => handleMode('dark')}
              >
                <DarkPreview />
              </ModeCard>
            </div>
          </div>

          {/* Color presets */}
          <div className="mt-10">
            <h3 className="text-sm font-medium text-foreground">Accent color</h3>
            <div className="mt-3 grid grid-cols-5 gap-3 sm:grid-cols-6 md:grid-cols-11">
              {ALL_PRESETS.map((name) => {
                const preset = APP_COLOR_PRESETS[name]
                if (!preset) return null
                return (
                  <button
                    key={name}
                    onClick={() => handlePreset(name)}
                    className={`group flex flex-col items-center gap-2 rounded-xl p-2 transition-colors duration-200 ${
                      currentPreset === name
                        ? 'bg-surface ring-2 ring-primary'
                        : 'hover:bg-surface'
                    }`}
                    title={name}
                  >
                    <div
                      className={`size-8 rounded-full border-2 transition-shadow duration-200 ${
                        currentPreset === name
                          ? 'border-primary shadow-[0_0_0_2px_var(--background)]'
                          : 'border-transparent group-hover:border-border'
                      }`}
                      style={{ backgroundColor: preset.hex }}
                    />
                    <span className="text-[11px] capitalize text-muted-foreground leading-none">
                      {name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
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

function LightPreview() {
  return (
    <div className="flex h-full w-full flex-col bg-[hsl(0_0%_97%)] p-2.5">
      <div className="flex items-center gap-1.5 rounded-md bg-white p-1.5 shadow-sm">
        <div className="h-1.5 w-6 rounded-full bg-gray-300" />
        <div className="h-1.5 w-4 rounded-full bg-gray-200" />
        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-gray-300" />
      </div>
      <div className="mt-2 flex flex-1 gap-1.5">
        <div className="w-1/3 rounded-md bg-gray-100 p-1.5">
          <div className="h-1 w-full rounded-full bg-gray-200" />
          <div className="mt-1 h-1 w-3/4 rounded-full bg-gray-200" />
        </div>
        <div className="flex-1 rounded-md bg-white p-1.5 shadow-sm">
          <div className="h-1 w-3/4 rounded-full bg-gray-200" />
          <div className="mt-1 h-1 w-1/2 rounded-full bg-gray-100" />
          <div className="mt-2 h-3 w-full rounded bg-gray-50" />
        </div>
      </div>
    </div>
  )
}

function DarkPreview() {
  return (
    <div className="flex h-full w-full flex-col bg-[hsl(0_0%_8%)] p-2.5">
      <div className="flex items-center gap-1.5 rounded-md bg-[hsl(0_0%_12%)] p-1.5">
        <div className="h-1.5 w-6 rounded-full bg-[hsl(0_0%_25%)]" />
        <div className="h-1.5 w-4 rounded-full bg-[hsl(0_0%_20%)]" />
        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-[hsl(0_0%_25%)]" />
      </div>
      <div className="mt-2 flex flex-1 gap-1.5">
        <div className="w-1/3 rounded-md bg-[hsl(0_0%_12%)] p-1.5">
          <div className="h-1 w-full rounded-full bg-[hsl(0_0%_20%)]" />
          <div className="mt-1 h-1 w-3/4 rounded-full bg-[hsl(0_0%_20%)]" />
        </div>
        <div className="flex-1 rounded-md bg-[hsl(0_0%_12%)] p-1.5">
          <div className="h-1 w-3/4 rounded-full bg-[hsl(0_0%_22%)]" />
          <div className="mt-1 h-1 w-1/2 rounded-full bg-[hsl(0_0%_18%)]" />
          <div className="mt-2 h-3 w-full rounded bg-[hsl(0_0%_15%)]" />
        </div>
      </div>
    </div>
  )
}
