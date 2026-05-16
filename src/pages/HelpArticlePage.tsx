import { useParams, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ArrowLeft, ArrowRight, ThumbsDown, ThumbsUp } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import KeepUpToDateSection from '../components/sections/KeepUpToDateSection'
import { FEATURES } from '../constants'
import {
  useHelpArticle,
  useHelpArticles,
  resolveHelpArticleCategoryId,
  resolveHelpArticleCategoryLabel,
  type HelpArticleRecord,
} from '../api/hooks'

/* ── Canonical-layout helpers (mirror CourseDetailPage) ── */

function DashedHLine() {
  return (
    <svg width="100%" height="1" className="text-border">
      <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
    </svg>
  )
}

function DashedVLines({ height = 'h-5' }: { height?: string }) {
  return (
    <div className={`grid w-full grid-cols-12 overflow-hidden ${height}`}>
      <div className="col-[2/-2] flex justify-between">
        <svg width="1" height="100%" className="text-border">
          <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
        </svg>
        <svg width="1" height="100%" className="text-border">
          <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
        </svg>
        <svg width="1" height="100%" className="text-border">
          <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  )
}

function coverImageUrl(field: HelpArticleRecord['coverImage']): string {
  if (!field) return ''
  if (typeof field === 'string') return field
  return field.url || field.thumbnails?.lg || field.thumbnails?.md || ''
}

interface SiblingNav {
  prev: HelpArticleRecord | null
  next: HelpArticleRecord | null
}

function pickSiblings(siblings: HelpArticleRecord[], currentSlug: string): SiblingNav {
  const sorted = [...siblings].sort((a, b) => a.order - b.order)
  const index = sorted.findIndex(s => s.slug === currentSlug)
  if (index === -1) return { prev: null, next: null }
  return {
    prev: index > 0 ? sorted[index - 1] : null,
    next: index < sorted.length - 1 ? sorted[index + 1] : null,
  }
}

