import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import StructuredData from '../components/StructuredData'
import PricingHeroSection from '../components/pricing/PricingHeroSection'
import PricingFaqSection from '../components/pricing/PricingFaqSection'
import PricingPathsSection from '../components/pricing/PricingPathsSection'
import { useTranslation } from '../lib/i18n'

export default function PricingPage() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <SEO
        title={t('pricing.seoTitle')}
        description={t('pricing.seoDescription')}
        canonicalPath="/pricing"
      />
      {/*
        Only the free tier carries an `Offer`. The paid plans come from the
        billing API at runtime, so the prerendered document does not know their
        prices — and a paid tier with no offer node beats one with a wrong price.
      */}
      <StructuredData data={{
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Oxy',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        offers: [{ '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'USD' }],
      }} />
      <Navbar />
      <main>
        <PricingHeroSection />
        <PricingFaqSection />
        <PricingPathsSection />
      </main>
      <Footer />
    </div>
  )
}
