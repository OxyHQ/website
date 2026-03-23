import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SettingsAppearance from '../components/settings/SettingsAppearance'

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <Navbar />
      <main className="flex-1">
        <SettingsAppearance />
      </main>
      <Footer />
    </div>
  )
}
