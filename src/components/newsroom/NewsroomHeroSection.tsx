import { useState } from 'react'
import NewsCard from './NewsCard'
import { newsArticles, newsCategories } from '../../data/newsroom'

export default function NewsroomHeroSection() {
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const [visibleCount, setVisibleCount] = useState(9)

  const filtered =
    activeCategory === 'All'
      ? newsArticles
      : newsArticles.filter((a) => a.category === activeCategory)

  const visible = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

  function handleCategoryChange(category: string) {
    setActiveCategory(category)
    setVisibleCount(9)
  }

  return (
    <section className="w-full">
      {/* Hero title + filters bar */}
      <div className="mx-auto w-full max-w-[1200px] px-5 pt-12 md:px-8 md:pt-16">
        {/* Title row with filters */}
        <div className="flex w-full flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <h1 className="shrink-0 text-heading-responsive-lg text-primary-foreground">
            Recent news
          </h1>

          {/* Filter pills */}
          <div className="flex flex-row flex-wrap items-center gap-2">
            {newsCategories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`cursor-pointer whitespace-nowrap rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors duration-200 ${
                  activeCategory === category
                    ? 'bg-surface text-primary-foreground'
                    : 'bg-surface-subtle text-tertiary-foreground hover:bg-surface'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-auto mt-8 w-full max-w-[1200px] px-5 md:mt-10 md:px-8">
        <div className="h-px w-full bg-subtle-stroke" />
      </div>

      {/* News grid */}
      <div className="mx-auto w-full max-w-[1200px] px-5 pt-10 pb-20 md:px-8 md:pt-14 md:pb-28">
        <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>

        {/* Load more */}
        {hasMore && (
          <div className="mt-16 flex justify-center">
            <button
              onClick={() => setVisibleCount((c) => c + 6)}
              className="flex h-10 cursor-pointer items-center justify-center rounded-[2.5rem] bg-surface-subtle px-5 text-sm font-medium text-primary-foreground transition-colors duration-200 hover:bg-surface"
            >
              Load more
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
