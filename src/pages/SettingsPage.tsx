import PageShell from '../components/layout/PageShell'
import SettingsAppearance from '../components/settings/SettingsAppearance'

export default function SettingsPage() {
  return (
    <PageShell
      seo={{
        title: 'Settings',
        description: 'Customize your Oxy experience.',
        canonicalPath: '/settings',
        noIndex: true,
      }}
      mainClassName="flex-1"
    >
      <SettingsAppearance />
    </PageShell>
  )
}
