import InitiativeContent from '../components/initiative/InitiativeContent'
import PageShell from '../components/layout/PageShell'

export default function InitiativePage() {
  return (
    <PageShell
      seo={{
        title: 'The Oxy Initiative',
        description:
          'The community work Oxy funds and supports: open source, digital rights, education and the people building alternatives.',
        canonicalPath: '/initiative',
      }}
      className="slice-theme bg-background"
      mainClassName="flex-1 pb-20 lg:pb-32"
    >
      <InitiativeContent />
    </PageShell>
  )
}
