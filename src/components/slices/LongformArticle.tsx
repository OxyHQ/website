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
      <section className="layout-px-large grid grid-cols-8 gap-x-2.5 sm:grid-cols-12 sm:gap-x-5 md:gap-x-6 items-end bg-gray-a10 pt-24 text-gray-a1 sm:pt-40 min-[120rem]:pt-30">
        <div className="col-span-full flex flex-col items-start sm:items-center sm:text-center">
          {(date || readingTime) && (
            <div className="max-w-[18rem] text-alt-gray-e2 sm:max-w-[80rem]">
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
          <h1 className="mt-6 max-w-[24em] text-subheading-1 text-[calc(var(--text-subheading-1)+2px)]">{title}</h1>
        </div>
      </section>

      <article className="layout-px-large grid grid-cols-8 gap-x-2.5 sm:grid-cols-12 sm:gap-x-5 md:gap-x-6 place-items-start bg-gray-a10 pb-24 pt-10 text-gray-a1 sm:pt-16 md:pb-32 2xl:pb-40">
        <ArticleToc entries={entries} pdfHref={pdfHref} />

        {children}

        {cta && (
          <div
            data-toc-skip
            className={`${ARTICLE_BLOCK} mt-8 flex w-full flex-col items-start gap-8 border-y border-gray-a6 py-16 lg:mt-16`}
          >
            {/* An `h3` on purpose: the closing band is not a section of the
                document, and a heading level below the body's keeps it out of
                both the outline and the contents list. */}
            <h3 className="max-w-125 text-heading-3">{cta.title}</h3>
            <PillButton href={cta.href} external={cta.external} size="lg">
              {cta.label}
            </PillButton>
          </div>
        )}
      </article>
    </div>
  )
}
