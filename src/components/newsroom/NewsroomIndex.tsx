import { useCallback, useState } from 'react'
import {
  ArrowDownUp,
  Check,
  ChevronDown,
  LayoutGrid,
  List,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { useNewsroomPosts, usePage, type PageSection } from '../../api/hooks'
import { newsCategories, type NewsCategory, type NewsroomPost } from '../../data/newsroom'
import { useTranslation } from '../../lib/i18n'
import { AnimatedTitle } from '../ui/AnimatedTitle'
import { NewsCardFeatured, NewsCardGrid, NewsCardRow } from './NewsCard'

interface NewsroomUI {
  filter: string
  newest: string
  oldest: string
  loadMore: string
  clearAll: string
  noResults: string
  clearFilters: string
}

const DEFAULT_UI: NewsroomUI = {
  filter: 'Filter',
  newest: 'Newest',
  oldest: 'Oldest',
  loadMore: 'Load more',
  clearAll: 'Clear all',
  noResults: 'No articles match your filters',
  clearFilters: 'Clear filters',
}

const INITIAL_ARTICLE_COUNT = 6
const ARTICLE_COUNT_INCREMENT = 6

type SortOption = 'newest' | 'oldest'
type ViewOption = 'grid' | 'list'
type OpenMenu = 'filter' | 'sort' | null

function parseUI(sections: PageSection[]): NewsroomUI {
  const items = sections.find((section) => section.type === 'ui')?.items
  if (!items?.length) return DEFAULT_UI

  const values = new Map(items.map((item) => [item.key, item.value]))
  return {
    filter: values.get('filter') ?? DEFAULT_UI.filter,
    newest: values.get('newest') ?? DEFAULT_UI.newest,
    oldest: values.get('oldest') ?? DEFAULT_UI.oldest,
    loadMore: values.get('loadMore') ?? DEFAULT_UI.loadMore,
    clearAll: values.get('clearAll') ?? DEFAULT_UI.clearAll,
    noResults: values.get('noResults') ?? DEFAULT_UI.noResults,
    clearFilters: values.get('clearFilters') ?? DEFAULT_UI.clearFilters,
  }
}

function articleKey(article: NewsroomPost): string {
  return article._id ?? article.slug
}

export default function NewsroomIndex() {
  const { t } = useTranslation()
  const { data: pageData } = usePage('newsroom')
  const { data, isPending } = useNewsroomPosts({ limit: 50 })
  const [activeCategory, setActiveCategory] = useState<NewsCategory>('All')
  const [activeFilters, setActiveFilters] = useState<NewsCategory[]>([])
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [view, setView] = useState<ViewOption>('grid')
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null)
  const [visibleCount, setVisibleCount] = useState(INITIAL_ARTICLE_COUNT)

  const toolbarRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!node.contains(event.target as Node)) setOpenMenu(null)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenMenu(null)
    }

    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [])

  const posts = data?.posts ?? []
  const ui = parseUI(pageData?.sections ?? [])
  const availableCategories = newsCategories.filter(
    (category) => category === 'All' || posts.some((post) => post.categories.includes(category)),
  )

  const categoryArticles = activeCategory === 'All'
    ? posts
    : posts.filter((post) => post.categories.includes(activeCategory))
  const filteredArticles = activeFilters.length === 0
    ? categoryArticles
    : categoryArticles.filter((post) =>
        post.categories.some((category) => activeFilters.includes(category as NewsCategory)),
      )
  const sortedArticles = [...filteredArticles].sort((left, right) => {
    const leftDate = new Date(left.publishedAt).getTime()
    const rightDate = new Date(right.publishedAt).getTime()
    return sortBy === 'newest' ? rightDate - leftDate : leftDate - rightDate
  })

  // The editorial flag leads the newest feed. Switching to oldest remains a
  // literal chronological sort instead of silently pinning a newer article.
  const featuredIndex = sortBy === 'newest'
    ? sortedArticles.findIndex((article) => article.featured)
    : -1
  const orderedArticles = featuredIndex > 0
    ? [
        sortedArticles[featuredIndex],
        ...sortedArticles.slice(0, featuredIndex),
        ...sortedArticles.slice(featuredIndex + 1),
      ]
    : sortedArticles
  const featuredArticle = orderedArticles[0]
  const railArticles = orderedArticles.slice(1, 4)
  const remainingArticles = orderedArticles.slice(4)
  const visibleArticles = remainingArticles.slice(0, visibleCount)
  const hasMore = visibleCount < remainingArticles.length
  const filterCategories = availableCategories.filter((category) => category !== 'All')
  const sortLabels: Record<SortOption, string> = {
    newest: ui.newest,
    oldest: ui.oldest,
  }

  function selectCategory(category: NewsCategory) {
    setActiveCategory(category)
    setActiveFilters([])
    setVisibleCount(INITIAL_ARTICLE_COUNT)
  }

  function toggleFilter(category: NewsCategory) {
    setActiveCategory('All')
    setActiveFilters((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    )
    setVisibleCount(INITIAL_ARTICLE_COUNT)
  }

  function clearFilters() {
    setActiveCategory('All')
    setActiveFilters([])
    setVisibleCount(INITIAL_ARTICLE_COUNT)
  }

  return (
    <main id="main" tabIndex={-1} className="@container relative z-[1] flex-1 outline-none">
      <div className="container @container flex flex-col gap-5 pb-20 pt-20 md:pb-28 md:pt-10">
        <header className="flex flex-col gap-1">
          <AnimatedTitle as="h1" className="text-heading-responsive-lg text-foreground">
            {t('newsroom.heading')}
          </AnimatedTitle>
        </header>

        <div className="pointer-events-none z-10 grid grid-cols-1 @lg:grid-cols-4">
          <nav
            aria-label="News categories"
            className="pointer-events-auto col-span-full overflow-x-auto py-0.5 [-ms-overflow-style:none] [scrollbar-width:none] @lg:col-span-3 [&::-webkit-scrollbar]:hidden"
          >
            <ul className="flex min-w-max items-center gap-5">
              {availableCategories.map((category) => (
                <li key={category}>
                  <button
                    type="button"
                    aria-pressed={activeCategory === category && activeFilters.length === 0}
                    onClick={() => selectCategory(category)}
                    className={`relative cursor-pointer whitespace-nowrap py-1 text-base font-semibold leading-snug transition-colors duration-200 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                      activeCategory === category && activeFilters.length === 0
                        ? 'text-foreground after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:bg-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {category}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-16 flex flex-col gap-20 @md:gap-30">
          <section className="@container -mt-20 @lg:-mt-[calc(6rem+0.5ex)]">
            <div
              ref={toolbarRef}
              className="relative flex flex-col @lg:flex-row @lg:items-center @lg:justify-between"
            >
              <div />
              <hr className="mb-1 mt-4 border-t border-border @lg:hidden" />

              <div className="flex min-h-10 items-center justify-between gap-4 @lg:justify-end">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <button
                      type="button"
                      aria-controls="newsroom-filter-menu"
                      aria-expanded={openMenu === 'filter'}
                      onClick={() => setOpenMenu((current) => current === 'filter' ? null : 'filter')}
                      className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full px-1 text-sm font-medium text-foreground transition-colors hover:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      <SlidersHorizontal aria-hidden className="size-4" />
                      <span>{ui.filter}</span>
                      {activeFilters.length > 0 && (
                        <span className="inline-flex size-5 items-center justify-center rounded-full bg-surface text-xs font-semibold">
                          {activeFilters.length}
                        </span>
                      )}
                      <ChevronDown
                        aria-hidden
                        className={`size-3.5 transition-transform ${openMenu === 'filter' ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {openMenu === 'filter' && (
                      <fieldset
                        id="newsroom-filter-menu"
                        className="absolute left-0 top-full z-50 mt-2 w-56 rounded-xl border border-border bg-background p-2 shadow-lg"
                      >
                        <legend className="sr-only">{ui.filter}</legend>
                        {filterCategories.map((category) => {
                          const checked = activeFilters.includes(category)
                          return (
                            <label
                              key={category}
                              className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleFilter(category)}
                                className="sr-only"
                              />
                              <span>{category}</span>
                              {checked && <Check aria-hidden className="size-4 text-foreground" />}
                            </label>
                          )
                        })}
                        {activeFilters.length > 0 && (
                          <button
                            type="button"
                            onClick={clearFilters}
                            className="mt-1 w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                          >
                            {ui.clearAll}
                          </button>
                        )}
                      </fieldset>
                    )}
                  </div>

                  <div className="relative">
                    <button
                      type="button"
                      aria-controls="newsroom-sort-menu"
                      aria-expanded={openMenu === 'sort'}
                      aria-label={`Sort articles: ${sortLabels[sortBy]}`}
                      onClick={() => setOpenMenu((current) => current === 'sort' ? null : 'sort')}
                      className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full px-1 text-sm font-medium text-foreground transition-colors hover:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      <ArrowDownUp aria-hidden className="size-4" />
                      <span>{sortLabels[sortBy]}</span>
                      <ChevronDown
                        aria-hidden
                        className={`size-3.5 transition-transform ${openMenu === 'sort' ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {openMenu === 'sort' && (
                      <fieldset
                        id="newsroom-sort-menu"
                        className="absolute right-0 top-full z-50 mt-2 w-44 rounded-xl border border-border bg-background p-2 shadow-lg"
                      >
                        <legend className="sr-only">Sort articles</legend>
                        {(Object.keys(sortLabels) as SortOption[]).map((option) => (
                          <label
                            key={option}
                            className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                          >
                            <input
                              type="radio"
                              name="newsroom-sort"
                              value={option}
                              checked={sortBy === option}
                              onChange={() => {
                                setSortBy(option)
                                setVisibleCount(INITIAL_ARTICLE_COUNT)
                                setOpenMenu(null)
                              }}
                              className="sr-only"
                            />
                            <span>{sortLabels[option]}</span>
                            {sortBy === option && <Check aria-hidden className="size-4 text-foreground" />}
                          </label>
                        ))}
                      </fieldset>
                    )}
                  </div>
                </div>

                <fieldset className="flex items-center rounded-full bg-surface p-1">
                  <legend className="sr-only">Article view</legend>
                  {([
                    { value: 'grid', label: 'Grid view', icon: LayoutGrid },
                    { value: 'list', label: 'List view', icon: List },
                  ] as const).map((option) => {
                    const Icon = option.icon
                    return (
                      <label
                        key={option.value}
                        className={`flex size-8 cursor-pointer items-center justify-center rounded-full transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary ${
                          view === option.value
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <input
                          type="radio"
                          name="newsroom-view"
                          value={option.value}
                          checked={view === option.value}
                          onChange={() => setView(option.value)}
                          className="sr-only"
                        />
                        <span className="sr-only">{option.label}</span>
                        <Icon aria-hidden className="size-4" />
                      </label>
                    )
                  })}
                </fieldset>
              </div>
            </div>

            {activeFilters.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {activeFilters.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => toggleFilter(category)}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    {category}
                    <X aria-hidden className="size-3" />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={clearFilters}
                  className="cursor-pointer px-1 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {ui.clearAll}
                </button>
              </div>
            )}

            {isPending ? (
              <div className="mt-12 grid w-full grid-cols-1 gap-6 @lg:grid-cols-4">
                <div className="aspect-[4/5] animate-pulse rounded-md bg-surface motion-reduce:animate-none @lg:col-span-3 @lg:aspect-video" />
                <div className="grid grid-cols-2 gap-6 @sm:grid-cols-3 @lg:grid-cols-1">
                  {[0, 1, 2].map((item) => (
                    <div key={item} className="aspect-square animate-pulse rounded-md bg-surface motion-reduce:animate-none" />
                  ))}
                </div>
              </div>
            ) : featuredArticle ? (
              <>
                <div className="mt-12 grid w-full grid-cols-1 gap-6 @lg:grid-cols-4">
                  <div className="self-start @lg:sticky @lg:top-[calc(var(--site-header-occlusion-bottom)+1rem)] @lg:col-span-3">
                    <NewsCardFeatured article={featuredArticle} />
                  </div>

                  <aside aria-label={t('newsroom.featuredHeading')} className="grid grid-cols-2 gap-x-4 gap-y-10 @sm:grid-cols-3 @lg:grid-cols-1 @lg:gap-x-0 @lg:gap-y-12">
                    {railArticles.map((article) => (
                      <NewsCardGrid key={articleKey(article)} article={article} />
                    ))}
                  </aside>
                </div>

                <div
                  className={
                    view === 'grid'
                      ? 'mt-20 grid grid-cols-1 gap-x-6 gap-y-20 @sm:grid-cols-2 @md:grid-cols-3'
                      : 'mt-20 grid grid-cols-1 gap-y-10'
                  }
                >
                  {visibleArticles.map((article) =>
                    view === 'grid' ? (
                      <NewsCardGrid key={articleKey(article)} article={article} />
                    ) : (
                      <NewsCardRow key={articleKey(article)} article={article} />
                    ),
                  )}
                </div>

                {hasMore && (
                  <div className="flex justify-center pt-20">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((count) => count + ARTICLE_COUNT_INCREMENT)}
                      className="button-primary inline-flex h-11 cursor-pointer items-center justify-center rounded-full px-6 text-sm font-medium transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      {ui.loadMore}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <p className="text-lg font-medium text-muted-foreground">{ui.noResults}</p>
                {(activeCategory !== 'All' || activeFilters.length > 0) && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-4 cursor-pointer text-sm font-medium text-primary hover:underline"
                  >
                    {ui.clearFilters}
                  </button>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
