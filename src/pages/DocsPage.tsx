import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import DocsPageContent from '../components/docs/DocsPage'

export default function DocsPage() {
  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-primary-background">
      <Navbar />
      <main className="flex-1 bg-[#0f1117] text-gray-400">
        <DocsPageContent />
      </main>
      <Footer />
    </div>
  )
}
