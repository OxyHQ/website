import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import DocsIntroContent from '../components/docs/DocsIntroPage'

export default function DocsIntroPage() {
  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <SEO
        title="Developer Documentation"
        description="Explore Oxy's developer documentation. API references, SDKs, integration guides, and everything you need to build with Oxy."
        canonicalPath="/developers/docs"
      />
      <Navbar />
      <main className="flex-1 bg-background text-muted-foreground">
        <DocsIntroContent />
      </main>
      <Footer />
    </div>
  )
}
