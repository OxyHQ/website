import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import HomeHeroSection from '../components/homepage/HomeHeroSection'
import HomeBentoSection from '../components/homepage/HomeBentoSection'
import HomeTrialCTA from '../components/homepage/HomeTrialCTA'
import HomeAdaptiveSection from '../components/homepage/HomeAdaptiveSection'
import HomeEnrichmentSection from '../components/homepage/HomeEnrichmentSection'
import HomeScaleSection from '../components/homepage/HomeScaleSection'
import HomeFinalCTA from '../components/homepage/HomeFinalCTA'

export default function Landing2() {
  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-primary-background">
      <Navbar />
      <main className="bg-primary-background">
        <HomeHeroSection />
        <HomeBentoSection />
        <HomeTrialCTA />
        <HomeAdaptiveSection />
        <HomeEnrichmentSection />
        <HomeScaleSection />
        <HomeFinalCTA />
      </main>
      <Footer />
    </div>
  )
}
