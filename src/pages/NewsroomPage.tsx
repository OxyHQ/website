import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import StructuredData from '../components/StructuredData'
import NewsroomIndex from '../components/newsroom/NewsroomIndex'
import { useNewsroomPosts, usePage } from '../api/hooks'
import { brandConfig } from '../lib/seo'
import { buildNewsroomCollectionStructuredData } from '../lib/newsroomSeo'

/* ──────────────────────────────────────────────────
 * /newsroom — full unscoped feed
 *
 * Renders the newsroom index over the real CMS feed. Article detail pages keep
 * their own route and reuse the same post records.
 * ────────────────────────────────────────────── */
export default function NewsroomPage() {
  const { data: pageData } = usePage('newsroom')
  // Uses the exact query key consumed by `NewsroomIndex`, so React Query
  // deduplicates the request while letting the page describe real articles.
  const { data: newsroomData } = useNewsroomPosts({ limit: 50 })
  // Host-aware so a page served on fairco.in never emits oxy.so JSON-LD.
  const { origin, siteName } = brandConfig(typeof window === 'undefined' ? undefined : window.location.hostname)
  const title = pageData?.title ?? 'Newsroom'
  const description = pageData?.description ?? 'Announcements, product updates and engineering posts from across the Oxy ecosystem.'

  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <SEO
        title={title}
        description={description}
        canonicalPath="/newsroom"
      />
      <StructuredData
        data={buildNewsroomCollectionStructuredData(
          newsroomData?.posts ?? [],
          { origin, siteName, ogImage: `${origin}/og-default.png` },
          title,
          description,
        )}
      />
      <Navbar />
      <NewsroomIndex />
      <Footer />
    </div>
  )
}
