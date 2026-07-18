import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../../api/client'
import {
  DEFAULT_LOCALE,
  LOCALE_DISPLAY,
  SUPPORTED_LOCALES,
  isRtlLocale,
  type Locale,
  type LocaleDict,
  type LocaleNode,
  type TranslateFn,
  type TranslationVars,
} from './types'
import { LocaleContext, type LocaleContextValue } from './context'
import en from './locales/en'
import es from './locales/es'
import fr from './locales/fr'
import de from './locales/de'
import it from './locales/it'
import pt from './locales/pt'
import ca from './locales/ca'
import ja from './locales/ja'
import ko from './locales/ko'
import zh from './locales/zh'
import ar from './locales/ar'

/* ──────────────────────────────────────────────
 * LocaleProvider
 *
 * Resolution order for the active locale:
 *   1. First URL path segment matches an enabled
 *      locale (`/es/pricing` → `'es'`). The CMS-
 *      driven `/locales` endpoint provides the
 *      enabled set; we fall back to the static
 *      `SUPPORTED_LOCALES` list while it loads
 *      so a deep-link refresh never flashes the
 *      English copy on a non-default route.
 *   2. The persisted preference from `localStorage`
 *      (key `OXY_LOCALE_STORAGE_KEY`).
 *   3. `navigator.language`, normalized to a
 *      supported locale.
 *   4. `DEFAULT_LOCALE` (`'en'`).
 *
 * `setLocale` rewrites the current pathname to
 * carry the new locale prefix (or strips it when
 * the user returns to the default locale).
 * ──────────────────────────────────────────── */

export const OXY_LOCALE_STORAGE_KEY = 'oxy:locale'

const DICTS: Record<Locale, LocaleDict> = {
  en: en as unknown as LocaleDict,
  es: es as unknown as LocaleDict,
  fr: fr as unknown as LocaleDict,
  de: de as unknown as LocaleDict,
  it: it as unknown as LocaleDict,
  pt: pt as unknown as LocaleDict,
  ca: ca as unknown as LocaleDict,
  ja: ja as unknown as LocaleDict,
  ko: ko as unknown as LocaleDict,
  zh: zh as unknown as LocaleDict,
  ar: ar as unknown as LocaleDict,
}

/** Coerce any candidate string ('es-419', 'pt-BR', 'EN', ...) to a supported `Locale` or `null`. */
function coerceLocale(value: string | null | undefined): Locale | null {
  if (!value) return null
  const lower = value.toLowerCase()
  if (SUPPORTED_LOCALES.includes(lower as Locale)) return lower as Locale
  const base = lower.split('-')[0]
  if (base && SUPPORTED_LOCALES.includes(base as Locale)) return base as Locale
  return null
}

/** Read `navigator.language` once (the user's browser preference). */
function getBrowserLocale(): Locale | null {
  if (typeof navigator === 'undefined') return null
  const nav = navigator
  const candidates: string[] = []
  if (Array.isArray(nav.languages)) candidates.push(...nav.languages)
  if (nav.language) candidates.push(nav.language)
  for (const candidate of candidates) {
    const coerced = coerceLocale(candidate)
    if (coerced) return coerced
  }
  return null
}

/** Read the persisted locale once (the user's explicit override). */
function getStoredLocale(): Locale | null {
  if (typeof window === 'undefined') return null
  try {
    return coerceLocale(window.localStorage.getItem(OXY_LOCALE_STORAGE_KEY))
  } catch {
    return null
  }
}

function persistLocale(locale: Locale): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(OXY_LOCALE_STORAGE_KEY, locale)
  } catch {
    // Storage may be disabled (private mode, quota); fall back to memory only.
  }
}

/** Resolve a dotted key against the locale dictionary. */
function lookup(dict: LocaleDict | undefined, key: string): string | undefined {
  if (!dict) return undefined
  const parts = key.split('.')
  let node: LocaleNode | LocaleNode[] | undefined = dict
  for (const part of parts) {
    if (Array.isArray(node)) {
      const idx = Number.parseInt(part, 10)
      if (!Number.isInteger(idx)) return undefined
      node = node[idx]
    } else if (node && typeof node === 'object') {
      node = (node as Record<string, LocaleNode | LocaleNode[]>)[part]
    } else {
      return undefined
    }
  }
  return typeof node === 'string' ? node : undefined
}

/** Replace `{var}` tokens with values from `vars`. Single-brace tokens. */
function interpolate(template: string, vars?: TranslationVars): string {
  if (!vars) return template
  let out = template
  for (const k of Object.keys(vars)) {
    out = out.replaceAll(`{${k}}`, String(vars[k]))
  }
  return out
}

interface ApiLocale {
  code: string
  name: string
  nativeName: string
  isDefault: boolean
  /** Translation docs for this locale. Always 0 for the default locale. */
  translationCount: number
  /**
   * Whether this locale's `/<code>/…` URLs should be advertised and prerendered.
   * Computed server-side from the same helper the sitemap uses, so the runtime
   * hreflang block and the sitemap can never advertise different locale sets.
   * Always `false` for the default locale, which lives at the bare path.
   */
  translationReady: boolean
}

interface LocaleProviderProps {
  children: ReactNode
}

