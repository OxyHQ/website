import { useState } from 'react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import StructuredData from '../components/StructuredData'
import PricingHeroSection from '../components/pricing/PricingHeroSection'
import PricingStickyTable from '../components/pricing/PricingStickyTable'
import PricingCompareSection from '../components/pricing/PricingCompareSection'
import PricingFaqSection from '../components/pricing/PricingFaqSection'
import { useTranslation } from '../lib/i18n'

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true)
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-primary-background">
      <SEO
        title={t('pricing.seoTitle')}
        description={t('pricing.seoDescription')}
        canonicalPath="/pricing"
      />
      <StructuredData data={{
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Oxy',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        offers: [
          { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'USD' },
          { '@type': 'Offer', name: 'Plus', price: '0', priceCurrency: 'USD', description: 'See current pricing on the page' },
          { '@type': 'Offer', name: 'Pro', price: '0', priceCurrency: 'USD', description: 'See current pricing on the page' },
          { '@type': 'Offer', name: 'Enterprise', price: '0', priceCurrency: 'USD', description: 'Custom pricing' },
        ],
      }} />
      <Navbar />
      <main>
        <PricingHeroSection isAnnual={isAnnual} onToggle={setIsAnnual} />
        <PricingStickyTable isAnnual={isAnnual} onToggle={setIsAnnual} />
        <PricingCompareSection />
        <PricingFaqSection />
      </main>
      <Footer />
    </div>
  )
}
