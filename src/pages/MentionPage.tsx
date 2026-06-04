import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import MentionContent from '../components/mention/MentionContent'

export default function MentionPage() {
  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-[#88a6f0]">
      <SEO
        title="Mention - Your profile. Your content."
        description="Mention is Oxy's open social network. Posts, communities, feeds, photos, polls, streams, questions, videos and chat — every one of your posts displayed in an intelligent feed. Claim your unique link, the good ones are still free."
        canonicalPath="/mention"
      />
      <Navbar transparent />
      <main className="flex-1">
        <MentionContent />
      </main>
      <Footer />
    </div>
  )
}
