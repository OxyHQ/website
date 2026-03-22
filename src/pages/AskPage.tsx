import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import HeroSection from '../components/sections/HeroSection'
import CapabilitiesSection from '../components/sections/CapabilitiesSection'
import UniversalContextSection from '../components/sections/UniversalContextSection'
import UseCasesSection from '../components/sections/UseCasesSection'
import PromptLibrarySection from '../components/sections/PromptLibrarySection'
import CTASection from '../components/sections/CTASection'

export default function AskPage() {
  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-primary-background">
      <Navbar />
      <main>
        <HeroSection />
        <CapabilitiesSection />
        <UniversalContextSection />
        <UseCasesSection />
        <PromptLibrarySection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
