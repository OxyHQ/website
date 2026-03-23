import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import OxyOSContent from '../components/oxyos/OxyOSPage'

export default function OxyOSPage() {
  return (
    <div className="oxyos-theme flex min-h-screen max-w-screen flex-col overflow-x-clip bg-[#0b0f0a]">
      <SEO
        title="OxyOS — AI-Native Operating System"
        description="OxyOS is the AI-native operating system designed for the future of computing. A seamless, intelligent experience built from the ground up."
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
