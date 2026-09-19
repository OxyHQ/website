import PageShell from '../components/layout/PageShell'
import AppsContent from '../components/apps/AppsContent'

export default function AppsPage() {
  return (
    <PageShell
      seo={{
        title: 'Apps',
        description:
          'Every app in the Oxy ecosystem: social, messaging, AI, housing, payments and more, all on one account you own.',
        canonicalPath: '/apps',
      }}
      className="bg-background"
      mainClassName="flex-1"
    >
      <AppsContent />
    </PageShell>
  )
}
