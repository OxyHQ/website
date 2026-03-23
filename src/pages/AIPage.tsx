import Navbar from '../components/layout/Navbar'
import AIPageContent from '../components/ai/AIPage'

export default function AIPage() {
  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-primary-background">
      <Navbar />
      <main className="flex-1">
        <AIPageContent />
      </main>
    </div>
  )
}
