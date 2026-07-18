import PageShell from '../components/layout/PageShell'
import DocsIntroContent from '../components/docs/DocsIntroPage'

export default function DocsIntroPage() {
  return (
    <PageShell
      seo={{
        title: 'Developer Documentation',
        description:
          "Explore Oxy's developer documentation. API references, SDKs, integration guides, and everything you need to build with Oxy.",
        canonicalPath: '/developers/docs',
      }}
      mainClassName="flex-1 bg-background text-muted-foreground"
    >
      <DocsIntroContent />
    </PageShell>
  )
}
