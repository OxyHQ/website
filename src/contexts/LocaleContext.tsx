import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../api/client'

interface LocaleContextValue {
  locale: string
  defaultLocale: string
  isDefaultLocale: boolean
  locales: Array<{ code: string; name: string; nativeName: string; isDefault: boolean }>
  setLocale: (code: string) => void
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: 'en',
  defaultLocale: 'en',
  isDefaultLocale: true,
  locales: [],
  setLocale: () => {},
})

export function useCurrentLocale() {
  return useContext(LocaleContext).locale
}

export function useLocaleContext() {
  return useContext(LocaleContext)
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()

  const { data: locales } = useQuery({
    queryKey: ['public-locales'],
    queryFn: () => apiFetch<Array<{ code: string; name: string; nativeName: string; isDefault: boolean }>>('/locales'),
    staleTime: 300_000,
    retry: 1,
  })

  const defaultLocale = locales?.find(l => l.isDefault)?.code ?? 'en'
  const enabledCodes = useMemo(() => new Set(locales?.map(l => l.code) ?? []), [locales])

  // Detect locale from first path segment (e.g., /es/pricing → "es")
  const pathSegments = location.pathname.split('/').filter(Boolean)
  const firstSegment = pathSegments[0]
  const detectedLocale = firstSegment && enabledCodes.has(firstSegment) ? firstSegment : null

  const locale = detectedLocale ?? defaultLocale
  const isDefaultLocale = locale === defaultLocale

  const setLocale = (code: string) => {
    // Strip current locale prefix from path
    const pathWithoutLocale = detectedLocale
      ? '/' + pathSegments.slice(1).join('/')
      : location.pathname

    if (code === defaultLocale) {
      navigate(pathWithoutLocale + location.search)
    } else {
      const cleanPath = pathWithoutLocale === '/' ? '' : pathWithoutLocale
      navigate(`/${code}${cleanPath}${location.search}`)
    }
  }

  const value = useMemo(() => ({
    locale,
    defaultLocale,
    isDefaultLocale,
    locales: locales ?? [],
    setLocale,
  }), [locale, defaultLocale, isDefaultLocale, locales, location.pathname])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}
