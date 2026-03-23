import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import StructuredData from '../components/StructuredData'
import PricingHeroSection from '../components/pricing/PricingHeroSection'
import PricingStickyTable from '../components/pricing/PricingStickyTable'
import PricingCompareSection from '../components/pricing/PricingCompareSection'
import PricingFaqSection from '../components/pricing/PricingFaqSection'

export default function PricingPage() {
  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <SEO
        title="Pricing"
        description="Start free, scale as you grow. Oxy offers Free, Plus, Pro, and Enterprise plans for teams of every size. Plans start at $29/seat/month billed annually."
        canonicalPath="/pricing"
      />
      <StructuredData data={{
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Oxy CRM',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        offers: [
          { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'USD' },
          { '@type': 'Offer', name: 'Plus', price: '29', priceCurrency: 'USD', billingIncrement: 'P1M' },
          { '@type': 'Offer', name: 'Pro', price: '79', priceCurrency: 'USD', billingIncrement: 'P1M' },
          { '@type': 'Offer', name: 'Enterprise', price: '0', priceCurrency: 'USD', description: 'Custom pricing' },
        ],
      }} />
      <Navbar />
      <main>
        <PricingHeroSection />
        <PricingStickyTable />
        <PricingCompareSection />
        <PricingFaqSection />
      </main>
      <Footer />
    </div>
  )
}
