import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import HelpPageContent from '../components/help/HelpPage'
import { useTranslation } from '../lib/i18n'

export default function HelpPage() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <SEO
        title={t('help.seoTitle')}
        description={t('help.seoDescription')}
        canonicalPath="/help"
      />
      <Navbar />
      <main className="flex-1">
        <HelpPageContent />
      </main>
      <Footer />
    </div>
  )
}
