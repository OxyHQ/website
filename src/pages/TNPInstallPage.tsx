import PageShell from '../components/layout/PageShell'
import TNPInstallContent from '../components/tnp/TNPInstallPage'

export default function TNPInstallPage() {
  return (
    <PageShell
      seo={{
        title: 'Install TNP',
        description:
          'Install TNP on macOS, Linux, or Windows. One command to resolve .ox, .app, and custom TNP domains natively on your device.',
        canonicalPath: '/tnp/install',
      }}
      className="tnp-theme bg-background"
      mainClassName="flex-1"
    >
      <TNPInstallContent />
    </PageShell>
  )
}
