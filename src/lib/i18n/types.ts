/* ──────────────────────────────────────────────
 * Locale + translation primitives for the Oxy
 * marketing website. The 11 supported locales
 * mirror the rest of the Oxy ecosystem (accounts
 * app, @oxyhq/core). Two-letter codes are used
 * to match the CMS `/locales` API which already
 * powers the `LocaleContext`.
 *
 * Keep this file zero-dependency — it ships in
 * every page bundle via lib/i18n.
 * ──────────────────────────────────────────── */

export type Locale =
  | 'en'
  | 'es'
  | 'fr'
  | 'de'
  | 'ja'
  | 'ko'
  | 'zh'
  | 'pt'
  | 'ar'
  | 'ca'
  | 'it'

export const SUPPORTED_LOCALES: readonly Locale[] = [
  'en', 'es', 'fr', 'de', 'ja', 'ko', 'zh', 'pt', 'ar', 'ca', 'it',
] as const

export const DEFAULT_LOCALE: Locale = 'en'

/** Locales rendered right-to-left. Used by `<html dir>` switching + layout audits. */
export const RTL_LOCALES: readonly Locale[] = ['ar'] as const

export function isRtlLocale(locale: Locale): boolean {
  return RTL_LOCALES.includes(locale)
}

/** Display metadata shown in `<LocalePicker>` even when the CMS endpoint is unreachable. */
export interface LocaleDisplayMeta {
  code: Locale
  name: string
  nativeName: string
}

export const LOCALE_DISPLAY: readonly LocaleDisplayMeta[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ca', name: 'Catalan', nativeName: 'Català' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
] as const

/** Recursive JSON-shaped value for a website locale dictionary. */
export type LocaleNode = string | LocaleNode[] | { [key: string]: LocaleNode }
export type LocaleDict = Record<string, LocaleNode>

/** Variables substituted into translation strings as `{var}` (single-brace) tokens. */
export type TranslationVars = Record<string, string | number>

/** The signature exposed by `useTranslation()`. */
export type TranslateFn = (key: string, vars?: TranslationVars) => string
