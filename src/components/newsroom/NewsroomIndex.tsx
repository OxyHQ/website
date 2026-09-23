import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { RiLayoutGridLine } from '@oxy.so/bloom/icons/RiLayoutGridLine'
import { RiListUnordered } from '@oxy.so/bloom/icons/RiListUnordered'
import { SegmentedControl, SegmentedControlItem } from '@oxy.so/bloom/segmented-control'
import { useTheme } from '@oxy.so/bloom/theme'
import { useNewsroomPosts, usePage, type PageSection } from '../../api/hooks'
import { newsCategories, type NewsCategory, type NewsroomPostSummary } from '../../data/newsroom'
import { useTranslation } from '../../lib/i18n'
import { AnimatedTitle } from '../ui/AnimatedTitle'
import { BloomSelectionKeys } from '../ui/BloomSelectionKeys'
import { NewsCardFeatured, NewsCardGrid, NewsCardListRow } from './NewsCard'
import { NewsroomActiveFilters, NewsroomFilterMenu, NewsroomSortMenu } from './NewsroomListControls'

interface NewsroomUI {
  filter: string
  sort: string
  newest: string
  oldest: string
  loadMore: string
  clearAll: string
  noResults: string
  clearFilters: string
}

const DEFAULT_UI: NewsroomUI = {
  filter: 'Filter',
  sort: 'Sort',
  newest: 'Newest',
  oldest: 'Oldest',
  loadMore: 'Load more',
  clearAll: 'Clear all',
  noResults: 'No articles match your filters',
  clearFilters: 'Clear filters',
}

const INITIAL_ARTICLE_COUNT = 10
const ARTICLE_COUNT_INCREMENT = 6

type SortOption = 'newest' | 'oldest'
type ViewOption = 'grid' | 'list'

function parseUI(sections: PageSection[]): NewsroomUI {
  const items = sections.find((section) => section.type === 'ui')?.items
  if (!items?.length) return DEFAULT_UI

  const values = new Map(items.map((item) => [item.key, item.value]))
  return {
    filter: values.get('filter') ?? DEFAULT_UI.filter,
    sort: values.get('sort') ?? DEFAULT_UI.sort,
    newest: values.get('newest') ?? DEFAULT_UI.newest,
    oldest: values.get('oldest') ?? DEFAULT_UI.oldest,
    loadMore: values.get('loadMore') ?? DEFAULT_UI.loadMore,
    clearAll: values.get('clearAll') ?? DEFAULT_UI.clearAll,
    noResults: values.get('noResults') ?? DEFAULT_UI.noResults,
    clearFilters: values.get('clearFilters') ?? DEFAULT_UI.clearFilters,
  }
}

function articleKey(article: NewsroomPostSummary): string {
  return article._id ?? article.slug
}

function isNewsCategory(value: string | null): value is NewsCategory {
  return value !== null && newsCategories.includes(value as NewsCategory)
}

