import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import PricingHeroSection from '../components/pricing/PricingHeroSection'
import PricingStickyTable from '../components/pricing/PricingStickyTable'
import PricingCompareSection from '../components/pricing/PricingCompareSection'
import PricingFaqSection from '../components/pricing/PricingFaqSection'

export default function PricingPage() {
  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-primary-background">
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
