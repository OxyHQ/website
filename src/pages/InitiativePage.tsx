import InitiativeContent from '../components/initiative/InitiativeContent'
import PageShell from '../components/layout/PageShell'

export default function InitiativePage() {
  return (
    <PageShell
      seo={{
        title: 'The Oxy Initiative',
        description:
          'Oxy Initiative is dedicated to turning visionary ideas into reality. Community support, organic farming, clean water, and environmental preservation.',
        canonicalPath: '/initiative',
      }}
      className="slice-theme bg-background"
      mainClassName="flex-1 pb-20 lg:pb-32"
    >
      <InitiativeContent />
    </PageShell>
  )
}
