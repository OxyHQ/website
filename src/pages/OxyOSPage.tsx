import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import OxyOSContent from '../components/oxyos/OxyOSPage'

export default function OxyOSPage() {
  return (
    <div className="oxyos-theme flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <SEO
        title="OxyOS — Lightweight Desktop Linux"
        description="OxyOS is a lightweight desktop Linux project. Still small, still fast. A minimal Openbox desktop with a ChromeOS-style shelf."
        canonicalPath="/os"
      />
      <Navbar />
      <main className="flex-1">
        <div className="cursor-theme">
          <OxyOSContent />
        </div>
      </main>
      <Footer />
    </div>
  )
}
