import { Link } from 'react-router-dom'
import * as LucideIcons from 'lucide-react'
import {
  useHelpArticles,
  useCategories,
  usePage,
  resolveHelpArticleCategoryId,
  type HelpArticleRecord,
  type CategoryRecord,
  type PageSection,
} from '../../api/hooks'

/* ─── Copy fallbacks when /pages/help has not been populated ─── */

const DEFAULT_HERO_BADGE = 'Help center'
const DEFAULT_HERO_TITLE = 'How can we help?'
const DEFAULT_HERO_SUBTITLE = 'Get answers to common questions on all things Oxy'
const DEFAULT_GETTING_STARTED_HEADING = 'Get started'
const DEFAULT_GETTING_STARTED_SUB_PRE = 'with '
const DEFAULT_GETTING_STARTED_SUB_POST = 'Oxy 101.'
const DEFAULT_GETTING_STARTED_LEAD = 'Everything you need to master the basics of Oxy.'

const DEFAULT_POPULAR_SEARCHES = ['importing', 'billing', 'integrations']

/* ─── Section helpers (mirror ProductsPage / AcademyPage) ─── */

function sectionHeading(sections: PageSection[], type: string, fallback: string): string {
  return sections.find(s => s.type === type)?.heading || fallback
}

function sectionSubheading(sections: PageSection[], type: string, fallback: string): string {
  return sections.find(s => s.type === type)?.subheading || fallback
}

function sectionContent(sections: PageSection[], type: string, fallback: string): string {
  return sections.find(s => s.type === type)?.content || fallback
}

function sectionItems(sections: PageSection[], type: string): Array<{ key: string; value: string; [extra: string]: unknown }> {
  return sections.find(s => s.type === type)?.items ?? []
}

/* ─── Lucide icon lookup (icons stored in kebab-case) ─── */

type LucideComponent = LucideIcons.LucideIcon
const LUCIDE_INDEX = LucideIcons as unknown as Record<string, LucideComponent>

function fromKebab(input: string): string {
  return input.replace(/(^|-)([a-z])/g, (_, __, c: string) => c.toUpperCase())
}

function lucideIcon(name: string | undefined): LucideComponent | null {
  if (!name) return null
  const Icon = LUCIDE_INDEX[fromKebab(name)]
  return typeof Icon === 'function' ? Icon : null
}

/* ─── SVG Icons (kept for the sidebar + hero search visuals) ─── */

function SearchIcon({ className = '' }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className={className}>
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.2"
        d="m15.8 15.8-3.62-3.62M1.8 7.833a6.034 6.034 0 1 1 12.069 0 6.034 6.034 0 0 1-12.07 0Z"
      />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg
      className="transition-transform group-data-[open]:rotate-90"
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4.5 3L7.5 6L4.5 9"
        stroke="var(--color-muted-foreground)"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ArrowRight() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className="relative shrink-0 text-foreground opacity-0 -translate-x-0.25 transition-[opacity,translate] duration-400 ease-in-out group-hover:translate-0 group-hover:opacity-100 group-hover:duration-150 group-active:translate-0 group-active:opacity-100 group-active:duration-50"
    >
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.1"
        d="M2.25 7h9.5m0 0L8.357 3.5M11.75 7l-3.393 3.5"
      />
    </svg>
  )
}

/* ─── Card helpers ─── */

function CategoryCardIcon({ name, className = '' }: { name?: string; className?: string }) {
  const Icon = lucideIcon(name)
  if (Icon) {
    return (
      <div className={`flex items-center justify-center rounded-[10px] border border-border bg-surface ${className}`}>
        <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
      </div>
    )
  }
  return (
    <div className={`flex items-center justify-center rounded-[10px] border border-border bg-surface ${className}`} aria-hidden="true">
      <div className="size-2 rounded-full bg-muted-foreground" />
    </div>
  )
}

function ArticleNumber({ index }: { index: number }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground text-sm shadow-[0px_2px_4px_0px_rgba(28,40,64,0.04),0px_1px_2px_-1px_rgba(28,40,64,0.08)] transition-[border-color] group-hover:border-input">
      {index + 1}
    </div>
  )
}

