import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import HelpSidebar from '../components/help/HelpSidebar'
import HelpMainContent from '../components/help/HelpMainContent'

export default function HelpPage() {
  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-primary-background">
      <Navbar />
      <main>
        <div className="container">
          <section className="grid w-full grid-cols-18">
            {/* Sidebar - takes ~3 columns on desktop */}
            <div className="col-span-3 max-lg:hidden">
              <HelpSidebar />
            </div>
            {/* Main content */}
            <HelpMainContent />
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
