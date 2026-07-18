import Navbar from '../components/layout/Navbar'
import PageShell from '../components/layout/PageShell'
import HomiioContent from '../components/homiio/HomiioContent'

export default function HomiioPage() {
  return (
    <PageShell
      seo={{
        title: 'Homiio - Rental made easy',
        description:
          'Homiio makes renting fair: transparent listings, values-based roommate matching, an Oxy-powered trust score, and Sindi, your AI tenant-rights assistant. Affordable housing made accessible through open technology.',
        canonicalPath: '/homiio',
      }}
      className="bg-[#FFF7D8]"
      navbar={<Navbar transparent />}
      mainClassName="flex-1"
    >
      <HomiioContent />
    </PageShell>
  )
}