export default function HelpArticlePage() {
  const { slug } = useParams<{ slug: string }>()
  const slugParam = slug ?? ''
  const { data: article, isLoading } = useHelpArticle(slugParam)
  const categoryId = article ? resolveHelpArticleCategoryId(article) : ''
  const { data: siblingsData } = useHelpArticles(
    categoryId ? { category: categoryId, limit: 100 } : { limit: 100 },
  )

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-muted-foreground">Loading…</div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!article) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SEO
          title="Help article not found"
          description="The help article you are looking for does not exist."
          canonicalPath={`/help/${slugParam}`}
          noIndex
        />
        <Navbar />
        <main className="flex flex-1 flex-col items-center justify-center gap-4">
          <h1 className="text-2xl font-semibold text-foreground">Help article not found</h1>
          <Link to="/help" className="text-sm text-primary hover:underline">
            Back to Help Center
          </Link>
        </main>
        <Footer />
      </div>
    )
  }

  const cover = coverImageUrl(article.coverImage)
  const categoryLabel = resolveHelpArticleCategoryLabel(article)
  const siblings = siblingsData?.articles ?? []
  const { prev, next } = pickSiblings(siblings, article.slug)

  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <SEO
        title={article.title}
        description={article.summary || `${article.title} — Oxy Help Center`}
        canonicalPath={`/help/${article.slug}`}
        ogImage={cover || undefined}
        ogType="article"
      />
      <Navbar />
      <main>
        {/* ═══ Hero ═══ */}
        <section className="container">
          <div className="lg:border-border lg:border-x">
            <DashedHLine />
            <DashedVLines />

            <div className="grid grid-cols-12 pt-28 pb-16 max-xl:pt-24 max-lg:pt-20">
              <div className="col-[2/-2]">
                <Link
                  to="/help"
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Back to Help Center
                </Link>

                {/* Breadcrumbs */}
                <nav className="mt-6 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground" aria-label="Breadcrumb">
                  <Link to="/help" className="transition-colors hover:text-foreground">Help</Link>
                  {categoryLabel && (
                    <>
                      <span aria-hidden="true">/</span>
                      <span>{categoryLabel}</span>
                    </>
                  )}
                  <span aria-hidden="true">/</span>
                  <span className="truncate text-foreground">{article.title}</span>
                </nav>

                <div className="mt-8 flex flex-col items-start gap-4">
                  {categoryLabel && (
                    <span className="inline-block rounded-full border border-border bg-background px-3 py-1.5 text-[13px]/[1.4em] font-medium text-muted-foreground">
                      {categoryLabel}
                    </span>
                  )}
                  <h1 className="max-w-[18em] text-balance text-heading-responsive-lg">
                    {article.title}
                  </h1>
                  {article.summary && (
                    <p className="max-w-2xl text-pretty text-lg text-muted-foreground lg:text-xl">
                      {article.summary}
                    </p>
                  )}
                  {article.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {article.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {cover && (
              <div className="grid grid-cols-12 pb-12">
                <div className="col-[2/-2]">
                  <img
                    src={cover}
                    alt=""
                    className="w-full rounded-2xl object-cover"
                    style={{ aspectRatio: '16 / 7' }}
                    loading="eager"
                    decoding="async"
                  />
                </div>
              </div>
            )}

            <DashedVLines />
          </div>
        </section>

        {/* ═══ Body ═══ */}
        {article.content && (
          <section className="container">
            <div className="border-border border-x">
              <DashedHLine />
              <div className="grid grid-cols-12">
                <div className="col-[2/-2] py-16 max-lg:py-12">
                  <article className="prose prose-neutral dark:prose-invert mx-auto max-w-[720px] prose-headings:font-semibold prose-headings:tracking-tight prose-h2:mt-10 prose-h2:mb-4 prose-h2:text-2xl prose-h3:mt-8 prose-h3:mb-3 prose-p:leading-[1.8] prose-p:text-secondary-foreground prose-li:text-secondary-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-code:rounded prose-code:bg-surface prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:before:content-none prose-code:after:content-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{article.content}</ReactMarkdown>
                  </article>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ═══ Was this helpful? ═══ */}
        {FEATURES.SHOW_ARTICLE_FEEDBACK && (
          <section className="container">
            <div className="border-border border-x">
              <DashedHLine />
              <div className="grid grid-cols-12">
                <div className="col-[2/-2] py-12 max-lg:py-10">
                  <div className="mx-auto flex max-w-[720px] flex-col items-center gap-4 text-center">
                    <p className="text-sm font-medium text-foreground">Was this article helpful?</p>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-medium text-muted-foreground transition-colors hover:border-input hover:text-foreground"
                        aria-label="Mark this article as helpful"
                      >
                        <ThumbsUp className="size-4" aria-hidden="true" />
                        Yes
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-medium text-muted-foreground transition-colors hover:border-input hover:text-foreground"
                        aria-label="Mark this article as not helpful"
                      >
                        <ThumbsDown className="size-4" aria-hidden="true" />
                        No
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ═══ Prev / Next ═══ */}
        {(prev || next) && (
          <section className="container">
            <div className="border-border border-x">
              <DashedHLine />
              <div className="grid grid-cols-12">
                <div className="col-[2/-2] py-12 max-lg:py-10">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {prev ? (
                      <Link
                        to={`/help/${prev.slug}`}
                        className="group flex flex-col gap-1 rounded-2xl border border-border bg-background p-5 transition-colors hover:border-input hover:bg-surface"
                      >
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          <ArrowLeft className="size-3.5" aria-hidden="true" />
                          Previous
                        </span>
                        <span className="text-base font-semibold text-foreground">{prev.title}</span>
                      </Link>
                    ) : (
                      <div aria-hidden="true" />
                    )}
                    {next ? (
                      <Link
                        to={`/help/${next.slug}`}
                        className="group flex flex-col items-end gap-1 rounded-2xl border border-border bg-background p-5 text-right transition-colors hover:border-input hover:bg-surface sm:col-start-2"
                      >
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Next
                          <ArrowRight className="size-3.5" aria-hidden="true" />
                        </span>
                        <span className="text-base font-semibold text-foreground">{next.title}</span>
                      </Link>
                    ) : (
                      <div aria-hidden="true" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        <KeepUpToDateSection />
      </main>
      <Footer />
    </div>
  )
}
