import Navbar from '../components/layout/Navbar'
import PageShell from '../components/layout/PageShell'
import HomiioContent from '../components/homiio/HomiioContent'

export default function HomiioPage() {
  return (
    <PageShell
      seo={{
        title: 'Homiio, renting made transparent',
        description:
          'Transparent listings, values-based matching, an Oxy-powered trust signal and an assistant that knows tenant rights.',
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