/* ─── Sidebar ─── */

interface CategoryGroup {
  category: CategoryRecord
  articles: HelpArticleRecord[]
}

function buildCategoryGroups(categories: CategoryRecord[], articles: HelpArticleRecord[]): CategoryGroup[] {
  const byCategory = new Map<string, HelpArticleRecord[]>()
  for (const article of articles) {
    const id = resolveHelpArticleCategoryId(article)
    if (!id) continue
    const list = byCategory.get(id) ?? []
    list.push(article)
    byCategory.set(id, list)
  }
  return categories
    .map((category) => ({
      category,
      articles: byCategory.get(category._id ?? '') ?? [],
    }))
    .filter((group) => group.articles.length > 0)
}

function HelpSidebar({ groups }: { groups: CategoryGroup[] }) {
  return (
    <nav className="col-[1/6] border-border border-r max-xl:col-[1/7] max-lg:hidden">
      <div className="sticky top-[var(--site-header-height,56px)] flex h-[calc(100vh-var(--site-header-height,56px))] flex-col pt-10">
        {/* Search button — placeholder UI until a real search experience
            is wired. Disabled so users get the right signal instead of a
            silent no-op. */}
        <div className="pr-6">
          <button
            type="button"
            disabled
            aria-disabled="true"
            title="Search is coming soon"
            className="relative inline-flex items-center text-nowrap border transition-colors h-9 gap-x-1.5 rounded-[10px] px-3 text-sm button-outline justify-between pr-2 w-full opacity-60 cursor-not-allowed"
          >
            <SearchIcon className="text-muted-foreground" />
            <div className="flex w-full items-center justify-between gap-2">
              <span className="text-muted-foreground">Search help</span>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Soon</span>
            </div>
          </button>
        </div>

        {/* Scrollable nav */}
        <div className="mask-t-from-[calc(100%-40px)] relative flex-1 overflow-y-scroll pt-10 pr-6 pb-8 [scrollbar-gutter:stable]">
          <div className="mb-5 flex flex-col gap-5 lg:mb-8 lg:gap-8">
            {groups.map(({ category, articles }) => (
              <div key={category.slug}>
                <Link
                  className="flex items-center gap-[7px] rounded-[10px] py-px pl-px hover:bg-surface/80"
                  to={`/help#${category.slug}`}
                >
                  <CategoryCardIcon name={category.slug} className="size-7.5" />
                  <div className="font-semibold text-xs uppercase">{category.label}</div>
                </Link>
                <div className="mt-1 flex flex-col lg:gap-0.5">
                  {articles.map((article) => (
                    <div key={article.slug} className="group relative w-full">
                      <button
                        className="absolute top-0 left-0 cursor-pointer self-start rounded-[10px] p-2.5 ring-inset transition-[background-color] hover:bg-surface group-hover:bg-surface"
                        type="button"
                      >
                        <ChevronRight />
                      </button>
                      <Link
                        className="inline-block w-full rounded-[10px] p-1.5 pr-2.5 pl-[38px] text-left text-muted-foreground text-sm hover:bg-surface"
                        to={`/help/${article.slug}`}
                      >
                        {article.title}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}

/* ─── Main Content ─── */

interface HelpContentProps {
  heroBadge: string
  heroTitle: string
  heroSubtitle: string
  popularSearches: string[]
  categories: CategoryRecord[]
  featuredArticles: HelpArticleRecord[]
  gettingStartedHeading: string
  gettingStartedSubPre: string
  gettingStartedSubPost: string
  gettingStartedLead: string
  articleCountByCategoryId: Map<string, number>
}

function HelpContent({
  heroBadge,
  heroTitle,
  heroSubtitle,
  popularSearches,
  categories,
  featuredArticles,
  gettingStartedHeading,
  gettingStartedSubPre,
  gettingStartedSubPost,
  gettingStartedLead,
  articleCountByCategoryId,
}: HelpContentProps) {
  return (
    <div className="col-[7/-1] pt-10 pb-20 max-lg:col-[1/-1] max-xl:col-[8/-1]">
      <section className="grid w-full grid-cols-18">
        <div className="col-[2/-3] flex flex-col items-center pt-19 pb-10 max-lg:col-[1/-1] max-lg:pt-10">
          {/* Hero */}
          <div className="flex flex-col items-center text-center">
            {heroBadge && (
              <div className="inline-block w-fit rounded-[13px] border border-border bg-background px-3 py-1.5 font-medium text-[13px]/[1.4em] text-foreground">
                {heroBadge}
              </div>
            )}
            <h1 className="mt-6 text-heading-lg">{heroTitle}</h1>
            <div className="mt-4 max-w-[20em] text-pretty text-foreground text-xl">
              {heroSubtitle}
            </div>
          </div>

          {/* Search bar — placeholder UI until a real search experience is
              wired. Disabled so users get the right signal instead of a
              silent no-op. */}
          <div className="mt-10 flex w-full max-w-[558px] flex-col items-center md:mt-8">
            <button
              type="button"
              disabled
              aria-disabled="true"
              title="Search is coming soon"
              className="relative inline-flex items-center justify-center text-nowrap border transition-colors h-11.5 gap-x-2 rounded-xl px-3.5 button-outline w-full pr-2.5 text-sm shadow-[0px_1px_2px_-1px_rgba(28,40,64,0.08),_0px_2px_4px_0px_rgba(28,40,64,0.04)] opacity-60 cursor-not-allowed"
            >
              <SearchIcon />
              <p className="w-full truncate text-left text-muted-foreground">
                Search is coming soon — browse the categories below for now
              </p>
            </button>

            {/* Popular searches — decorative until search is wired. */}
            {popularSearches.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-2 text-muted-foreground mt-4 md:mt-5">
                <p className="shrink-0 text-muted-foreground text-sm">Popular topics:</p>
                <ul className="flex gap-1.5 text-xs">
                  {popularSearches.map((s) => (
                    <li key={s}>
                      <button
                        type="button"
                        disabled
                        aria-disabled="true"
                        className="relative inline-flex items-center justify-center text-nowrap border gap-x-1.5 rounded-[10px] px-2.5 text-xs button-outline !bg-surface !text-muted-foreground h-7 opacity-60 cursor-not-allowed"
                      >
                        {s}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Category cards */}
          {categories.length > 0 && (
            <div className="mt-25 grid w-full grid-cols-3 gap-5 max-lg:grid-cols-1 max-lg:gap-4 max-md:mt-15">
              {categories.slice(0, 3).map((category) => {
                const count = articleCountByCategoryId.get(category._id ?? '') ?? 0
                return (
                  <Link
                    key={category.slug}
                    className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border p-6 pt-5.5 transition-colors duration-400 ease-in-out hover:border-input hover:duration-150 active:border-input active:duration-50 size-full"
                    to={`/help#${category.slug}`}
                  >
                    <div className="pointer-events-none absolute inset-0 bg-surface opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-80 group-hover:duration-50 group-active:opacity-100 group-active:duration-50" />
                    <div className="relative flex items-center justify-between">
                      <CategoryCardIcon name={category.slug} className="relative size-11 max-lg:size-10" />
                      <ArrowRight />
                    </div>
                    <div className="relative flex flex-col gap-1">
                      <h3 className="font-semibold text-foreground">{category.label}</h3>
                      <p className="text-balance text-sm text-muted-foreground">
                        {category.description || `${count} ${count === 1 ? 'article' : 'articles'}`}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {/* Divider */}
          <svg width="100%" height="1" className="text-border my-15 md:my-25">
            <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="currentColor" strokeLinecap="round" />
          </svg>

          {/* Get started section */}
          <div className="flex flex-col justify-between gap-x-[clamp(24px,calc(33.8%-215.304px),105px)] gap-y-10 xl:flex-row self-stretch">
            <div className="w-full xl:max-w-96">
              <div>
                <h2 className="text-heading-md">
                  <span>{gettingStartedHeading} </span>
                  <span className="text-muted-foreground">{gettingStartedSubPre}</span>
                  <br />
                  <span className="text-muted-foreground">{gettingStartedSubPost}</span>
                </h2>
              </div>
              <p className="mt-3 text-muted-foreground">{gettingStartedLead}</p>
            </div>
            <div>
              <ul>
                {featuredArticles.map((article, i) => (
                  <li
                    key={article.slug}
                    className="border-border border-b pt-8 pb-[31px] first-of-type:pt-0"
                  >
                    <Link className="group -m-2 flex gap-x-8 rounded-xl p-2" to={`/help/${article.slug}`}>
                      <ArticleNumber index={i} />
                      <div>
                        <p className="text-balance font-semibold">{article.title}</p>
                        <p className="mt-0.5 line-clamp-2 text-balance text-muted-foreground transition-[color] group-hover:text-foreground">
                          {article.summary}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
                {featuredArticles.length === 0 && (
                  <li className="border-border border-b pt-8 pb-[31px] first-of-type:pt-0">
                    <p className="text-balance text-muted-foreground">
                      No featured articles yet. Add one in the admin to populate this list.
                    </p>
                  </li>
                )}
              </ul>
              <Link
                className="-m-px mt-7 inline-block rounded-sm p-px text-muted-foreground transition-[color] hover:text-foreground active:text-muted-foreground"
                to="/help"
              >
                See all articles...
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

/* ─── Page Export ─── */

export default function HelpPageContent() {
  const { data: pageData } = usePage('help')
  const { data: categoriesData } = useCategories('generic')
  const { data: articlesData } = useHelpArticles({ limit: 100 })
  const { data: featuredData } = useHelpArticles({ featured: true, limit: 6 })

  const sections = pageData?.sections ?? []
  const heroBadge = sectionContent(sections, 'hero', DEFAULT_HERO_BADGE)
  const heroTitle = sectionHeading(sections, 'hero', DEFAULT_HERO_TITLE)
  const heroSubtitle = sectionSubheading(sections, 'hero', DEFAULT_HERO_SUBTITLE)
  const gettingStartedHeading = sectionHeading(sections, 'getting-started', DEFAULT_GETTING_STARTED_HEADING)
  const gettingStartedSubPre = sectionSubheading(sections, 'getting-started', DEFAULT_GETTING_STARTED_SUB_PRE)
  const gettingStartedSubPost = sectionContent(sections, 'getting-started', DEFAULT_GETTING_STARTED_SUB_POST)
  const gettingStartedLead = sectionContent(sections, 'getting-started-lead', DEFAULT_GETTING_STARTED_LEAD)

  const popularSearchItems = sectionItems(sections, 'popular-searches')
  const popularSearches = popularSearchItems.length > 0
    ? popularSearchItems.map(item => item.value || item.key).filter(Boolean)
    : DEFAULT_POPULAR_SEARCHES

  const categories = categoriesData ?? []
  const articles = articlesData?.articles ?? []
  const featuredArticles = featuredData?.articles ?? []

  const articleCountByCategoryId = new Map<string, number>()
  for (const article of articles) {
    const id = resolveHelpArticleCategoryId(article)
    if (!id) continue
    articleCountByCategoryId.set(id, (articleCountByCategoryId.get(id) ?? 0) + 1)
  }

  const sidebarGroups = buildCategoryGroups(categories, articles)

  return (
    <div className="container">
      <div className="grid grid-cols-24">
        <HelpSidebar groups={sidebarGroups} />
        <HelpContent
          heroBadge={heroBadge}
          heroTitle={heroTitle}
          heroSubtitle={heroSubtitle}
          popularSearches={popularSearches}
          categories={categories}
          featuredArticles={featuredArticles}
          gettingStartedHeading={gettingStartedHeading}
          gettingStartedSubPre={gettingStartedSubPre}
          gettingStartedSubPost={gettingStartedSubPost}
          gettingStartedLead={gettingStartedLead}
          articleCountByCategoryId={articleCountByCategoryId}
        />
      </div>
    </div>
  )
}