export default function NewsroomIndex() {
  const { t } = useTranslation()
  const { data: pageData } = usePage('newsroom')
  const { data, isPending } = useNewsroomPosts({ limit: 50 })
  const [searchParams, setSearchParams] = useSearchParams()
  const { colors } = useTheme()

  const categoryParam = searchParams.get('category')
  const activeCategory: NewsCategory = isNewsCategory(categoryParam) ? categoryParam : 'All'
  const activeFilters = searchParams
    .getAll('filter')
    .filter((value): value is NewsCategory => isNewsCategory(value) && value !== 'All')
  const sortBy: SortOption = searchParams.get('sort') === 'oldest' ? 'oldest' : 'newest'
  const view: ViewOption = searchParams.get('display') === 'list' ? 'list' : 'grid'
  const filterKey = activeFilters.join('|')
  const paginationKey = `${activeCategory}\u0000${filterKey}\u0000${sortBy}\u0000${view}`
  const [pagination, setPagination] = useState({
    key: paginationKey,
    count: INITIAL_ARTICLE_COUNT,
  })
  const visibleCount = pagination.key === paginationKey
    ? pagination.count
    : INITIAL_ARTICLE_COUNT

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
  const visibleArticles = orderedArticles.slice(0, visibleCount)
  const featuredArticle = visibleArticles[0]
  const railArticles = visibleArticles.slice(1, 4)
  const gridArticles = visibleArticles.slice(4)
  const hasMore = visibleCount < orderedArticles.length
  const filterCategories = availableCategories.filter((category) => category !== 'All')
  const sortLabels: Record<SortOption, string> = {
    newest: ui.newest,
    oldest: ui.oldest,
  }

  function selectCategory(category: NewsCategory) {
    const next = new URLSearchParams(searchParams)
    next.delete('filter')
    if (category === 'All') next.delete('category')
    else next.set('category', category)
    setSearchParams(next)
  }

  function toggleFilter(category: NewsCategory) {
    const next = new URLSearchParams(searchParams)
    const filters = activeFilters.includes(category)
      ? activeFilters.filter((item) => item !== category)
      : [...activeFilters, category]
    next.delete('category')
    next.delete('filter')
    filters.forEach((item) => next.append('filter', item))
    setSearchParams(next)
  }

  function clearFilters() {
    const next = new URLSearchParams(searchParams)
    next.delete('category')
    next.delete('filter')
    setSearchParams(next)
  }

  function selectSort(option: SortOption) {
    const next = new URLSearchParams(searchParams)
    if (option === 'newest') next.delete('sort')
    else next.set('sort', option)
    setSearchParams(next)
  }

  function selectView(option: ViewOption) {
    const next = new URLSearchParams(searchParams)
    if (option === 'grid') next.delete('display')
    else next.set('display', option)
    setSearchParams(next)
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
            <div className="relative flex flex-col @lg:flex-row @lg:items-center @lg:justify-between">
              <div />
              <hr className="mb-1 mt-4 border-t border-border @lg:hidden" />

              <div className="flex min-h-10 items-center justify-between gap-4 @lg:justify-end">
                <div className="flex items-center gap-2">
                  <NewsroomFilterMenu
                    label={ui.filter}
                    clearAllLabel={ui.clearAll}
                    categories={filterCategories}
                    active={activeFilters}
                    onToggle={toggleFilter}
                    onClear={clearFilters}
                  />
                  <NewsroomSortMenu
                    label={ui.sort}
                    options={sortLabels}
                    value={sortBy}
                    onChange={selectSort}
                  />
                </div>

                <BloomSelectionKeys item="radio">
                  <SegmentedControl
                    type="radio"
                    size="sm"
                    label={t('newsroom.viewLabel')}
                    value={view}
                    onValueChange={selectView}
                  >
                    {([
                      { value: 'grid', label: t('newsroom.gridView'), icon: RiLayoutGridLine },
                      { value: 'list', label: t('newsroom.listView'), icon: RiListUnordered },
                    ] as const).map((option) => {
                      const Icon = option.icon
                      return (
                        <SegmentedControlItem
                          key={option.value}
                          value={option.value}
                          accessibilityLabel={option.label}
                        >
                          <Icon
                            aria-hidden
                            size="sm"
                            fill={view === option.value ? colors.text : colors.textSecondary}
                          />
                        </SegmentedControlItem>
                      )
                    })}
                  </SegmentedControl>
                </BloomSelectionKeys>
              </div>
            </div>

            <NewsroomActiveFilters
              className="mt-4"
              active={activeFilters}
              clearAllLabel={ui.clearAll}
              onRemove={toggleFilter}
              onClear={clearFilters}
            />

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
                {view === 'grid' ? (
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

                    {gridArticles.length > 0 && (
                      <div className="mt-20 grid grid-cols-1 gap-x-6 gap-y-20 @sm:grid-cols-2 @md:grid-cols-3">
                        {gridArticles.map((article) => (
                          <NewsCardGrid key={articleKey(article)} article={article} />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="mt-8 grid w-full grid-cols-1">
                    {visibleArticles.map((article) => (
                      <NewsCardListRow key={articleKey(article)} article={article} />
                    ))}
                  </div>
                )}

                {hasMore && (
                  <div className="flex justify-center pt-20">
                    <button
                      type="button"
                      onClick={() => setPagination({
                        key: paginationKey,
                        count: visibleCount + ARTICLE_COUNT_INCREMENT,
                      })}
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
