import PageShell from '../components/layout/PageShell'
import ChangelogContent from '../components/changelog/ChangelogPage'

export default function ChangelogPage() {
  return (
    <PageShell
      seo={{
        title: 'Changelog',
        description: 'Every notable change across the Oxy ecosystem, including the ones that remove something.',
        canonicalPath: '/changelog',
      }}
      // Deliberately no `mainClassName`: this page's `<main>` has never carried
      // `flex-1`. Adding it would push the footer to the viewport bottom on
      // short changelogs, which is a layout change, not a normalization.
    >
      <ChangelogContent />
    </PageShell>
  )
}
