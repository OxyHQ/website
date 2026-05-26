import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import StructuredData from '../components/StructuredData'
import NewsroomBody from '../components/newsroom/NewsroomBody'
import { usePage } from '../api/hooks'

/* ──────────────────────────────────────────────────
 * /newsroom — full unscoped feed
 *
 * Renders the shared NewsroomBody with no category filter. See NewsroomBody
 * for the full structure (hero → grid → recent → carousels).
 * ────────────────────────────────────────────── */
export default function NewsroomPage() {
  const { data: pageData } = usePage('newsroom')
  const title = pageData?.title ?? 'Newsroom'
  const description = pageData?.description ?? 'The latest news, product announcements, research, and stories from Oxy — an open-source ecosystem of AI agents and apps.'

  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <SEO
        title={title}
        description={description}
        canonicalPath="/newsroom"
      />
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: title,
          description,
          url: 'https://oxy.so/newsroom',
          isPartOf: { '@type': 'WebSite', name: 'Oxy', url: 'https://oxy.so' },
          publisher: {
            '@type': 'Organization',
            name: 'Oxy',
            url: 'https://oxy.so',
            logo: { '@type': 'ImageObject', url: 'https://oxy.so/favicon.svg' },
          },
        }}
      />
      <Navbar />
      <NewsroomBody />
      <Footer />
    </div>
  )
}
