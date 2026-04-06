import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import { ManifestoSection } from '../components/initiative/ManifestoSection'
import IntroSection from '../components/initiative/IntroSection'
import PillarsSection from '../components/initiative/PillarsSection'
import EngagementSection from '../components/initiative/EngagementSection'
import ClosingSection from '../components/initiative/ClosingSection'
import { HorizontalLine } from '../components/ui/GridDecoration'
import { imagePaths } from '../data/initiative'

export default function InitiativePage() {
  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip">
      <SEO
        title="The Oxy Initiative"
        description="Oxy Initiative is dedicated to turning visionary ideas into reality. Community support, organic farming, clean water, and environmental preservation."
        canonicalPath="/initiative"
      />
      <div className="absolute inset-x-0 top-0 z-50">
        <Navbar transparent />
      </div>
      <main>
        <ManifestoSection imagePaths={imagePaths} />
        <div className="bg-background">
          <IntroSection />
          <div className="contents">
            <HorizontalLine className="w-full text-border" />
          </div>
          <PillarsSection />
          <div className="contents">
            <HorizontalLine className="w-full text-border" />
          </div>
          <EngagementSection />
        </div>
        <ClosingSection />
      </main>
      <Footer />
    </div>
  )
}
