import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import CodeaContent from '../components/codea/CodeaPage'

export default function CodeaPage() {
  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-[#0a0a0b]">
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
