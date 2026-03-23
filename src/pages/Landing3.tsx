import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import HomeHeroSection from '../components/homepage/HomeHeroSection'
import HomeBentoSection from '../components/homepage/HomeBentoSection'
import HomeTrialCTA from '../components/homepage/HomeTrialCTA'
import HomeAdaptiveSection from '../components/homepage/HomeAdaptiveSection'
import HomeEnrichmentSection from '../components/homepage/HomeEnrichmentSection'
import HomeScaleSection from '../components/homepage/HomeScaleSection'
import HomeFinalCTA from '../components/homepage/HomeFinalCTA'

export default function Landing3() {
  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <SEO
        title="Oxy — Customer Relationship Magic"
        description="Oxy is the AI CRM for GTM. Automate everything, deploy AI, connect any data, and get powerful reporting — all in one platform."
        canonicalPath="/landing3"
        noIndex
      />
      <Navbar />
      <main className="bg-background">
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
