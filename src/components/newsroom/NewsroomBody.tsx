import { useMemo } from 'react'
import NewsroomHeroSection from './NewsroomHeroSection'
import ArticleGridSection from './ArticleGridSection'
import RecentNewsSection from './RecentNewsSection'
import CarouselSection from './CarouselSection'
import { useNewsroomPosts, usePage, type PageSection } from '../../api/hooks'

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

interface NewsroomBodyProps {
  /** Optional category scope. When set, every sub-section filters posts down to this category. */
  category?: string
  /** Override the hero title (defaults to the `newsroom` CMS page's hero heading). */
  heroTitle?: string
  /** Target href for the recent-news "View more" link. Defaults to /newsroom (or /company/news when `category === 'Company'`). */
  recentNewsHref?: string
}

/* ──────────────────────────────────────────────────
 * NewsroomBody — shared layout used by both /newsroom and /company/news.
 *
 * Structure (top → bottom):
 * 1. Hero title (+ category nav when unscoped) + featured grid: large sticky
 *    card (4:5) + sidebar cards (1:1).
 * 2. Filter/Sort toolbar + article listing grid (3-col, 1:1). Filter dropdown
 *    is hidden when scoped to a single category.
 * 3. Recent news — 2-col row cards.
 * 4. Stories, Latest research, Oxy for business carousels — only rendered on
 *    the unscoped /newsroom page (carousels are themed by category, so they're
 *    redundant on a category-scoped page).
 * ────────────────────────────────────────────── */
export default function NewsroomBody({ category, heroTitle, recentNewsHref }: NewsroomBodyProps) {
  // Both pages reuse the `newsroom` CMS page for shared copy (UI strings, headings).
  const { data: pageData } = usePage('newsroom')

  // Themed carousels — only relevant on the unscoped /newsroom page.
  const carouselsEnabled = !category
  const { data: storiesData } = useNewsroomPosts({ category: 'Company', limit: 3 })
  const { data: researchData } = useNewsroomPosts({ category: 'Research', limit: 3 })
  const { data: businessData } = useNewsroomPosts({ category: 'Engineering', limit: 3 })
  const stories = storiesData?.posts ?? []
  const research = researchData?.posts ?? []
  const business = businessData?.posts ?? []

  // Stable identity for `sections` so downstream memos (e.g. `ui`) don't
  // recompute on every render purely because the `?? []` fallback returns a
  // fresh array literal.
  const sections = useMemo<PageSection[]>(() => pageData?.sections ?? [], [pageData?.sections])
  const resolvedHeroTitle = heroTitle ?? sectionHeading(sections, 'hero', 'Newsroom')
  const recentNewsTitle = sectionHeading(sections, 'recent-news', 'Recent news')
  const recentNewsLinkText = sectionSubheading(sections, 'recent-news', 'View more')
  const storiesTitle = sectionHeading(sections, 'stories', 'Stories')
  const latestResearchTitle = sectionHeading(sections, 'latest-research', 'Latest research')
  const oxyForBusinessTitle = sectionHeading(sections, 'oxy-for-business', 'Oxy for business')
  const ui = useMemo(() => parseUI(sections), [sections])

  return (
    <main className="flex flex-col gap-12 pb-20 md:gap-16 md:pb-28">
      {/* 1. Hero + featured grid */}
      <NewsroomHeroSection title={resolvedHeroTitle} category={category} />

      {/* 2. Article listing grid with filter/sort + load more */}
      <ArticleGridSection ui={ui} category={category} />

      {/* 3. Recent news — 2-col row layout */}
      <RecentNewsSection
        title={recentNewsTitle}
        linkText={recentNewsLinkText}
        viewAllText={ui.viewAll}
        category={category}
        href={recentNewsHref}
      />

      {/* 4. Themed carousels — only on /newsroom */}
      {carouselsEnabled && (
        <>
          <CarouselSection
            title={storiesTitle}
            href="/newsroom"
            articles={stories}
            linkText={ui.viewAll}
          />
          <CarouselSection
            title={latestResearchTitle}
            href="/newsroom"
            articles={research}
            linkText={ui.viewAll}
          />
          <CarouselSection
            title={oxyForBusinessTitle}
            href="/newsroom"
            articles={business}
            linkText={ui.viewAll}
          />
        </>
      )}
    </main>
  )
}
