import { useContext } from 'react'
import { LocaleContext } from './context'
import type { Locale, TranslateFn } from './types'

/** Read the entire i18n context (locale, picker locales, RTL flag, setter, `t`). */
export function useLocaleContext() {
  return useContext(LocaleContext)
}

/** Shortcut: most consumers only need the locale code. */
export function useCurrentLocale(): Locale {
  return useContext(LocaleContext).locale
}

/** Translation hook — returns `t` plus current locale and setter. */
export function useTranslation(): {
  t: TranslateFn
  locale: Locale
  setLocale: (code: Locale) => void
} {
  const ctx = useContext(LocaleContext)
  return { t: ctx.t, locale: ctx.locale, setLocale: ctx.setLocale }
}
