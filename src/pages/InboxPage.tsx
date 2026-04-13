import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import InboxPageContent from '../components/inbox/InboxPage'

export default function InboxPage() {
  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-primary-background">
      <Navbar />
      <main className="flex-1">
        <InboxPageContent />
      </main>
      <Footer />
    </div>
  )
}
