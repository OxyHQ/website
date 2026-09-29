import {
  SegmentedControl,
  SegmentedControlItem,
  SegmentedControlItemText,
} from '@oxy.so/bloom/segmented-control'
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
    <div className="mb-6 max-w-full overflow-x-auto">
      <SegmentedControl label="Locale" type="tabs" value={activeLocale} onValueChange={onLocaleChange}>
        {locales.map((locale) => (
          <SegmentedControlItem key={locale.code} value={locale.code}>
            <SegmentedControlItemText>
              {locale.isDefault ? `${locale.nativeName} (default)` : locale.nativeName}
            </SegmentedControlItemText>
          </SegmentedControlItem>
        ))}
      </SegmentedControl>
    </div>
  )
}
