import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../../api/client'

interface Locale {
  _id: string
  code: string
  name: string
  nativeName: string
  isDefault: boolean
  enabled: boolean
}

export function useLocales() {
  return useQuery({
    queryKey: ['locales-all'],
    queryFn: () => apiFetch<Locale[]>('/locales/all'),
    retry: 1,
    staleTime: 300_000,
  })
}

export default function LocaleSwitcher({
  activeLocale,
  onLocaleChange,
}: {
  activeLocale: string
  onLocaleChange: (code: string) => void
}) {
  const { data: locales } = useLocales()

  if (!locales || locales.length <= 1) return null

  return (
    <div className="mb-6 flex gap-1 rounded-lg border border-border bg-muted/50 p-1">
      {locales.map((locale) => (
        <button
          key={locale.code}
          onClick={() => onLocaleChange(locale.code)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            activeLocale === locale.code
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {locale.nativeName}
          {locale.isDefault && <span className="ml-1 text-xs text-muted-foreground">(default)</span>}
        </button>
      ))}
    </div>
  )
}
