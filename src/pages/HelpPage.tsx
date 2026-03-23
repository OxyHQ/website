import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import HelpPageContent from '../components/help/HelpPage'

export default function HelpPage() {
  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <SEO
        title="Help Center"
        description="Get help with Oxy. Find answers to common questions, troubleshooting guides, and contact our support team."
        canonicalPath="/help"
      />
      <Navbar />
      <main className="flex-1">
        <HelpPageContent />
      </main>
      <Footer />
    </div>
  )
}
