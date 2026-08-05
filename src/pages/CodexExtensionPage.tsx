import Navbar from '../components/layout/Navbar'
import PageShell from '../components/layout/PageShell'
import Button from '../components/ui/Button'
import CodexExtensionContent from '../components/codea/CodexExtensionPage'

export default function CodexExtensionPage() {
  return (
    <PageShell
      seo={{
        title: 'Codea for VS Code',
        description:
          "Bring Codea's open-source assistant into the editor you already use: reviews, refactors and completions, free to inspect and extend.",
        canonicalPath: '/codea/extension',
      }}
      className="bg-background"
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
