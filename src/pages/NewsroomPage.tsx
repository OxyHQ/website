import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import StructuredData from '../components/StructuredData'
import NewsroomBody from '../components/newsroom/NewsroomBody'
import { usePage } from '../api/hooks'
import { brandConfig } from '../lib/seo'

/* ──────────────────────────────────────────────────
 * /newsroom — full unscoped feed
 *
 * Renders the shared NewsroomBody with no category filter. See NewsroomBody
 * for the full structure (hero → grid → recent → carousels).
 * ────────────────────────────────────────────── */
export default function NewsroomPage() {
  const { data: pageData } = usePage('newsroom')
  // Host-aware so a page served on fairco.in never emits oxy.so JSON-LD.
  const { origin, siteName } = brandConfig(typeof window === 'undefined' ? undefined : window.location.hostname)
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
          url: `${origin}/newsroom`,
          isPartOf: { '@type': 'WebSite', name: siteName, url: origin },
          publisher: {
            '@type': 'Organization',
            name: siteName,
            url: origin,
            logo: { '@type': 'ImageObject', url: `${origin}/favicon.svg` },
          },
        }}
      />
      <Navbar />
      <NewsroomBody />
      <Footer />
    </div>
  )
}
