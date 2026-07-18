import Navbar from '../components/layout/Navbar'
import PageShell from '../components/layout/PageShell'
import AIPageContent from '../components/ai/AIPageContent'

export default function AIPage() {
  return (
    <PageShell
      seo={{
        title: 'Oxy AI — Understand Your World',
        description:
          'Intelligent AI that understands your workflow, your data, and your goals. Chat, API, and developer tools built for everyone.',
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
