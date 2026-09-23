import { useState, useCallback } from 'react'
import { RiArrowDownSLine } from '@oxy.so/bloom/icons/RiArrowDownSLine'
import { RiCheckLine } from '@oxy.so/bloom/icons/RiCheckLine'
import { RiCloseLine } from '@oxy.so/bloom/icons/RiCloseLine'
import { RiEqualizerLine } from '@oxy.so/bloom/icons/RiEqualizerLine'
import { NewsCardGrid } from './NewsCard'
import { useNewsroomPosts } from '../../api/hooks'
import { newsCategories } from '../../data/newsroom'

/*
 * Bloom glyphs. Their default fill is the theme's primary, so each takes
 * `currentColor` to follow the control it sits in, and none of them renders
 * a `className` onto its <svg>, so the chevron turns inside a span.
 */
function FilterIcon() {
  return <RiEqualizerLine width={16} height={16} fill="currentColor" />
}

function ChevronDown({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex shrink-0 ${className}`}>
      <RiArrowDownSLine width={16} height={16} fill="currentColor" />
    </span>
  )
}

function CheckIcon() {
  return <RiCheckLine width={14} height={14} fill="currentColor" />
}

function CloseIcon() {
  return <RiCloseLine width={12} height={12} fill="currentColor" />
}

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
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<SortOption>('newest')

  // React 19 callback refs — outside-click listeners live only while each dropdown is open.
  const filterDropdownRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    const handler = (e: MouseEvent) => {
      if (!node.contains(e.target as Node)) setFilterOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const sortDropdownRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    const handler = (e: MouseEvent) => {
      if (!node.contains(e.target as Node)) setSortOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

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
      {/* ── Filter / sort toolbar ──
       * Original: flex flex-col @lg:flex-row @lg:items-center @lg:justify-between
       * hr: border-primary-4 mb-3xs mt-md border-t-1 @lg:hidden
       * buttons: !rounded, gap-sm, text-cta
       */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div />
        <hr className="mb-1 mt-4 border-t border-border lg:hidden" />
        <div className="flex flex-row items-center justify-between gap-5 lg:justify-normal">
          <div className="flex flex-row items-center gap-5">
            {/* Filter dropdown — hidden when the section is scoped to a single category */}
            {!category && (
              <div ref={filterDropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => { setFilterOpen(!filterOpen); setSortOpen(false) }}
                  className="flex h-10 cursor-pointer items-center justify-start gap-[0.3em] whitespace-nowrap rounded px-0 text-sm font-medium text-foreground transition-colors duration-200 hover:text-muted-foreground"
                >
                  <FilterIcon />
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                    {ui.filter ?? 'Filter'}
                  </span>
                  {activeFilters.length > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-surface px-1.5 text-xs font-semibold text-foreground">
                      {activeFilters.length}
                    </span>
                  )}
                </button>

                {filterOpen && (
                  <div className="absolute left-0 top-full z-50 mt-1 w-52 rounded-xl border border-border bg-background py-1 shadow-lg">
                    {filterCategories.map((cat) => {
                      const isActive = activeFilters.includes(cat)
                      return (
                        <button
                          key={cat}
                          onClick={() => toggleFilter(cat)}
                          className="flex w-full cursor-pointer items-center justify-between px-3 py-2 text-sm transition-colors duration-150 hover:bg-surface"
                        >
                          <span className={isActive ? 'text-foreground' : 'text-muted-foreground'}>
                            {cat}
                          </span>
                          {isActive && (
                            <span className="text-foreground">
                              <CheckIcon />
                            </span>
                          )}
                        </button>
                      )
                    })}
                    {activeFilters.length > 0 && (
                      <>
                        <div className="my-1 h-px bg-border" />
                        <button
                          onClick={clearFilters}
                          className="flex w-full cursor-pointer items-center px-3 py-2 text-sm text-muted-foreground transition-colors duration-150 hover:bg-surface hover:text-foreground"
                        >
                          {ui.clearAll ?? 'Clear all'}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Sort dropdown */}
            <div ref={sortDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => { setSortOpen(!sortOpen); setFilterOpen(false) }}
                className="flex h-10 cursor-pointer items-center justify-start gap-[0.3em] whitespace-nowrap rounded px-0 text-sm font-medium text-foreground transition-colors duration-200 hover:text-muted-foreground"
              >
                <ChevronDown className={`transition-transform duration-200 ${sortOpen ? 'rotate-180' : ''}`} />
                <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                  {sortLabels[sortBy]}
                </span>
              </button>

              {sortOpen && (
                <div className="absolute left-0 top-full z-50 mt-1 w-40 rounded-xl border border-border bg-background py-1 shadow-lg">
                  {(Object.keys(sortLabels) as SortOption[]).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => { setSortBy(opt); setSortOpen(false); setVisibleCount(6) }}
                      className="flex w-full cursor-pointer items-center justify-between px-3 py-2 text-sm transition-colors duration-150 hover:bg-surface"
                    >
                      <span className={sortBy === opt ? 'text-foreground' : 'text-muted-foreground'}>
                        {sortLabels[opt]}
                      </span>
                      {sortBy === opt && (
                        <span className="text-foreground">
                          <CheckIcon />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Active filter tags ── */}
      {activeFilters.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {activeFilters.map((cat) => (
            <button
              key={cat}
              onClick={() => toggleFilter(cat)}
              className="flex cursor-pointer items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs font-medium text-foreground transition-colors duration-150 hover:bg-surface"
            >
              {cat}
              <CloseIcon />
            </button>
          ))}
          <button
            onClick={clearFilters}
            className="cursor-pointer px-1 text-xs font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
          >
            {ui.clearAll ?? 'Clear all'}
          </button>
        </div>
      )}

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
