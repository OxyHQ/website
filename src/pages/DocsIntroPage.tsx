import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import DocsIntroContent from '../components/docs/DocsIntroPage'

export default function DocsIntroPage() {
  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-primary-background">
      <Navbar />
      <main className="flex-1 bg-[#0f1117] text-gray-400">
        <DocsIntroContent />
      </main>
      <Footer />
    </div>
  )
}
