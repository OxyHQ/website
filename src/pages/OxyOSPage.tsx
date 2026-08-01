import PageShell from '../components/layout/PageShell'
import OxyOSContent from '../components/oxyos/OxyOSPage'

export default function OxyOSPage() {
  return (
    <PageShell
      seo={{
        title: 'Oxy OS',
        description:
          'An operating system designed around privacy and user freedom. No telemetry, no tracking, built on battle-tested open source.',
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
