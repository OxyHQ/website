import PageShell from '../components/layout/PageShell'
import TNPContent from '../components/tnp/TNPPage'

export default function TNPPage() {
  return (
    <PageShell
      seo={{
        title: 'TNP - The Network Protocol',
        description:
          'Your internet. Your rules. TNP is an alternative internet namespace by Oxy. Register domains on .ox, .app, .com and more. DNS-only, works system-wide.',
        canonicalPath: '/tnp',
      }}
      className="tnp-theme bg-background"
      mainClassName="flex-1"
    >
      <TNPContent />
    </PageShell>
  )
}
