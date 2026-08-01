import PageShell from '../components/layout/PageShell'
import TechnologiesContent from '../components/technologies/TechnologiesContent'

export default function TechnologiesPage() {
  return (
    <PageShell
      seo={{
        title: 'Technologies',
        description:
          'Every product in the Oxy ecosystem. Open-source, privacy-first software for messaging, intelligence, identity and beyond.',
        canonicalPath: '/technologies',
      }}
      className="slice-theme bg-background"
      mainClassName="flex-1"
    >
      <TechnologiesContent />
    </PageShell>
  )
}
