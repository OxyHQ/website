import PageShell from '../components/layout/PageShell'
import HelpPageContent from '../components/help/HelpPage'
import { useTranslation } from '../lib/i18n'

export default function HelpPage() {
  const { t } = useTranslation()
  return (
    <PageShell
      seo={{
        title: t('help.seoTitle'),
        description: t('help.seoDescription'),
        canonicalPath: '/help',
      }}
      mainClassName="flex-1"
    >
      <HelpPageContent />
    </PageShell>
  )
}
