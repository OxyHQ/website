import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import PricingHeroSection from '../components/pricing/PricingHeroSection'
import PricingStickyTable from '../components/pricing/PricingStickyTable'
import PricingCompareSection from '../components/pricing/PricingCompareSection'
import PricingFaqSection from '../components/pricing/PricingFaqSection'

export default function PricingPage() {
  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-primary-background">
      <SEO
        title="Pricing"
        description="Start free, scale as you grow. Oxy offers Free, Plus, Pro, and Enterprise plans for teams of every size. Plans start at $29/seat/month billed annually."
        canonicalPath="/pricing"
      />
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
