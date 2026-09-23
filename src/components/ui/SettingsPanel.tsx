import { useState } from 'react'
import { RiGlobalLine } from '@oxy.so/bloom/icons/RiGlobalLine'
import { useBloomTheme, useTheme } from '@oxy.so/bloom/theme'
import {
  SegmentedControl,
  SegmentedControlItem,
  SegmentedControlItemText,
} from '@oxy.so/bloom/segmented-control'
import { useLocaleContext, useTranslation } from '../../lib/i18n'
import LanguageDialog from './LanguageDialog'

/** The control spans the panel, and its two segments share the width. */
const STRETCH = { alignSelf: 'stretch' } as const

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
  const { setMode } = useBloomTheme()
  const { isDark } = useTheme()
  const [languageOpen, setLanguageOpen] = useState(false)
  const current = locales.find((entry) => entry.code === locale)

  // What is on screen, not the stored mode: a `system` mode is still one of
  // the two, and the control should say which.
  const shown = isDark ? 'dark' : 'light'

  return (
    <div className={`${className} p-2`}>
      <p className="mb-1 px-2 pt-1 text-label-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {t('common.theme')}
      </p>
      <SegmentedControl
        label={t('common.theme')}
        type="radio"
        value={shown}
        onValueChange={setMode}
        style={STRETCH}
      >
        <SegmentedControlItem value="light">
          <SegmentedControlItemText>{t('common.light')}</SegmentedControlItemText>
        </SegmentedControlItem>
        <SegmentedControlItem value="dark">
          <SegmentedControlItemText>{t('common.dark')}</SegmentedControlItemText>
        </SegmentedControlItem>
      </SegmentedControl>

      {showLanguage && (
        <>
          <div className="-mx-2 my-2 h-px bg-border" />
          <button
            type="button"
            onClick={() => setLanguageOpen(true)}
            className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <span className="flex items-center gap-2">
              <RiGlobalLine width={16} height={16} fill="currentColor" aria-hidden />
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
