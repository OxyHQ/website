import type { ReactNode } from 'react'
import { ARTICLE_BLOCK } from './articleBlock'

/**
 * The two named blocks an article's MDX can call for, kept apart from the map
 * that hands them to MDX: a file that both defines components and exports
 * something that is not one loses fast refresh for every component in it.
 */

/**
 * Conclusions at the head of the article: one claim per row, separated by
 * hairlines rather than bullets, so the block reads as a summary table instead
 * of a list. The first row has no rule above it and no padding to match.
 */
export function Takeaways({ children }: { children: ReactNode }) {
  return (
    <section
      // The list inside is no longer a grid child, so it must drop the block's
      // own placement: `ARTICLE_BLOCK` ends in a negative inline-start margin
      // that only makes sense against a grid area, and against this section it
      // pulled every row a sixth of the column left of the heading above it.
      className={`${ARTICLE_BLOCK} flex w-full flex-col items-start [&_li]:mb-0 [&_li]:border-t [&_li]:border-gray-a6 [&_li]:py-2 [&_li]:first-of-type:border-t-0 [&_li]:first-of-type:pt-0 [&_li]:last-of-type:pb-0 [&_ul]:mt-0 [&_ul]:ms-0 [&_ul]:me-0 [&_ul]:w-full [&_ul]:list-none [&_ul]:ps-0 [&_ul]:text-blog-body`}
    >
      {children}
    </section>
  )
}

/**
 * Sources for the article, set below the body at the smallest step in the ramp.
 * The numbering is the list's own, so a note can be inserted without renumbering
 * anything by hand — the `#fnN` anchors a `<sup>` points at come from the same
 * order.
 */
export function Footnotes({ children }: { children: ReactNode }) {
  return (
    <div data-toc-skip className={`${ARTICLE_BLOCK} mt-10 grid w-full gap-y-16`}>
      <div className="grid grid-rows-[1fr_auto] gap-y-4 border-t border-t-gray-a8 pt-6 text-alt-gray-e1">
        <h3 className="text-body-3">Notes</h3>
        {/* Same reason as the takeaways: the list is inside this block now, so
            it drops the block's grid placement and negative pull. */}
        <div className="text-b4 [&_li]:mb-2 [&_li]:last:mb-0 [&_ol]:mt-0 [&_ol]:ms-0 [&_ol]:me-0 [&_ol]:w-full [&_ol]:ps-5 [&_ol]:text-b4 [&_p]:m-0">
          {children}
        </div>
      </div>
    </div>
  )
}
