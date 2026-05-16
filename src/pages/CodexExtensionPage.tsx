import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import Button from '../components/ui/Button'
import CodexExtensionContent from '../components/codea/CodexExtensionPage'

export default function CodexExtensionPage() {
  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-primary-background">
      <SEO
        title="Codea VS Code Extension"
        description="Bring Codea AI directly into VS Code. Intelligent completions, refactoring, and multi-agent coding inside your editor."
        canonicalPath="/codea/extension"
      />
      <Navbar
        rightActions={
          <Button variant="primary" size="sm" href="/codea">
            Codea Studio
          </Button>
        }
      />
      <main className="flex-1">
        <CodexExtensionContent />
      </main>
      <Footer />
    </div>
  )
}
