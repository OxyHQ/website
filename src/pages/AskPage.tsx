import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import StructuredData from '../components/StructuredData'
import HeroSection from '../components/sections/HeroSection'
import CapabilitiesSection from '../components/sections/CapabilitiesSection'
import UniversalContextSection from '../components/sections/UniversalContextSection'
import UseCasesSection from '../components/sections/UseCasesSection'
import PromptLibrarySection from '../components/sections/PromptLibrarySection'
import CTASection from '../components/sections/CTASection'

export default function AskPage() {
  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <SEO
        title="Oxy — The AI-Powered CRM for Go-To-Market Teams"
        description="Search, update, and create across your entire CRM just by asking. Oxy is the AI CRM with Universal Context that deeply understands your business."
        canonicalPath="/"
      />
      <StructuredData data={{
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Oxy',
        url: 'https://oxy.so',
        description: 'The AI-Powered CRM for Go-To-Market Teams',
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: 'https://oxy.so/?q={search_term_string}' },
          'query-input': 'required name=search_term_string',
        },
      }} />
      <StructuredData data={{
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Oxy',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        url: 'https://oxy.so',
        description: 'AI-Powered CRM for Go-To-Market Teams with Universal Context.',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          description: 'Free plan available',
        },
      }} />
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
