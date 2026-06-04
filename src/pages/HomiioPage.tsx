import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import HomiioContent from '../components/homiio/HomiioContent'

export default function HomiioPage() {
  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-[#FFF7D8]">
      <SEO
        title="Homiio - Rental made easy"
        description="Homiio makes renting fair: transparent listings, values-based roommate matching, an Oxy-powered trust score, and Sindi, your AI tenant-rights assistant. Affordable housing made accessible through open technology."
        canonicalPath="/homiio"
      />
      <Navbar transparent />
      <main className="flex-1">
        <HomiioContent />
      </main>
      <Footer />
    </div>
  )
}
