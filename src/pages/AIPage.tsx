import Navbar from '../components/layout/Navbar'
import PageShell from '../components/layout/PageShell'
import AIPageContent from '../components/ai/AIPageContent'

export default function AIPage() {
  return (
    <PageShell
      seo={{
        title: 'Oxy AI',
        description:
          'Private AI for people and developers: open models you can inspect, fine-tune and self-host, with conversations that never train anyone else.',
        canonicalPath: '/ai',
      }}
      className="bg-background text-foreground"
      navbar={<Navbar transparent />}
      mainClassName="flex-1"
    >
      <AIPageContent />
    </PageShell>
  )
}
