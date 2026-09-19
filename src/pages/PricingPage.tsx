import { useState } from 'react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import StructuredData from '../components/StructuredData'
import PricingHeroSection from '../components/pricing/PricingHeroSection'
import PricingStickyTable from '../components/pricing/PricingStickyTable'
import PricingCompareSection from '../components/pricing/PricingCompareSection'
import PricingFaqSection from '../components/pricing/PricingFaqSection'
import PricingPathsSection from '../components/pricing/PricingPathsSection'
import { useTranslation } from '../lib/i18n'

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true)
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <SEO
        title={t('pricing.seoTitle')}
        description={t('pricing.seoDescription')}
        canonicalPath="/pricing"
      />
      {/*
        Only the free tier carries an `Offer`.

        Plus, Pro and Enterprise used to be emitted as `price: '0'` with a
        description telling the reader to look at the page. Search engines do not
        read the description: they read the price, and `0` on a paid plan says
        the plan is free. A paid tier whose price this component does not know is
        better described by no offer node at all than by a wrong one.
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
        <PricingHeroSection isAnnual={isAnnual} onToggle={setIsAnnual} />
        <PricingStickyTable isAnnual={isAnnual} onToggle={setIsAnnual} />
        <PricingCompareSection />
        <PricingFaqSection />
        <PricingPathsSection />
      </main>
      <Footer />
    </div>
  )
}
