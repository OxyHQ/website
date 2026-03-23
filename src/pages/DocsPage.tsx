import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import DocsPageContent from '../components/docs/DocsPage'

export default function DocsPage() {
  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <Navbar />
      <main className="flex-1 bg-background text-muted-foreground">
        <DocsPageContent />
      </main>
      <Footer />
    </div>
  )
}
