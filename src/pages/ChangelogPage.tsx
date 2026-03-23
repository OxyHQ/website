import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import ChangelogContent from '../components/changelog/ChangelogPage'

export default function ChangelogPage() {
  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <SEO
        title="Changelog"
        description="See what's new in Oxy. Latest releases, improvements, and bug fixes across all Oxy products."
        canonicalPath="/changelog"
      />
      <Navbar />
      <main>
        <ChangelogContent />
      </main>
      <Footer />
    </div>
  )
}
