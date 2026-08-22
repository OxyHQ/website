import type { ReactNode } from 'react'
import ArticleToc, { type TocEntry } from './ArticleToc'
import PillButton from './PillButton'
import { ARTICLE_BLOCK } from './articleBlock'

interface LongformArticleProps {
  title: string
  /** Contents, in document order. Comes from the MDX module's own headings. */
  entries: TocEntry[]
  /** Shown above the title, separated by a dot: e.g. "March 25, 2026". */
  date?: string
  /** e.g. "30 Minute Read". */
  readingTime?: string
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
export default function LongformArticle({ title, entries, date, readingTime, pdfHref, children, cta }: LongformArticleProps) {
  return (
    <div className="relative">
      <section className="w-full bg-[color-mix(in_srgb,var(--primary)_14%,var(--background))] text-foreground">
        <div className="container grid grid-cols-8 items-end gap-x-2.5 pt-24 sm:grid-cols-12 sm:gap-x-5 sm:pt-40 md:gap-x-6 min-[120rem]:pt-30">
          <div className="col-span-full flex flex-col items-start sm:items-center sm:text-center">
            {(date || readingTime) && (
              <div className="max-w-[18rem] text-tertiary sm:max-w-[80rem]">
                {date}
                {date && readingTime && <span className="mx-1.5 inline-block size-1.5 bg-current align-middle" />}
                {readingTime}
              </div>
            )}
            {/* Two pixels over `subheading-1`: the article title is the one place
                the source design steps outside its own ramp.

                The cap is in `em`, so it is a measure rather than a width: it
                holds the same ~60 characters per line whatever size the heading
                scales to, instead of letting a title run the full frame on a
                wide screen and collapse to one very long line. */}
            <h1 className="mt-6 max-w-[24em] text-primary text-subheading-1 text-[calc(var(--text-subheading-1)+2px)]">{title}</h1>
          </div>
        </div>
      </section>

      <article className="w-full bg-[color-mix(in_srgb,var(--primary)_6%,var(--background))] text-foreground">
        <div className="container grid grid-cols-8 place-items-start gap-x-2.5 pb-24 pt-10 sm:grid-cols-12 sm:gap-x-5 sm:pt-16 md:gap-x-6 md:pb-32 2xl:pb-40">
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
