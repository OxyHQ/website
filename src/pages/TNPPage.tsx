import PageShell from '../components/layout/PageShell'
import TNPContent from '../components/tnp/TNPPage'

export default function TNPPage() {
  return (
    <PageShell
      seo={{
        title: 'TNP, The Name Project',
        description:
          'Register names on .ox, .app, .com and more. DNS-only, system-wide, and fully under your control.',
        canonicalPath: '/tnp',
      }}
      className="tnp-theme bg-background"
      mainClassName="flex-1"
    >
      <TNPContent />
    </PageShell>
  )
}
