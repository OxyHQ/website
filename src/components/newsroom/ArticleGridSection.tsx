import { useState, useRef, useEffect } from 'react'
import { NewsCardGrid } from './NewsCard'
import { useNewsroomPosts } from '../../api/hooks'
import { newsCategories } from '../../data/newsroom'

/* ─── Filter icon SVG ─── */
function FilterIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className="h-4 w-4 shrink-0"
    >
      <path
        d="M9.667 3.333a1.333 1.333 0 1 0 0 2.667 1.333 1.333 0 0 0 0-2.667ZM7.084 4a2.667 2.667 0 0 1 5.166 0h1.083a.667.667 0 0 1 0 1.333H12.25a2.667 2.667 0 0 1-5.166 0H2.667a.667.667 0 0 1 0-1.333h4.417ZM6.333 10a1.333 1.333 0 1 0 0 2.667 1.333 1.333 0 0 0 0-2.667Zm-2.582.667a2.667 2.667 0 0 1 5.165 0h4.417a.667.667 0 0 1 0 1.333H8.916a2.667 2.667 0 0 1-5.165 0H2.667a.667.667 0 0 1 0-1.333h1.084Z"
        fill="currentColor"
      />
    </svg>
  )
}

/* ─── Chevron icon SVG ─── */
function ChevronDown({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="10"
      height="16"
      viewBox="0 0 10 16"
      fill="none"
      className={`h-4 w-2.5 shrink-0 ${className}`}
    >
      <path
        d="M.21 5.352a.714.714 0 0 1 1.01 0L5 9.133l3.78-3.78a.714.714 0 1 1 1.01 1.01L5.505 10.65a.714.714 0 0 1-1.01 0L.21 6.363a.714.714 0 0 1 0-1.01Z"
        fill="currentColor"
      />
    </svg>
  )
}

/* ─── Check icon ─── */
function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="h-3.5 w-3.5 shrink-0">
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11.5 3.5 5.5 10 2.5 7" />
    </svg>
  )
}

/* ─── X / close icon ─── */
function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="h-3 w-3 shrink-0">
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="m9 3-6 6m6 0L3 3" />
    </svg>
  )
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

export default function ArticleGridSection({ ui = {} }: { ui?: ArticleGridUI }) {
  const sortLabels: Record<SortOption, string> = {
    newest: ui.newest ?? 'Newest',
    oldest: ui.oldest ?? 'Oldest',
  }
  const { data } = useNewsroomPosts()
  const gridArticles = data?.posts ?? []
  const [visibleCount, setVisibleCount] = useState(6)
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<SortOption>('newest')

  const filterRef = useRef<HTMLDivElement>(null)
  const sortRef = useRef<HTMLDivElement>(null)

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false)
      }
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
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
      : gridArticles.filter((a) => activeFilters.includes(a.category))

  // Sort articles
  const sorted = [...filtered].sort((a, b) => {
    const da = new Date(a.publishedAt).getTime()
    const db = new Date(b.publishedAt).getTime()
    return sortBy === 'newest' ? db - da : da - db
  })

  const visible = sorted.slice(0, visibleCount)
  const hasMore = visibleCount < sorted.length

  return (
    <section className="mx-auto w-full max-w-[1200px] px-5 md:px-8">
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
            {/* Filter dropdown */}
            <div ref={filterRef} className="relative">
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

            {/* Sort dropdown */}
            <div ref={sortRef} className="relative">
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
