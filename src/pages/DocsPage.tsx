import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import DocsPageContent from '../components/docs/DocsPage'

export default function DocsPage() {
  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-[#0f1117]">
      <Navbar />
      <main className="flex-1">
        <div className="dark bg-[#0f1117]">
          <DocsPageContent />
        </div>
      </main>
      <Footer />
    </div>
  )
}
