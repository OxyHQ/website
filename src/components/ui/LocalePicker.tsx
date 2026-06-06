import { useState, useCallback } from 'react'
import { useLocaleContext, useTranslation } from '../../lib/i18n'
import { Globe, Check } from 'lucide-react'

/**
 * Language list (heading + grid) with no outer chrome. Composed into the desktop
 * settings dropdown and the standalone {@link LocalePanel}.
 */
export function LocaleGrid({ onSelect }: { onSelect: () => void }) {
  const { locale, locales, setLocale } = useLocaleContext()
  const { t } = useTranslation()

  return (
    <>
      <p className="mb-1 px-2 pt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {t('common.language')}
      </p>
      <ul className="grid grid-cols-2 gap-1.5">
        {locales.map((l) => {
          const active = l.code === locale
          return (
            <li key={l.code}>
              <button
                onClick={() => {
                  setLocale(l.code)
                  onSelect()
                }}
                className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left transition-colors hover:bg-foreground/5 ${
                  active ? 'bg-foreground/5' : ''
                }`}
              >
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm text-foreground">{l.nativeName}</span>
                  <span className="truncate text-xs text-muted-foreground">{l.name}</span>
                </span>
                {active && <Check className="size-4 shrink-0 text-foreground" />}
              </button>
            </li>
          )
        })}
      </ul>
    </>
  )
}

/** Language grid in a fixed-width, padded panel — the mobile standalone popover. */
export function LocalePanel({ onSelect }: { onSelect: () => void }) {
  return (
    <div className="w-[340px] max-w-[calc(100vw-2rem)] p-2">
      <LocaleGrid onSelect={onSelect} />
    </div>
  )
}

/**
 * Standalone language picker (trigger + its own popover). Used in the mobile
 * drawer. The desktop navbar instead routes language + theme through its shared
 * settings dropdown.
 */
export default function LocalePicker() {
  const { locale, locales } = useLocaleContext()
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  // React 19 callback ref with cleanup — listener lives only while the dropdown is mounted.
  const dropdownRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    const handler = (e: MouseEvent) => {
      if (!node.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (locales.length <= 1) return null

  const current = locales.find((l) => l.code === locale)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-transparent px-2.5 text-sm text-muted-foreground transition-colors duration-300 hover:bg-foreground/5 hover:text-foreground"
        aria-label={t('common.changeLanguage')}
        aria-expanded={open}
      >
        <Globe className="size-4" />
        <span className="hidden sm:inline">{current?.nativeName ?? locale.toUpperCase()}</span>
      </button>

      {open && (
        <div
          ref={dropdownRef}
          className="animate-nav-fade-in absolute right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-background/85 shadow-lg backdrop-blur-md"
        >
          <LocalePanel onSelect={() => setOpen(false)} />
        </div>
      )}
    </div>
  )
}
