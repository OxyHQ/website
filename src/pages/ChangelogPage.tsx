import PageShell from '../components/layout/PageShell'
import ChangelogContent from '../components/changelog/ChangelogPage'

export default function ChangelogPage() {
  return (
    <PageShell
      seo={{
        title: 'Changelog',
        description:
          "See what's new in Oxy. Latest releases, improvements, and bug fixes across all Oxy products.",
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
