import { useState } from 'react'
import type { ReactNode } from 'react'
import { Sun, Moon, Globe } from 'lucide-react'
import { setMode, getSavedMode, type ThemeMode } from '../../theme'
import { useLocaleContext, useTranslation } from '../../lib/i18n'
import LanguageDialog from './LanguageDialog'

/**
 * Contents of the navbar settings dropdown: a theme switcher plus, when more
 * than one locale is available, a button that opens the language dialog.
 *
 * The full locale list moved out of this dropdown: with more than a handful of
 * languages the grid outgrew the panel, and a dialog can group them by region
 * and stay readable. Rendered inside the navbar's shared dropdown viewport,
 * which supplies the panel chrome.
 */
export function SettingsPanel({
  showLanguage,
  className = 'w-[340px] max-w-[calc(100vw-2rem)]',
}: {
  showLanguage: boolean
  className?: string
}) {
  const { t } = useTranslation()
  const { locale, locales } = useLocaleContext()
  const [mode, setThemeMode] = useState<ThemeMode>(() => getSavedMode())
  const [languageOpen, setLanguageOpen] = useState(false)
  const current = locales.find((entry) => entry.code === locale)

  const choose = (next: ThemeMode) => {
    setMode(next)
    setThemeMode(next)
  }

  const themeOptions: { value: ThemeMode; label: string; icon: ReactNode }[] = [
    { value: 'light', label: t('common.light'), icon: <Sun className="size-4" /> },
    { value: 'dark', label: t('common.dark'), icon: <Moon className="size-4" /> },
  ]

  return (
    <div className={`${className} p-2`}>
      <p className="mb-1 px-2 pt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {t('common.theme')}
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        {themeOptions.map((opt) => {
          const active = mode === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => choose(opt.value)}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors ${
                active ? 'bg-foreground/8 text-foreground' : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground'
              }`}
              aria-pressed={active}
            >
              {opt.icon}
              {opt.label}
            </button>
          )
        })}
      </div>

      {showLanguage && (
        <>
          <div className="-mx-2 my-2 h-px bg-border" />
          <button
            type="button"
            onClick={() => setLanguageOpen(true)}
            className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <span className="flex items-center gap-2">
              <Globe className="size-4" />
              {t('common.language')}
            </span>
            <span className="truncate text-foreground">{current?.nativeName ?? locale.toUpperCase()}</span>
          </button>
          <LanguageDialog open={languageOpen} onClose={() => setLanguageOpen(false)} />
        </>
      )}
    </div>
  )
}
