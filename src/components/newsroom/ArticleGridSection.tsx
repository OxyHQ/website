import { useState } from 'react'
import { NewsCardGrid } from './NewsCard'
import { NewsroomActiveFilters, NewsroomFilterMenu, NewsroomSortMenu } from './NewsroomListControls'
import { useNewsroomPosts } from '../../api/hooks'
import { newsCategories } from '../../data/newsroom'

type SortOption = 'newest' | 'oldest'

interface ArticleGridUI {
  filter?: string
  newest?: string
  oldest?: string
  loadMore?: string
  clearAll?: string
  noResults?: string
  clearFilters?: string
}

const filterCategories = newsCategories.filter((c) => c !== 'All')

interface ArticleGridSectionProps {
  ui?: ArticleGridUI
  /**
   * When set, scopes the underlying query to a single category and hides the
   * category filter UI (since there's nothing else to filter to). Used by
   * /company/news.
   */
  category?: string
}

export default function ArticleGridSection({ ui = {}, category }: ArticleGridSectionProps) {
  const sortLabels: Record<SortOption, string> = {
    newest: ui.newest ?? 'Newest',
    oldest: ui.oldest ?? 'Oldest',
  }
  const { data } = useNewsroomPosts({ category })
  const gridArticles = data?.posts ?? []
  const [visibleCount, setVisibleCount] = useState(6)
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<SortOption>('newest')

  function toggleFilter(cat: string) {
    setActiveFilters((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
    setVisibleCount(6)
  }

  function clearFilters() {
    setActiveFilters([])
    setVisibleCount(6)
  }

  function selectSort(option: SortOption) {
    setSortBy(option)
    setVisibleCount(6)
  }

  // Filter articles
  const filtered =
    activeFilters.length === 0
      ? gridArticles
      : gridArticles.filter((a) => a.categories.some((c) => activeFilters.includes(c)))

  // Sort articles
  const sorted = [...filtered].sort((a, b) => {
    const da = new Date(a.publishedAt).getTime()
    const db = new Date(b.publishedAt).getTime()
    return sortBy === 'newest' ? db - da : da - db
  })

  const visible = sorted.slice(0, visibleCount)
  const hasMore = visibleCount < sorted.length

  return (
    <section className="container">
      {/* ── Filter / sort toolbar ── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div />
        <hr className="mb-1 mt-4 border-t border-border lg:hidden" />
        <div className="flex min-h-10 flex-row items-center gap-2">
          {/* Filtering is hidden when the section is scoped to a single category. */}
          {!category && (
            <NewsroomFilterMenu
              label={ui.filter ?? 'Filter'}
              clearAllLabel={ui.clearAll ?? 'Clear all'}
              categories={filterCategories}
              active={activeFilters}
              onToggle={toggleFilter}
              onClear={clearFilters}
            />
          )}
          <NewsroomSortMenu
            label={sortLabels[sortBy]}
            options={sortLabels}
            value={sortBy}
            onChange={selectSort}
          />
        </div>
      </div>

      {/* ── Active filter tags ── */}
      <NewsroomActiveFilters
        className="mt-3"
        active={activeFilters}
        clearAllLabel={ui.clearAll ?? 'Clear all'}
        onRemove={toggleFilter}
        onClear={clearFilters}
      />

      {/* ── Article grid ── */}
      <div className="mt-6 grid grid-cols-1 gap-x-4 gap-y-10 sm:grid-cols-2 md:grid-cols-3">
        {visible.map((article) => (
          <NewsCardGrid key={article._id} article={article} />
        ))}
      </div>

      {/* ── Empty state ── */}
      {sorted.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-medium text-muted-foreground">
            {ui.noResults ?? 'No articles match your filters'}
          </p>
          <button
            onClick={clearFilters}
            className="mt-3 cursor-pointer text-sm font-medium text-primary transition-colors duration-150 hover:underline"
          >
            {ui.clearFilters ?? 'Clear filters'}
          </button>
        </div>
      )}

      {/* ── Load more ── */}
      {hasMore && (
        <div className="mt-12 flex justify-center">
          <button
            onClick={() => setVisibleCount((c) => c + 3)}
            className="flex h-10 cursor-pointer items-center justify-center gap-[0.3em] whitespace-nowrap rounded-[2.5rem] bg-surface px-5 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-surface"
          >
            {ui.loadMore ?? 'Load more'}
          </button>
        </div>
      )}
    </section>
  )
}