export function LocaleProvider({ children }: LocaleProviderProps) {
  const navigate = useNavigate()
  const location = useLocation()

  // Fetch the CMS-managed locale list. While loading, we use the static
  // `SUPPORTED_LOCALES` so a deep-linked path with a locale prefix never
  // 404s on first paint.
  const { data: apiLocales } = useQuery<ApiLocale[]>({
    queryKey: ['public-locales'],
    queryFn: () => apiFetch<ApiLocale[]>('/locales'),
    staleTime: 300_000,
    retry: 1,
  })

  const enabledLocales: Locale[] = useMemo(() => {
    if (!apiLocales || apiLocales.length === 0) {
      return [...SUPPORTED_LOCALES]
    }
    const coerced: Locale[] = []
    for (const entry of apiLocales) {
      const code = coerceLocale(entry.code)
      if (code && !coerced.includes(code)) coerced.push(code)
    }
    return coerced.length > 0 ? coerced : [...SUPPORTED_LOCALES]
  }, [apiLocales])

  const defaultLocale: Locale = useMemo(() => {
    const fromApi = apiLocales?.find((l) => l.isDefault)?.code
    return coerceLocale(fromApi) ?? DEFAULT_LOCALE
  }, [apiLocales])

  // Detect locale from the first path segment (e.g. `/es/pricing` → `'es'`).
  const pathSegments = location.pathname.split('/').filter(Boolean)
  const firstSegment = pathSegments[0]
  const detectedFromPath = firstSegment
    ? coerceLocale(firstSegment) && enabledLocales.includes(firstSegment as Locale)
      ? (firstSegment as Locale)
      : null
    : null

  // Initial fallback chain: path → localStorage → navigator → default.
  // We compute it once via `useState` lazy init so SSR-style first render
  // doesn't flash English to a Spanish-first visitor.
  const [memoryLocale] = useState<Locale>(() => {
    return detectedFromPath ?? getStoredLocale() ?? getBrowserLocale() ?? DEFAULT_LOCALE
  })

  const locale: Locale = detectedFromPath ?? memoryLocale
  const isDefaultLocale = locale === defaultLocale
  const isRtl = isRtlLocale(locale)

  // Reflect the active locale on the <html> tag for CSS/screen readers/
  // bidi behavior. We do this in a useEffect because the html element is
  // outside the React tree and writing to it during render counts as a
  // side-effect per react-hooks/immutability.
  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    if (root.lang !== locale) root.lang = locale
    const desiredDir = isRtl ? 'rtl' : 'ltr'
    if (root.dir !== desiredDir) root.dir = desiredDir
  }, [locale, isRtl])

  const setLocale = useCallback(
    (next: Locale) => {
      if (!SUPPORTED_LOCALES.includes(next)) return
      persistLocale(next)

      // Strip the existing locale prefix from the URL before adding the new one.
      const segments = location.pathname.split('/').filter(Boolean)
      const head = segments[0]
      const isLocaleHead = head ? coerceLocale(head) !== null : false
      const pathWithoutLocale = '/' + (isLocaleHead ? segments.slice(1) : segments).join('/')

      // Keyed on the static DEFAULT_LOCALE, NOT the CMS-configured
      // `defaultLocale`: `buildLocalizedUrl` in SEO.tsx (canonical, hreflang,
      // x-default), the route table in App.tsx, the prerender and the sitemap
      // all resolve the prefix from DEFAULT_LOCALE. Keying this on the CMS
      // value instead would make the picker navigate to a URL the canonical
      // tag disagrees with the moment the CMS default is anything but 'en'.
      const nextPath =
        next === DEFAULT_LOCALE
          ? pathWithoutLocale === '/' ? '/' : pathWithoutLocale
          : `/${next}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`

      navigate(nextPath + location.search + location.hash)
    },
    [navigate, location.pathname, location.search, location.hash],
  )

  const dict = DICTS[locale] ?? DICTS[DEFAULT_LOCALE]
  const fallbackDict = DICTS[DEFAULT_LOCALE]

  const t = useCallback<TranslateFn>(
    (key, vars) => {
      const fromActive = lookup(dict, key)
      if (fromActive != null) return interpolate(fromActive, vars)
      const fromFallback = lookup(fallbackDict, key)
      if (fromFallback != null) return interpolate(fromFallback, vars)
      return key
    },
    [dict, fallbackDict],
  )

  const localesForPicker = useMemo(
    () =>
      LOCALE_DISPLAY.filter((entry) => enabledLocales.includes(entry.code)).map((entry) => {
        const apiMatch = apiLocales?.find((l) => coerceLocale(l.code) === entry.code)
        return {
          code: entry.code,
          name: apiMatch?.name ?? entry.name,
          nativeName: apiMatch?.nativeName ?? entry.nativeName,
          isDefault: entry.code === defaultLocale,
          // Absent the API entry we cannot know a locale has translations, so
          // it stays un-advertised until the real answer arrives.
          translationCount: apiMatch?.translationCount ?? 0,
          translationReady: apiMatch?.translationReady ?? false,
        }
      }),
    [apiLocales, enabledLocales, defaultLocale],
  )

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      defaultLocale,
      isDefaultLocale,
      isRtl,
      locales: localesForPicker,
      setLocale,
      t,
    }),
    [locale, defaultLocale, isDefaultLocale, isRtl, localesForPicker, setLocale, t],
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}
