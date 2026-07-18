import { createContext } from 'react'
import {
  DEFAULT_LOCALE,
  LOCALE_DISPLAY,
  type Locale,
  type TranslateFn,
} from './types'

export interface LocaleContextValue {
  /** The active locale (always one of `SUPPORTED_LOCALES`). */
  locale: Locale
  /** The default locale exposed by the CMS, or `'en'` while loading. */
  defaultLocale: Locale
  /** `true` when the active locale matches the default. */
  isDefaultLocale: boolean
  /** `true` when the active locale renders right-to-left (currently only `'ar'`). */
  isRtl: boolean
  /**
   * Locales available in the picker. Sourced from `/locales`, falls back to the
   * static list. `translationReady` marks the ones whose `/<code>/…` URLs may be
   * advertised (hreflang, og:locale:alternate) and prerendered; it is `false` on
   * the static fallback and on the default locale, which lives at the bare path.
   */
  locales: Array<{
    code: Locale
    name: string
    nativeName: string
    isDefault: boolean
    translationCount: number
    translationReady: boolean
  }>
  /** Switches the active locale by rewriting the current pathname. Persists in localStorage. */
  setLocale: (code: Locale) => void
  /** Resolves a key against the active locale dictionary with `{var}` interpolation. */
  t: TranslateFn
}

export const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  defaultLocale: DEFAULT_LOCALE,
  isDefaultLocale: true,
  isRtl: false,
  locales: LOCALE_DISPLAY.map((l) => ({
    ...l,
    isDefault: l.code === DEFAULT_LOCALE,
    translationCount: 0,
    translationReady: false,
  })),
  setLocale: () => {},
  t: (key) => key,
})
