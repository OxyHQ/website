import { useMemo } from 'react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import StructuredData from '../components/StructuredData'
import NewsroomHeroSection from '../components/newsroom/NewsroomHeroSection'
import ArticleGridSection from '../components/newsroom/ArticleGridSection'
import RecentNewsSection from '../components/newsroom/RecentNewsSection'
import CarouselSection from '../components/newsroom/CarouselSection'
import { useNewsroomPosts, usePage, type PageSection } from '../api/hooks'

/* ── Helpers to extract translated strings from the page CMS entry ── */

interface NewsroomUI {
  viewAll: string
  filter: string
  newest: string
  oldest: string
  loadMore: string
  clearAll: string
  noResults: string
  clearFilters: string
}

const DEFAULT_UI: NewsroomUI = {
  viewAll: 'View all',
  filter: 'Filter',
  newest: 'Newest',
  oldest: 'Oldest',
  loadMore: 'Load more',
  clearAll: 'Clear all',
  noResults: 'No articles match your filters',
  clearFilters: 'Clear filters',
}

function sectionHeading(sections: PageSection[], type: string, fallback: string): string {
  return sections.find(s => s.type === type)?.heading || fallback
}

function sectionSubheading(sections: PageSection[], type: string, fallback: string): string {
  return sections.find(s => s.type === type)?.subheading || fallback
}

function parseUI(sections: PageSection[]): NewsroomUI {
  const uiSection = sections.find(s => s.type === 'ui')
  if (!uiSection?.items?.length) return DEFAULT_UI
  const map = new Map(uiSection.items.map(i => [i.key, i.value]))
  return {
    viewAll: map.get('viewAll') ?? DEFAULT_UI.viewAll,
    filter: map.get('filter') ?? DEFAULT_UI.filter,
    newest: map.get('newest') ?? DEFAULT_UI.newest,
    oldest: map.get('oldest') ?? DEFAULT_UI.oldest,
    loadMore: map.get('loadMore') ?? DEFAULT_UI.loadMore,
    clearAll: map.get('clearAll') ?? DEFAULT_UI.clearAll,
    noResults: map.get('noResults') ?? DEFAULT_UI.noResults,
    clearFilters: map.get('clearFilters') ?? DEFAULT_UI.clearFilters,
  }
}

/* ──────────────────────────────────────────────────
 * /newsroom
 *
 * Structure (top → bottom):
 * 1. Hero title + category nav
 * 2. Featured grid: large sticky card (4:5) + sidebar cards (1:1)
 * 3. Filter/Sort toolbar + article listing grid (3-col, 1:1)
 * 4. Recent news — 2-col row cards
 * 5. Stories — 3-col horizontal carousel
 * 6. Latest research — 3-col horizontal carousel
 * 7. Oxy for business — 3-col horizontal carousel
 * ────────────────────────────────────────────── */
export default function NewsroomPage() {
  const { data: pageData } = usePage('newsroom')
  const { data: storiesData } = useNewsroomPosts({ category: 'Company', limit: 3 })
  const { data: researchData } = useNewsroomPosts({ category: 'Research', limit: 3 })
  const { data: businessData } = useNewsroomPosts({ category: 'Engineering', limit: 3 })

  const stories = storiesData?.posts ?? []
  const research = researchData?.posts ?? []
  const business = businessData?.posts ?? []

  const sections = pageData?.sections ?? []
  const title = pageData?.title ?? 'Newsroom'
  const description = pageData?.description ?? 'The latest news, product announcements, research, and stories from Oxy — the AI-powered CRM platform for go-to-market teams.'

  const heroTitle = sectionHeading(sections, 'hero', 'Newsroom')
  const recentNewsTitle = sectionHeading(sections, 'recent-news', 'Recent news')
  const recentNewsLinkText = sectionSubheading(sections, 'recent-news', 'View more')
  const storiesTitle = sectionHeading(sections, 'stories', 'Stories')
  const latestResearchTitle = sectionHeading(sections, 'latest-research', 'Latest research')
  const oxyForBusinessTitle = sectionHeading(sections, 'oxy-for-business', 'Oxy for business')
  const ui = useMemo(() => parseUI(sections), [sections])

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

      <main className="flex flex-col gap-12 pb-20 md:gap-16 md:pb-28">
        {/* 1 + 2. Hero + featured grid */}
        <NewsroomHeroSection title={heroTitle} />

        {/* 3. Article listing grid with filter/sort + load more */}
        <ArticleGridSection ui={ui} />

        {/* 4. Recent news — 2-col row layout */}
        <RecentNewsSection title={recentNewsTitle} linkText={recentNewsLinkText} viewAllText={ui.viewAll} />

        {/* 5. Stories carousel */}
        <CarouselSection
          title={storiesTitle}
          href="/newsroom"
          articles={stories}
          linkText={ui.viewAll}
        />

        {/* 6. Latest research carousel */}
        <CarouselSection
          title={latestResearchTitle}
          href="/newsroom"
          articles={research}
          linkText={ui.viewAll}
        />

        {/* 7. Oxy for business carousel */}
        <CarouselSection
          title={oxyForBusinessTitle}
          href="/newsroom"
          articles={business}
          linkText={ui.viewAll}
        />
      </main>

      <Footer />
    </div>
  )
}
