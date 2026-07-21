import { useState } from 'react'
import * as Skeleton from '@oxyhq/bloom/skeleton'
import { NewsCardFeatured, NewsCardGrid } from './NewsCard'
import { useNewsroomPosts } from '../../api/hooks'
import { newsCategories, type NewsCategory } from '../../data/newsroom'

interface NewsroomHeroSectionProps {
  title?: string
  /**
   * When set, scopes the hero (featured + sidebar) to a single category and
   * hides the category tab nav. Used by /company/news.
   */
  category?: string
}

/* Local category tab nav — kept as a sub-component so the `useState` hook is
 * only mounted on the unscoped /newsroom hero, not the scoped /company/news one. */
function CategoryNav() {
  const [activeCategory, setActiveCategory] = useState<NewsCategory>('Company')
  return (
    <div className="pointer-events-none z-10 mt-4 grid grid-cols-1 lg:grid-cols-4">
      <nav className="pointer-events-auto col-span-full overflow-x-auto py-0.5 lg:col-span-3">
        <div className="relative min-w-fit">
          <ul className="flex items-center gap-5">
            {newsCategories.map((cat) => (
              <li key={cat} className="text-base font-semibold leading-snug">
                <button
                  onClick={() => setActiveCategory(cat)}
                  className={`cursor-pointer whitespace-nowrap rounded-sm transition-colors duration-200 ${
                    activeCategory === cat
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-muted-foreground'
                  }`}
                >
                  {cat}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </div>
  )
}

/* ──────────────────────────────────────────────────
 * Hero section
 * Original structure:
 *   max-w-container gap-xs flex flex-col pt-[5rem] md:pt-10
 *     gap-3xs flex flex-col > h2.text-h2
 *     gap-sm pointer-events-none z-10 grid grid-cols-1 @lg:grid-cols-4
 *       nav.scrollable py-5xs pointer-events-auto col-span-full @lg:col-span-3
 *         ul.gap-sm flex items-center > li.text-h5 > a
 *     flex flex-col mt-xl gap-2xl @md:gap-3xl
 *       section.max-w-container
 *         @lg:max-w-container gap-sm grid w-full grid-cols-1 @lg:grid-cols-4
 *           left: @lg:sticky @lg:col-span-3 (featured 4:5)
 *           right: gap-y-xl gap-x-2xs col-span-1 hidden @lg:grid (sidebar 1:1)
 * ────────────────────────────────────────────── */
export default function NewsroomHeroSection({ title = 'Newsroom', category }: NewsroomHeroSectionProps) {
  // Featured: prefer a `featured: true` post in scope; fall back to the latest
  // in-scope post so the hero always renders when any post exists.
  const { data: featuredData, isPending: featuredPending } = useNewsroomPosts({ category, featured: true, limit: 1 })
  const { data: fallbackData, isPending: fallbackPending } = useNewsroomPosts({ category, limit: 1 })
  const featuredArticle = featuredData?.posts?.[0] ?? fallbackData?.posts?.[0] ?? null
  const { data: sidebarData, isPending: sidebarPending } = useNewsroomPosts({ category, limit: 5 })
  const sidebarArticles = (sidebarData?.posts ?? []).filter((a) => a._id !== featuredArticle?._id).slice(0, 3)
  const isLoading = featuredPending || fallbackPending || sidebarPending

  return (
    <section className="container pt-[5rem] md:pt-10">
      {/* ── Title ── */}
      <div className="flex flex-col gap-1">
        <h1 className="shrink-0 text-heading-responsive-lg text-foreground">
          {title}
        </h1>
      </div>

      {/* ── Category nav ──
       * Hidden when this hero is scoped to a single category (e.g. /company/news).
       */}
      {!category && <CategoryNav />}

      {/* ── Featured + sidebar grid ──
       * Original: @lg:max-w-container gap-sm grid w-full grid-cols-1 @lg:grid-cols-4
       * Left: mb-sm self-start @lg:sticky @lg:col-span-3 @lg:mb-0 @lg:top-header-h
       * Right: gap-y-xl gap-x-2xs col-span-1 grid-cols-1 @lg:grid-cols-1 @lg:px-0 hidden @lg:grid @md:grid-cols-3
       */}
      <div className="mt-8 grid w-full grid-cols-1 gap-4 md:mt-12 lg:grid-cols-4">
        {/* Left — featured card (sticky on desktop) */}
        <div className="mb-4 self-start lg:sticky lg:top-[80px] lg:col-span-3 lg:mb-0">
          {isLoading && <Skeleton.Box width="100%" borderRadius={16} style={{ aspectRatio: 4 / 5 }} />}
          {!isLoading && featuredArticle && <NewsCardFeatured article={featuredArticle} />}
        </div>

        {/* Right — sidebar cards (desktop: stacked 1-col, hidden on mobile) */}
        <div className="hidden gap-x-1 gap-y-8 lg:grid lg:grid-cols-1 lg:px-0">
          {isLoading && [1, 2, 3].map((i) => (
            <Skeleton.Box key={i} width="100%" borderRadius={16} style={{ aspectRatio: 1 }} />
          ))}
          {sidebarArticles.map((article) => (
            <NewsCardGrid key={article._id} article={article} />
          ))}
        </div>

        {/* Mobile/tablet fallback — sidebar cards in row */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-3 lg:hidden">
          {isLoading && [1, 2, 3].map((i) => (
            <Skeleton.Box key={i} width="100%" borderRadius={16} style={{ aspectRatio: 1 }} />
          ))}
          {sidebarArticles.map((article) => (
            <NewsCardGrid key={article._id} article={article} />
          ))}
        </div>
      </div>
    </section>
  )
}
