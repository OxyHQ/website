import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
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
  const { locale: localeParam } = useParams<{ locale?: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  const { data: locales } = useQuery({
    queryKey: ['public-locales'],
    queryFn: () => apiFetch<Array<{ code: string; name: string; nativeName: string; isDefault: boolean }>>('/locales'),
    staleTime: 300_000,
  })

  const defaultLocale = locales?.find(l => l.isDefault)?.code ?? 'en'
  const enabledCodes = useMemo(() => new Set(locales?.map(l => l.code) ?? []), [locales])

  // Determine current locale from URL param
  const locale = localeParam && enabledCodes.has(localeParam) ? localeParam : defaultLocale
  const isDefaultLocale = locale === defaultLocale

  const setLocale = (code: string) => {
    const pathWithoutLocale = localeParam && enabledCodes.has(localeParam)
      ? location.pathname.replace(`/${localeParam}`, '') || '/'
      : location.pathname

    if (code === defaultLocale) {
      navigate(pathWithoutLocale + location.search)
    } else {
      navigate(`/${code}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}${location.search}`)
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
