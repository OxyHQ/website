import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import CodexExtensionContent from '../components/codea/CodexExtensionPage'

export default function CodexExtensionPage() {
  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-primary-background">
      <Navbar />
      <main className="flex-1">
        <CodexExtensionContent />
      </main>
      <Footer />
    </div>
  )
}
