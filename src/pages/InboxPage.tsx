import PageShell from '../components/layout/PageShell'
import InboxPageContent from '../components/inbox/InboxPage'
import { APP_CARD_IMAGES } from '../data/appCardImages'

export default function InboxPage() {
  return (
    <PageShell
      seo={{
        title: 'Inbox, email with room to think',
        description:
          'Inbox by Oxy. Read, organise and reply to your email in a familiar, open-source client.',
        canonicalPath: '/inbox',
        ogImage: APP_CARD_IMAGES['/inbox'],
      }}
      className="bg-background"
      mainClassName="flex-1"
    >
      <InboxPageContent />
    </PageShell>
  )
}
