import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import TNPContent from '../components/tnp/TNPPage'

export default function TNPPage() {
  return (
    <div className="tnp-theme flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <SEO
        title="TNP - The Network Protocol"
        description="Your internet. Your rules. TNP is an alternative internet namespace by Oxy. Register domains on .ox, .app, .com and more. DNS-only, works system-wide."
        canonicalPath="/tnp"
      />
      <Navbar />
      <main className="flex-1">
        <TNPContent />
      </main>
      <Footer />
    </div>
  )
}
