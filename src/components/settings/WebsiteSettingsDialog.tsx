import { SettingsModal, SettingsCard, SettingsSection } from '@oxy.so/bloom/settings-modal'
import { useBloomTheme } from '@oxy.so/bloom/theme'
import { SegmentedControl, SegmentedControlItem, SegmentedControlItemText } from '@oxy.so/bloom/segmented-control'
import { RiSettings3Line } from '@oxy.so/bloom/icons/RiSettings3Line'
import { RiGlobalLine } from '@oxy.so/bloom/icons/RiGlobalLine'
import { useLocaleContext, useTranslation } from '../../lib/i18n'

export default function WebsiteSettingsDialog({ open, onClose, showLanguage }: {
  open: boolean
  onClose: () => void
  showLanguage: boolean
}) {
  const { t } = useTranslation()
  const { mode, setMode } = useBloomTheme()
  const { locale, locales, setLocale } = useLocaleContext()

  return (
    <SettingsModal
      open={open}
      onClose={onClose}
      defaultPage="theme"
      labels={{ dialog: t('footer.settings'), nav: t('footer.settings'), close: t('common.close') }}
      groups={[{
        label: t('footer.settings'),
        items: [
          { key: 'theme', page: 'theme', label: t('common.theme'), icon: RiSettings3Line },
          ...(showLanguage ? [{ key: 'language', page: 'language', label: t('common.language'), icon: RiGlobalLine }] : []),
        ],
      }]}
      pages={{
        theme: {
          title: t('common.theme'),
          content: (
            <SettingsSection>
              <SettingsCard>
                <div className="p-3">
                  <SegmentedControl label={t('common.theme')} type="radio" value={mode} onValueChange={setMode} style={{ alignSelf: 'stretch' }}>
                    {(['light', 'dark'] as const).map((value) => (
                      <SegmentedControlItem key={value} value={value}>
                        <SegmentedControlItemText>{t(`common.${value}`)}</SegmentedControlItemText>
                      </SegmentedControlItem>
                    ))}
                  </SegmentedControl>
                </div>
              </SettingsCard>
            </SettingsSection>
          ),
        },
        language: {
          title: t('common.language'),
          content: (
            <SettingsSection>
              <SettingsCard>
                <div className="grid grid-cols-1 gap-1 p-2 sm:grid-cols-2">
                  {locales.map((entry) => (
                    <button
                      key={entry.code}
                      type="button"
                      lang={entry.code}
                      aria-pressed={entry.code === locale}
                      className="cursor-pointer rounded-lg px-3 py-3 text-start text-b3 text-foreground transition-colors hover:bg-muted aria-pressed:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
                      onClick={() => { onClose(); setLocale(entry.code) }}
                    >
                      {entry.nativeName}
                    </button>
                  ))}
                </div>
              </SettingsCard>
            </SettingsSection>
          ),
        },
      }}
    />
  )
}
