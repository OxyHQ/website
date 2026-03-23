import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import ChangelogContent from '../components/changelog/ChangelogPage'

export default function ChangelogPage() {
  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-primary-background">
      <Navbar />
      <main>
        <ChangelogContent />
      </main>
      <Footer />
    </div>
  )
}
