import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import AIPageContent from '../components/ai/AIPageContent'

export default function AIPage() {
  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background text-foreground">
      <SEO
        title="Oxy AI — Understand Your World"
        description="Intelligent AI that understands your workflow, your data, and your goals. Chat, API, and developer tools built for everyone."
        canonicalPath="/ai"
      />
      <Navbar transparent />
      <main className="flex-1">
        <AIPageContent />
      </main>
      <Footer />
    </div>
  )
}
