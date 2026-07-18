import PageShell from '../components/layout/PageShell'
import InboxPageContent from '../components/inbox/InboxPage'

export default function InboxPage() {
  return (
    <PageShell
      seo={{
        title: 'Inbox, end-to-end encrypted email',
        description:
          'A modern, end-to-end encrypted inbox built on Oxy ID. Your keys, your data, no scanning.',
        canonicalPath: '/inbox',
      }}
      className="bg-primary-background"
      mainClassName="flex-1"
    >
      <InboxPageContent />
    </PageShell>
  )
}
