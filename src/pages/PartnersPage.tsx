import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import PartnersHeroSection from '../components/sections/PartnersHeroSection'
import PartnerProgramsGrid from '../components/partners/PartnerProgramsGrid'
import PartnerPillarsSection from '../components/partners/PartnerPillarsSection'
import BecomeAPartnerSection from '../components/partners/BecomeAPartnerSection'
import PartnerFaqSection from '../components/partners/PartnerFaqSection'
import KeepUpToDateSection from '../components/sections/KeepUpToDateSection'

export default function PartnersPage() {
  return (
    <div className="partners-theme flex min-h-screen max-w-screen flex-col justify-between overflow-x-clip bg-background text-foreground">
      <SEO
        title="Partners"
        description="Build with Oxy: education, community and ecosystem programs, with fair revenue splits and no exclusivity traps."
        canonicalPath="/partners"
      />
      <Navbar />
      <main className="overflow-hidden">
        <PartnersHeroSection />
        <PartnerProgramsGrid />
        <PartnerPillarsSection />
        <BecomeAPartnerSection />
        <KeepUpToDateSection compact />
        <PartnerFaqSection />
      </main>
      <Footer />
    </div>
  )
}
