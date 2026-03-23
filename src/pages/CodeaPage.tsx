import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import CodeaContent from '../components/codea/CodeaPage'

export default function CodeaPage() {
  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-[#0a0a0b]">
      <SEO
        title="Codea — AI Code Editor"
        description="Codea is an AI-native code editor that understands your entire codebase. Write, refactor, and debug faster with intelligent AI assistance."
        canonicalPath="/codea"
      />
      <Navbar />
      <main className="flex-1">
        <div className="cursor-theme">
          <CodeaContent />
        </div>
      </main>
      <Footer />
    </div>
  )
}
