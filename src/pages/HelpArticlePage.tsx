import { Suspense, createElement } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MDXProvider } from '@mdx-js/react'
import { ArrowLeft, ArrowRight, ThumbsDown, ThumbsUp } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import PageSection from '../components/layout/PageSection'
import KeepUpToDateSection from '../components/sections/KeepUpToDateSection'
import { FEATURES } from '../constants'
import { useCurrentLocale } from '../contexts/LocaleContext'
import { loadHelpBySlug, loadHelpSiblings, HELP_CATEGORIES } from '../content/help-loader'
import { mdxContentComponents } from '../content/_components'

/* ──────────────────────────────────────────────
 * /help/* — single help-center article
 *
 * Reads MDX from `src/content/help/**` via the help-loader. URL slug is the
 * full path segment under `/help/` (e.g. `account/add-recovery-email`),
 * matched here via the react-router splat param.
 *
 * Locale falls back to English when no translation exists for the requested
 * locale — `loadHelpBySlug` handles the picking.
 * ──────────────────────────────────────────── */

function categoryLabelForId(id: string): string {
  const meta = HELP_CATEGORIES.find((c) => c.id === id)
  return meta?.label ?? ''
}

export default function HelpArticlePage() {
  const params = useParams<{ '*': string }>()
  const locale = useCurrentLocale()
  const slug = (params['*'] ?? '').replace(/\/+$/, '')
  const entry = loadHelpBySlug(slug, locale)

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
  const categoryLabel = categoryLabelForId(frontmatter.category)
  const { prev, next } = loadHelpSiblings(slug, locale)
  const cover = frontmatter.coverImage ?? ''

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
          <div className="relative mx-auto flex max-w-4xl flex-col items-start gap-4 px-6 pt-28 pb-12 lg:px-8 lg:pt-40">
            <Link
              to="/help"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to Help Center
            </Link>

            {/* Breadcrumbs */}
            <nav className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground" aria-label="Breadcrumb">
              <Link to="/help" className="transition-colors hover:text-foreground">Help</Link>
              {categoryLabel && (
                <>
                  <span aria-hidden="true">/</span>
                  <span>{categoryLabel}</span>
                </>
              )}
              <span aria-hidden="true">/</span>
              <span className="truncate text-foreground">{frontmatter.title}</span>
            </nav>

            {categoryLabel && (
              <span className="mt-4 inline-block rounded-full border border-border bg-background px-3 py-1.5 text-[13px]/[1.4em] font-medium text-muted-foreground">
                {categoryLabel}
              </span>
            )}
            <h1 className="max-w-[18em] text-balance text-4xl font-medium tracking-tight text-foreground md:text-5xl lg:text-6xl">
              {frontmatter.title}
            </h1>
            {frontmatter.description && (
              <p className="max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl">
                {frontmatter.description}
              </p>
            )}
            {frontmatter.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {frontmatter.tags.map((tag) => (
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
        </section>

        {/* ═══ Cover ═══ */}
        {cover && (
          <PageSection spacing="sm">
            <img
              src={cover}
              alt=""
              className="w-full rounded-3xl object-cover"
              style={{ aspectRatio: '16 / 7' }}
              loading="eager"
              decoding="async"
            />
          </PageSection>
        )}

        {/* ═══ Body (MDX) ═══ */}
        <PageSection spacing="md" width="narrow">
          <article className="text-foreground">
            <MDXProvider components={mdxContentComponents}>
              <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
                {createElement(Component)}
              </Suspense>
            </MDXProvider>
          </article>
        </PageSection>

        {/* ═══ Was this helpful? ═══ */}
        {FEATURES.SHOW_ARTICLE_FEEDBACK && (
          <PageSection spacing="sm" tone="surface" width="narrow">
            <div className="flex flex-col items-center gap-4 text-center">
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
                  <span className="text-base font-semibold text-foreground">{prev.frontmatter.title}</span>
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
                  <span className="text-base font-semibold text-foreground">{next.frontmatter.title}</span>
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
