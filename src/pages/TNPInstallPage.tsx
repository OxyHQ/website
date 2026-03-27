import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import TNPInstallContent from '../components/tnp/TNPInstallPage'

export default function TNPInstallPage() {
  return (
    <div className="tnp-theme flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <SEO
        title="Install TNP"
        description="Install TNP on macOS, Linux, or Windows. One command to resolve .ox, .app, and custom TNP domains natively on your device."
        canonicalPath="/tnp/install"
      />
      <Navbar />
      <main className="flex-1">
        <TNPInstallContent />
      </main>
      <Footer />
    </div>
  )
}
