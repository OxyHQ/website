import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import SettingsAppearance from '../components/settings/SettingsAppearance'

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <SEO
        title="Settings"
        description="Customize your Oxy experience."
        canonicalPath="/settings"
        noIndex
      />
      <Navbar />
      <main className="flex-1">
        <SettingsAppearance />
      </main>
      <Footer />
    </div>
  )
}
