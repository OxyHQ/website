import PageShell from '../components/layout/PageShell'
import OxyOSContent from '../components/oxyos/OxyOSPage'
import { APP_CARD_IMAGES } from '../data/appCardImages'

export default function OxyOSPage() {
  return (
    <PageShell
      seo={{
        title: 'Oxy OS',
        description:
          'An operating system designed around privacy and user freedom. No telemetry, no tracking, built on battle-tested open source.',
        canonicalPath: '/os',
        ogImage: APP_CARD_IMAGES['/os'],
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
