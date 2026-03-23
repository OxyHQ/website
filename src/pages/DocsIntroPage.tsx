import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import DocsIntroContent from '../components/docs/DocsIntroPage'

export default function DocsIntroPage() {
  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <Navbar />
      <main className="flex-1 bg-background text-muted-foreground">
        <DocsIntroContent />
      </main>
      <Footer />
    </div>
  )
}
