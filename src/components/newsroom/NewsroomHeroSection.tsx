import { useState } from 'react'
import { NewsCardFeatured, NewsCardGrid } from './NewsCard'
import { useNewsroomPosts } from '../../api/hooks'
import { newsCategories, type NewsCategory } from '../../data/newsroom'

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
export default function NewsroomHeroSection() {
  const { data: featuredData, isPending: featuredPending } = useNewsroomPosts({ featured: true, limit: 1 })
  const featuredArticle = featuredData?.posts?.[0] ?? null
  const { data: sidebarData, isPending: sidebarPending } = useNewsroomPosts({ limit: 5 })
  const sidebarArticles = sidebarData?.posts?.slice(1) ?? []
  const [activeCategory, setActiveCategory] = useState<NewsCategory>('Company')
  const isLoading = featuredPending || sidebarPending

  return (
    <section className="mx-auto w-full max-w-[1200px] px-5 pt-[5rem] md:px-8 md:pt-10">
      {/* ── Title ── */}
      <div className="flex flex-col gap-1">
        <h1 className="shrink-0 text-heading-responsive-lg text-foreground">
          Newsroom
        </h1>
      </div>

      {/* ── Category nav ──
       * Original: grid grid-cols-1 @lg:grid-cols-4
       *   nav: col-span-full @lg:col-span-3, scrollable, py-5xs
       *   ul: gap-sm flex items-center
       *   li: text-h5
       *   active a: text-primary-100
       *   inactive a: text-primary-60 hover:text-primary-80
       */}
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

      {/* ── Featured + sidebar grid ──
       * Original: @lg:max-w-container gap-sm grid w-full grid-cols-1 @lg:grid-cols-4
       * Left: mb-sm self-start @lg:sticky @lg:col-span-3 @lg:mb-0 @lg:top-header-h
       * Right: gap-y-xl gap-x-2xs col-span-1 grid-cols-1 @lg:grid-cols-1 @lg:px-0 hidden @lg:grid @md:grid-cols-3
       */}
      <div className="mt-8 grid w-full grid-cols-1 gap-4 md:mt-12 lg:grid-cols-4">
        {/* Left — featured card (sticky on desktop) */}
        <div className="mb-4 self-start lg:sticky lg:top-[80px] lg:col-span-3 lg:mb-0">
          {isLoading && <div className="aspect-[4/5] animate-pulse rounded-2xl bg-surface" />}
          {!isLoading && featuredArticle && <NewsCardFeatured article={featuredArticle} />}
        </div>

        {/* Right — sidebar cards (desktop: stacked 1-col, hidden on mobile) */}
        <div className="hidden gap-x-1 gap-y-8 lg:grid lg:grid-cols-1 lg:px-0">
          {isLoading && [1, 2, 3].map((i) => (
            <div key={i} className="aspect-square animate-pulse rounded-2xl bg-surface" />
          ))}
          {sidebarArticles.map((article) => (
            <NewsCardGrid key={article._id} article={article} />
          ))}
        </div>

        {/* Mobile/tablet fallback — sidebar cards in row */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-3 lg:hidden">
          {isLoading && [1, 2, 3].map((i) => (
            <div key={i} className="aspect-square animate-pulse rounded-2xl bg-surface" />
          ))}
          {sidebarArticles.map((article) => (
            <NewsCardGrid key={article._id} article={article} />
          ))}
        </div>
      </div>
    </section>
  )
}
