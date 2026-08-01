import { useCallback, useState, type ReactNode } from 'react'
import ArticleToc, { type TocEntry } from './ArticleToc'
import PillButton from './PillButton'
import { ARTICLE_BLOCK } from './articleMdxComponents'

interface LongformArticleProps {
  title: string
  /** Shown above the title, separated by a dot: e.g. "March 25, 2026". */
  date?: string
  /** e.g. "30 Minute Read". */
  readingTime?: string
  pdfHref?: string
  children: ReactNode
  /** Closing band under the body. */
  cta?: { title: string; label: string; href: string; external?: boolean }
}

/** Slugs a heading the same way an anchor would, so the id survives a re-render. */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

/**
 * A long document: pinned contents on the left, body in the measure column.
 *
 * The contents are read off the rendered headings rather than passed in, so a
 * page keeps its copy in one place (the MDX file) and cannot drift out of sync
 * with its own navigation. A callback ref does the read — it runs after the
 * body has committed, and re-runs if the body is swapped.
 */
export default function LongformArticle({ title, date, readingTime, pdfHref, children, cta }: LongformArticleProps) {
  const [entries, setEntries] = useState<TocEntry[]>([])

  const bodyRef = useCallback((node: HTMLElement | null) => {
    if (!node) return
    // The closing band and the notes carry headings of their own; neither is a
    // section of the document, so both opt out with `data-toc-skip`.
    const headings = Array.from(node.querySelectorAll<HTMLElement>('h2, h3, h4')).filter(
      (heading) => heading.closest('[data-toc-skip]') === null,
    )
    setEntries(
      headings.map((heading) => {
        const label = heading.textContent?.trim() ?? ''
        // Anchors need an id; give the heading one when the source has none.
        if (!heading.id) heading.id = slugify(label)
        return { id: heading.id, label, level: Number(heading.tagName.slice(1)) }
      }),
    )
  }, [])

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

      <article ref={bodyRef} className="layout-px-large grid grid-cols-8 gap-x-2.5 sm:grid-cols-12 sm:gap-x-5 md:gap-x-6 place-items-start bg-gray-a10 pb-24 pt-10 text-gray-a1 sm:pt-16 md:pb-32 2xl:pb-40">
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
