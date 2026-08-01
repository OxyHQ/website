import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import PartnersHeroSection from '../components/sections/PartnersHeroSection'
import PartnerProgramsGrid from '../components/partners/PartnerProgramsGrid'
import PartnerEcosystemStrip from '../components/partners/PartnerEcosystemStrip'
import PartnerPillarsSection from '../components/partners/PartnerPillarsSection'
import BecomeAPartnerSection from '../components/partners/BecomeAPartnerSection'
import KeepUpToDateSection from '../components/sections/KeepUpToDateSection'

export default function PartnersPage() {
  return (
    <div className="flex min-h-screen max-w-screen flex-col justify-between overflow-x-clip bg-background">
      <SEO
        title="Partners"
        description="Build with Oxy: education, community and ecosystem programs, with fair revenue splits and no exclusivity traps."
        canonicalPath="/partners"
      />
      <Navbar />
      <main>
        <PartnersHeroSection />
        <PartnerProgramsGrid />
        <PartnerEcosystemStrip />
        <PartnerPillarsSection />
        <BecomeAPartnerSection />
        <KeepUpToDateSection />
      </main>
      <Footer />
    </div>
  )
}
