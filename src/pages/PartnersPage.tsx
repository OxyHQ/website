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
        description="Join the Oxy partner ecosystem. Programs for developers, communities, and educators to build, integrate, and grow on the open-source Oxy stack."
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
