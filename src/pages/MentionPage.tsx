import Navbar from '../components/layout/Navbar'
import PageShell from '../components/layout/PageShell'
import MentionContent from '../components/mention/MentionContent'

export default function MentionPage() {
  return (
    <PageShell
      seo={{
        title: 'Mention - Your profile. Your content.',
        description:
          "Mention is Oxy's open social network. Posts, communities, feeds, photos, polls, streams, questions, videos and chat — every one of your posts displayed in an intelligent feed. Claim your unique link, the good ones are still free.",
        canonicalPath: '/mention',
      }}
      className="bg-[#88a6f0]"
      navbar={<Navbar transparent />}
      mainClassName="flex-1"
    >
      <MentionContent />
    </PageShell>
  )
}
