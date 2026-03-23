import { useState } from 'react'
import { NewsCardFeatured, NewsCardGrid } from './NewsCard'
import {
  featuredArticle,
  sidebarArticles,
  newsCategories,
  type NewsCategory,
} from '../../data/newsroom'

export default function NewsroomHeroSection() {
  const [activeCategory, setActiveCategory] = useState<NewsCategory>('Company')

  return (
    <section className="mx-auto w-full max-w-[1200px] px-5 pt-20 md:px-8 md:pt-10">
      {/* ── Title ── */}
      <div className="flex flex-col gap-1">
        <h1 className="shrink-0 text-heading-responsive-lg text-primary-foreground">
          Recent news
        </h1>
      </div>

      {/* ── Category nav — horizontal scrollable ──
       * Original: grid-cols-1 @lg:grid-cols-4, nav spans col-span-full @lg:col-span-3
       * ul gap-sm flex items-center, li text-h5
       * Active: text-primary-100
       * Inactive: text-primary-60 hover:text-primary-80
       */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-4">
        <nav className="col-span-full overflow-x-auto py-1 lg:col-span-3">
          <div className="relative min-w-fit">
            <ul className="flex items-center gap-6">
              {newsCategories.map((cat) => (
                <li key={cat} className="text-base font-semibold">
                  <button
                    onClick={() => setActiveCategory(cat)}
                    className={`cursor-pointer whitespace-nowrap rounded-sm transition-colors duration-200 ${
                      activeCategory === cat
                        ? 'text-primary-foreground'
                        : 'text-caption-foreground hover:text-tertiary-foreground'
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
       * Left: @lg:sticky @lg:col-span-3, featured card 4:5
       * Right: gap-y-xl gap-x-2xs col-span-1, 1:1 aspect cards, hidden @lg:grid
       */}
      <div className="mt-10 grid w-full grid-cols-1 gap-4 lg:grid-cols-4 lg:gap-6">
        {/* Left — featured card (sticky on desktop) */}
        <div className="self-start lg:sticky lg:top-[80px] lg:col-span-3">
          <NewsCardFeatured article={featuredArticle} />
        </div>

        {/* Right — sidebar cards, stacked vertically on desktop */}
        <div className="hidden gap-y-8 lg:grid lg:grid-cols-1">
          {sidebarArticles.map((article) => (
            <NewsCardGrid key={article.id} article={article} />
          ))}
        </div>

        {/* Mobile fallback — sidebar cards in 2-3 col row */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:hidden">
          {sidebarArticles.map((article) => (
            <NewsCardGrid key={article.id} article={article} />
          ))}
        </div>
      </div>
    </section>
  )
}
