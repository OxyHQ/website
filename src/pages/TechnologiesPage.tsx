import PageShell from '../components/layout/PageShell'
import TechnologiesContent from '../components/technologies/TechnologiesContent'

export default function TechnologiesPage() {
  return (
    <PageShell
      seo={{
        title: 'Technologies',
        description:
          'The ecosystem map: every Oxy app and service, and how they share one identity, one design system and one platform underneath.',
        canonicalPath: '/technologies',
      }}
      className="slice-theme bg-background"
      mainClassName="flex-1"
    >
      <TechnologiesContent />
    </PageShell>
  )
}
