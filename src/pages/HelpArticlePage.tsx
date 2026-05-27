import { Suspense, createElement, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MDXProvider } from '@mdx-js/react'
import { ArrowLeft, ArrowRight, Calendar, Clock, ThumbsDown, ThumbsUp } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import PageSection from '../components/layout/PageSection'
import KeepUpToDateSection from '../components/sections/KeepUpToDateSection'
import { useCurrentLocale } from '../lib/i18n'
import {
  loadHelpBySlug,
  loadHelpSiblings,
  loadHelpByCategory,
  HELP_CATEGORIES,
  type HelpEntry,
} from '../content/help-loader'
import { mdxContentComponents } from '../content/_components'
import ShareWithMention from '../components/social/ShareWithMention'
import HelpProductBadge from '../components/help/HelpProductBadge'
import HelpArticleTOC from '../components/help/HelpArticleTOC'

/* ──────────────────────────────────────────────
 * /help/* — single help-center article
 *
 * Two-column layout: sticky table of contents on the left, prose
 * article on the right. Mobile collapses the TOC into a "Jump to"
 * select. Header shows the ecosystem product the article covers via
 * a `HelpProductBadge`, plus breadcrumb, last-updated date, and an
 * estimated read time derived from the frontmatter description +
 * heading count (the body lazy-loads so we approximate).
 *
 * Helpful feedback buttons and a "Related articles" rail land below
 * the article. Related articles surface up to three siblings in the
 * same category.
 * ──────────────────────────────────────────── */

const HELP_BODY_SELECTOR = '[data-help-body]'
const WORDS_PER_MINUTE = 200
const RELATED_LIMIT = 3

function categoryMetaForId(id: string) {
  return HELP_CATEGORIES.find((c) => c.id === id) ?? null
}

/**
 * Estimate read time in minutes from the article's frontmatter +
 * description. Since the MDX body is lazy-loaded, we cannot read
 * its rendered text synchronously — instead we lean on the
 * description length as a proxy plus a per-article floor of 2 min.
 */
function estimateReadTimeMinutes(entry: HelpEntry): number {
  const description = entry.frontmatter.description ?? ''
  const descriptionWords = description.trim().split(/\s+/).filter(Boolean).length
  // Description is usually ~10-30 words; multiply by 12 as a rough
  // proxy for the full article body so short descriptions still get
  // a reasonable 2-3 min estimate and longer ones scale up.
  const approxBodyWords = Math.max(200, descriptionWords * 12)
  return Math.max(2, Math.ceil(approxBodyWords / WORDS_PER_MINUTE))
}

function formatUpdatedDate(iso: string | undefined, locale: string): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

interface FeedbackButtonsProps {
  articleSlug: string
}

function FeedbackButtons({ articleSlug }: FeedbackButtonsProps) {
  // Local UI-only state — analytics wiring is intentionally deferred.
  // Resetting on slug change is handled by React's `key` propagation
  // higher up (article page is keyed by slug on the MDX Suspense).
  const [vote, setVote] = useState<'up' | 'down' | null>(null)

  if (vote !== null) {
    return (
      <div
        className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface px-6 py-6 text-center"
        role="status"
        aria-live="polite"
      >
        <p className="text-sm font-medium text-foreground">
          {vote === 'up'
            ? 'Thanks — glad this helped.'
            : 'Thanks for letting us know. We will keep improving this article.'}
        </p>
        <Link
          to="/help"
          className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          data-help-feedback-article={articleSlug}
        >
          Back to Help Center
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface px-6 py-6 text-center">
      <p className="text-sm font-medium text-foreground">Was this article helpful?</p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setVote('up')}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-medium text-muted-foreground transition-colors hover:border-input hover:text-foreground"
          aria-label="Mark this article as helpful"
        >
          <ThumbsUp className="size-4" aria-hidden="true" />
          Yes
        </button>
        <button
          type="button"
          onClick={() => setVote('down')}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-medium text-muted-foreground transition-colors hover:border-input hover:text-foreground"
          aria-label="Mark this article as not helpful"
        >
          <ThumbsDown className="size-4" aria-hidden="true" />
          No
        </button>
      </div>
    </div>
  )
}

