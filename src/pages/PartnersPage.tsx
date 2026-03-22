import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import PartnersHeroSection from '../components/sections/PartnersHeroSection'
import PartnerProgramsSection from '../components/sections/PartnerProgramsSection'
import PartnerTestimonialsSection from '../components/sections/PartnerTestimonialsSection'
import KeepUpToDateSection from '../components/sections/KeepUpToDateSection'
import { HorizontalLine } from '../components/ui/GridDecoration'

export default function PartnersPage() {
  return (
    <div className="flex min-h-screen max-w-screen flex-col justify-between overflow-x-clip">
      <Navbar />
      <main>
        <PartnersHeroSection />
        <div className="contents">
          <HorizontalLine className="w-full text-subtle-stroke" />
        </div>
        <PartnerProgramsSection />
        <PartnerTestimonialsSection />
        <div className="contents">
          <HorizontalLine className="w-full text-subtle-stroke" />
        </div>
        <KeepUpToDateSection />
      </main>
      <Footer />
    </div>
  )
}
