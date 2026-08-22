import type { ReactNode } from 'react'
import ArticleListenControl from '../newsroom/article/ArticleListenControl'
import ShareLinkButton from '../newsroom/article/ShareLinkButton'
import ArticleToc, { type TocEntry } from './ArticleToc'
import PillButton from './PillButton'
import { ARTICLE_BLOCK } from './articleBlock'

interface LongformArticleProps {
  title: string
  eyebrow?: string
  description?: string
  /** Contents, in document order. Comes from the MDX module's own headings. */
  entries: TocEntry[]
  /** Shown above the title, separated by a dot: e.g. "March 25, 2026". */
  date?: string
  /** e.g. "30 Minute Read". */
  readingTime?: string
  locale: string
  shareUrl: string
  pdfHref?: string
  children: ReactNode
  /** Closing band under the body. */
  cta?: { title: string; label: string; href: string; external?: boolean }
}

/**
 * A long document: pinned contents on the left, body in the measure column.
 *
 * The contents are data, not a reading of the rendered page: the MDX module
 * exports its own headings (see `scripts/vite-mdx-headings.ts`), so the list is
 * complete on the first paint and after a client-side navigation into a body
 * that is still loading, which a DOM scan cannot manage without watching for
 * the lazy module to land.
 */
export default function LongformArticle({
  title,
  eyebrow,
  description,
  entries,
  date,
  readingTime,
  locale,
  shareUrl,
  pdfHref,
  children,
  cta,
}: LongformArticleProps) {
  return (
    <div className="relative">
      <section className="w-full bg-[color-mix(in_srgb,var(--primary)_14%,var(--background))] text-foreground">
        <div className="container grid grid-cols-8 items-end gap-x-2.5 pt-24 sm:grid-cols-12 sm:gap-x-5 sm:pt-32 md:gap-x-6">
          <div className="col-span-full flex flex-col items-start sm:items-center sm:text-center">
            {(date || eyebrow || readingTime) && (
              <div className="flex max-w-[20rem] flex-wrap justify-start gap-x-4 gap-y-1 text-body-sm text-muted-foreground sm:max-w-[80rem] sm:justify-center">
                {date && <span>{date}</span>}
                {eyebrow && <span className="text-primary">{eyebrow}</span>}
                {readingTime && <span>{readingTime}</span>}
              </div>
            )}
            <h1 className="mt-8 max-w-[24em] text-balance text-primary text-subheading-1">{title}</h1>
            {description && (
              <p className="mt-6 max-w-[46rem] text-balance text-foreground text-body-1">{description}</p>
            )}
          </div>

          <div className="col-span-full mt-16 flex items-center justify-between gap-3 border-t border-border pt-3 lg:col-start-4 lg:col-span-6">
            <ArticleListenControl
              title={title}
              resume={description ?? ''}
              content=""
              locale={locale}
              contentRootId="company-article-body"
              durationLabel={readingTime?.match(/\d+/)?.[0] ? `${readingTime.match(/\d+/)?.[0]}:00` : undefined}
            />
            <ShareLinkButton url={shareUrl} />
          </div>
        </div>
      </section>

      <article className="w-full bg-[color-mix(in_srgb,var(--primary)_6%,var(--background))] text-foreground">
        <div id="company-article-body" data-article-body className="container grid grid-cols-8 place-items-start gap-x-2.5 pb-24 pt-10 sm:grid-cols-12 sm:gap-x-5 sm:pt-16 md:gap-x-6 md:pb-32 2xl:pb-40">
          <ArticleToc entries={entries} pdfHref={pdfHref} />

          {children}

          {cta && (
            <div
              data-toc-skip
              className={`${ARTICLE_BLOCK} mt-12 grid w-full grid-cols-1 items-center gap-4 rounded-full bg-primary px-6 py-4 text-primary-foreground sm:grid-cols-[1fr_auto] sm:gap-8 lg:mt-16`}
            >
              <div className="flex min-w-0 flex-col gap-1">
                {/* An `h3` on purpose: the closing band is not a section of the
                    document, and a heading level below the body's keeps it out of
                    both the outline and the contents list. */}
                <h3 className="text-primary-foreground text-subheading-2">{cta.title}</h3>
              </div>
              <PillButton
                href={cta.href}
                external={cta.external}
                size="md"
                className="!bg-tertiary !text-tertiary-foreground hover:!bg-tertiary/90"
              >
                {cta.label}
              </PillButton>
            </div>
          )}
        </div>
      </article>
    </div>
  )
}
