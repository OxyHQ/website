import PageShell from '../components/layout/PageShell'
import OxyOSContent from '../components/oxyos/OxyOSPage'

export default function OxyOSPage() {
  return (
    <PageShell
      seo={{
        title: 'OxyOS — Lightweight Desktop Linux',
        description:
          'OxyOS is a lightweight desktop Linux project. Still small, still fast. A minimal Openbox desktop with a ChromeOS-style shelf.',
        canonicalPath: '/os',
      }}
      className="oxyos-theme bg-background"
      mainClassName="flex-1"
    >
      <div className="cursor-theme">
        <OxyOSContent />
      </div>
    </PageShell>
  )
}
