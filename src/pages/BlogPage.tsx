import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import StructuredData from '../components/StructuredData'
import NewsroomBody from '../components/newsroom/NewsroomBody'

/* ──────────────────────────────────────────────────
 * /company/news — newsroom layout scoped to Company-category posts.
 *
 * Reuses NewsroomBody with `category="Company"` so the hero, article grid,
 * and recent-news rail all render Company posts only. The themed carousels
 * (Stories / Research / Engineering) are skipped on this scoped variant.
 * ────────────────────────────────────────────── */
export default function BlogPage() {
  const title = 'Company news'
  const description = 'Updates, product announcements, and stories from the Oxy team.'

  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <SEO
        title={title}
        description={description}
        canonicalPath="/company/news"
      />
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: title,
          description,
          url: 'https://oxy.so/company/news',
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
      <NewsroomBody
        category="Company"
        heroTitle={title}
        recentNewsHref="/company/news"
      />
      <Footer />
    </div>
  )
}
