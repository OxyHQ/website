import Navbar from '../components/layout/Navbar'
import PageShell from '../components/layout/PageShell'
import Button from '../components/ui/Button'
import CodexExtensionContent from '../components/codea/CodexExtensionPage'

export default function CodexExtensionPage() {
  return (
    <PageShell
      seo={{
        title: 'Codea VS Code Extension',
        description:
          'Bring Codea AI directly into VS Code. Intelligent completions, refactoring, and multi-agent coding inside your editor.',
        canonicalPath: '/codea/extension',
      }}
      className="bg-primary-background"
      navbar={
        <Navbar
          rightActions={
            <Button variant="primary" size="sm" href="/codea">
              Codea Studio
            </Button>
          }
        />
      }
      mainClassName="flex-1"
    >
      <CodexExtensionContent />
    </PageShell>
  )
}
