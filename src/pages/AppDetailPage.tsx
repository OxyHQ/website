import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import AppDetailContent from '../components/apps/AppDetailContent'

/**
 * No `PageShell` here: the SEO for this route depends on the app being shown,
 * so `AppDetailContent` renders its own `<SEO>` once the record has loaded.
 */
export default function AppDetailPage() {
  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <Navbar />
      <main className="flex-1">
        <AppDetailContent />
      </main>
      <Footer />
    </div>
  )
}
