import { useLocales } from '../../api/hooks'

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
