import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import HeroSection from '../components/sections/HeroSection'
import TestimonialsSection from '../components/sections/TestimonialsSection'
import UniversalContextSection from '../components/sections/UniversalContextSection'
import CapabilitiesSection from '../components/sections/CapabilitiesSection'
import UseCasesSection from '../components/sections/UseCasesSection'
import PromptLibrarySection from '../components/sections/PromptLibrarySection'
import PrivacySection from '../components/sections/PrivacySection'
import IntegrationsSection from '../components/sections/IntegrationsSection'
import PricingSection from '../components/sections/PricingSection'
import CTASection from '../components/sections/CTASection'

export default function Landing2() {
  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-primary-background">
      <SEO
        title="Ask Oxy — AI-Powered CRM"
        description="Search, update, and create across your entire CRM just by asking. Powered by Universal Context, a unified intelligence layer native to Oxy."
        canonicalPath="/landing2"
        noIndex
      />
      <Navbar />
      <main>
        <HeroSection />
        <TestimonialsSection />
        <UniversalContextSection />
        <CapabilitiesSection />
        <UseCasesSection />
        <PromptLibrarySection />
        <PrivacySection />
        <IntegrationsSection />
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
