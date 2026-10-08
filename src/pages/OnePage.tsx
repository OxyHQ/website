import PageShell from '../components/layout/PageShell'
import OnePlansSection from '../components/pricing/OnePlansSection'
import { useTranslation } from '../lib/i18n'

export default function OnePage() {
  const { t } = useTranslation()
  return (
    <PageShell seo={{ title: t('one.title'), description: t('one.lead'), canonicalPath: '/one' }}>
      <OnePlansSection headingLevel="h1" />
    </PageShell>
  )
}