export default function HelpArticlePage() {
  const params = useParams<{ '*': string }>()
  const locale = useCurrentLocale()
  const slug = (params['*'] ?? '').replace(/\/+$/, '')
  const entry = loadHelpBySlug(slug, locale)

  // Hooks must be unconditional. Compute derived values up front
  // and gate on `entry` in the render path only.
  const categoryMeta = entry ? categoryMetaForId(entry.frontmatter.category) : null
  const { prev, next } = useMemo(
    () => (entry ? loadHelpSiblings(slug, locale) : { prev: null, next: null }),
    [entry, slug, locale],
  )
  const related = useMemo<HelpEntry[]>(() => {
    if (!entry) return []
    return loadHelpByCategory(entry.frontmatter.category, locale)
      .filter((sibling) => sibling.slug !== entry.slug)
      .slice(0, RELATED_LIMIT)
  }, [entry, locale])

  if (!entry) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SEO
          title="Help article not found"
          description="The help article you are looking for does not exist."
          canonicalPath={`/help/${slug}`}
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

  const { frontmatter, Component } = entry
  const cover = frontmatter.coverImage ?? ''
  const updatedLabel = formatUpdatedDate(frontmatter.updated, locale)
  const readMinutes = estimateReadTimeMinutes(entry)
  const categoryLabel = categoryMeta?.label ?? ''

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEO
        title={frontmatter.title}
        description={frontmatter.description}
        canonicalPath={`/help/${entry.slug}`}
        ogImage={cover || undefined}
        ogType="article"
      />
      <Navbar />
      <main>
        {/* ═══ Hero ═══ */}
        <section className="relative">
          <div className="relative mx-auto flex max-w-5xl flex-col items-start gap-4 px-6 pt-28 pb-10 lg:px-8 lg:pt-36">
            <Link
              to="/help"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to Help Center
            </Link>

            {/* Breadcrumb */}
            <nav
              className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"
              aria-label="Breadcrumb"
            >
              <Link to="/" className="transition-colors hover:text-foreground">
                Home
              </Link>
              <span aria-hidden="true">/</span>
              <Link to="/help" className="transition-colors hover:text-foreground">
                Help
              </Link>
              {categoryLabel && categoryMeta && (
                <>
                  <span aria-hidden="true">/</span>
                  <Link
                    to={`/help#${categoryMeta.id}`}
                    className="transition-colors hover:text-foreground"
                  >
                    {categoryLabel}
                  </Link>
                </>
              )}
              <span aria-hidden="true">/</span>
              <span className="truncate text-foreground">{frontmatter.title}</span>
            </nav>

            {/* Eyebrow: product badge */}
            {categoryMeta && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5">
                <HelpProductBadge category={categoryMeta.id} label={categoryMeta.label} size="sm" />
              </div>
            )}

            <h1 className="max-w-[18em] text-balance text-4xl font-medium tracking-tight text-foreground md:text-5xl">
              {frontmatter.title}
            </h1>
            {frontmatter.description && (
              <p className="max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
                {frontmatter.description}
              </p>
            )}

            {/* Meta row: read time + updated date */}
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5" aria-hidden="true" />
                {readMinutes} min read
              </span>
              {updatedLabel && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="size-3.5" aria-hidden="true" />
                  Updated {updatedLabel}
                </span>
              )}
              {frontmatter.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {frontmatter.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-surface px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ═══ Cover ═══ */}
        {cover && (
          <PageSection spacing="sm" width="wide">
            <img
              src={cover}
              alt=""
              className="mx-auto w-full max-w-5xl rounded-3xl object-cover"
              style={{ aspectRatio: '16 / 7' }}
              loading="eager"
              decoding="async"
            />
          </PageSection>
        )}

        {/* ═══ Two-column body: TOC + article ═══ */}
        <section className="mx-auto max-w-6xl px-6 lg:px-8 py-12 md:py-16">
          <div className="grid gap-10 lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[16rem_minmax(0,1fr)] xl:gap-16">
            {/* Sticky TOC + mobile select */}
            <aside>
              <HelpArticleTOC scanKey={entry.slug} bodySelector={HELP_BODY_SELECTOR} />
            </aside>

            {/* Article body */}
            <article
              data-help-body
              className="min-w-0 text-foreground [&_h2]:scroll-mt-24 [&_h3]:scroll-mt-24"
            >
              <MDXProvider components={mdxContentComponents}>
                <Suspense
                  fallback={<div className="text-sm text-muted-foreground">Loading…</div>}
                >
                  {createElement(Component)}
                </Suspense>
              </MDXProvider>
            </article>
          </div>
        </section>

        {/* ═══ Was this helpful? ═══ */}
        <PageSection spacing="sm" width="narrow">
          <FeedbackButtons articleSlug={entry.slug} />
        </PageSection>

        {/* ═══ Share ═══ */}
        <PageSection spacing="sm" width="narrow">
          <ShareWithMention
            title={frontmatter.title}
            url={`https://oxy.so/help/${entry.slug}`}
            hashtags={frontmatter.tags.length > 0 ? frontmatter.tags : ['help']}
            via="oxy"
          />
        </PageSection>

        {/* ═══ Related articles ═══ */}
        {related.length > 0 && (
          <PageSection spacing="md" width="wide">
            <div className="mx-auto max-w-5xl">
              <div className="mb-6 flex items-end justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                    Related articles
                  </h2>
                  {categoryLabel && (
                    <p className="text-sm text-muted-foreground">More from {categoryLabel}.</p>
                  )}
                </div>
                {categoryMeta && (
                  <Link
                    to={`/help#${categoryMeta.id}`}
                    className="inline-flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    See all
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((article) => (
                  <Link
                    key={article.slug}
                    to={`/help/${article.slug}`}
                    className="group flex flex-col gap-3 rounded-2xl border border-border bg-background p-5 transition-colors hover:border-input hover:bg-surface"
                  >
                    {categoryMeta && (
                      <HelpProductBadge
                        category={categoryMeta.id}
                        label={categoryMeta.label}
                        size="sm"
                      />
                    )}
                    <h3 className="text-base font-semibold text-foreground">
                      {article.frontmatter.title}
                    </h3>
                    <p className="line-clamp-3 text-sm text-muted-foreground transition-colors group-hover:text-foreground">
                      {article.frontmatter.description}
                    </p>
                    <span className="mt-auto inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                      Read article
                      <ArrowRight className="size-3.5" aria-hidden="true" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </PageSection>
        )}

        {/* ═══ Prev / Next ═══ */}
        {(prev || next) && (
          <PageSection spacing="md" width="narrow">
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
                  <span className="text-base font-semibold text-foreground">
                    {prev.frontmatter.title}
                  </span>
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
                  <span className="text-base font-semibold text-foreground">
                    {next.frontmatter.title}
                  </span>
                </Link>
              ) : (
                <div aria-hidden="true" />
              )}
            </div>
          </PageSection>
        )}

        <KeepUpToDateSection />
      </main>
      <Footer />
    </div>
  )
}
