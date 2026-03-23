import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import DocsPageContent from '../components/docs/DocsPage'

export default function DocsPage() {
  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <SEO
        title="API Overview"
        description="Oxy API overview — authentication, endpoints, rate limits, and getting started with the Oxy developer platform."
        canonicalPath="/developers/docs/overview"
      />
      <Navbar />
      <main className="flex-1 bg-background text-muted-foreground">
        <DocsPageContent />
      </main>
      <Footer />
    </div>
  )
}
