import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { mdxContentComponents } from '../../content/_components'
import UnderlineLink from './UnderlineLink'

/**
 * The article column, block by block.
 *
 * In the source layout every block of an article is its own grid child that
 * narrows as the viewport grows and is pulled back toward the contents column
 * past `xl`. Written out, that is:
 *
 *   layout-container-2xl                    → 1 / -1, then 1 / span 12 at sm
 *   lg:layout-container-xl                  → 5 / span 7
 *   xl:layout-container-lg                  → 5 / span 6, pulled 1/6 left
 *   3xl:layout-container-md (min-[120rem])  → 5 / span 5, pulled 1/10 left
 *
 * Keeping it as one string on every element (rather than wrapping the body in a
 * single column) is what preserves the original's measure at each breakpoint.
 *
 * The start is repeated at every breakpoint that changes the span on purpose:
 * `col-span-*` compiles to the `grid-column` shorthand, so a later `xl:col-span-6`
 * silently resets the `lg:col-start-5` before it and the block falls back to
 * auto placement (measured: 146px instead of 382px at 1440).
 */
export const ARTICLE_BLOCK =
  'col-span-full sm:col-span-12 sm:col-start-1 lg:col-start-5 lg:col-span-7 xl:col-start-5 xl:col-span-6 xl:-ms-[calc(100%/6)] xl:me-[calc(100%/6)] min-[120rem]:col-start-5 min-[120rem]:col-span-5 min-[120rem]:-ms-[calc(50%/5)] min-[120rem]:me-[calc(50%/5)]'

/**
 * Conclusions at the head of the article: one claim per row, separated by
 * hairlines rather than bullets, so the block reads as a summary table instead
 * of a list. The first row has no rule above it and no padding to match.
 */
function Takeaways({ children }: { children: ReactNode }) {
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
function Footnotes({ children }: { children: ReactNode }) {
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

/**
 * Spacing has exactly one owner per element, as in the source: headings carry
 * `pb-4` plus their own lead-in, and text blocks carry `mt-4` (dropped on the
 * first). The shared docs map is inherited for everything else — callouts,
 * images, code, tables — but its `mt-10`/`my-4` rhythm and `text-2xl` sizes are
 * overridden here, since stacking them on top of this produced ~100px of air
 * above every heading.
 */
export const articleMdxComponents = {
  ...mdxContentComponents,

  Takeaways,
  Footnotes,

  // `first-of-type`, not `first`: the contents nav is the article's first
  // child, so `first` never matches a heading and the opening section would
  // carry a full section lead-in it does not need. The opening heading keeps a
  // short lead-in below `lg`, where the contents collapse to a bar above it.
  h2: (props: ComponentPropsWithoutRef<'h2'>) => (
    <h2
      {...props}
      className={`${ARTICLE_BLOCK} scroll-m-20 pb-4 pt-16 first-of-type:pt-0 max-lg:first-of-type:pt-10 text-subheading-3`}
    />
  ),
  // A subsection that opens its section sits directly under the section
  // heading, which already carries the space between them.
  h3: (props: ComponentPropsWithoutRef<'h3'>) => (
    <h3 {...props} className={`${ARTICLE_BLOCK} scroll-m-20 pb-4 pt-10 [h2+&]:pt-0 text-body-1`} />
  ),
  h4: (props: ComponentPropsWithoutRef<'h4'>) => (
    <h4 {...props} className={`${ARTICLE_BLOCK} scroll-m-20 pb-4 pt-8 text-blog-body`} />
  ),

  p: (props: ComponentPropsWithoutRef<'p'>) => (
    <p {...props} className={`${ARTICLE_BLOCK} mt-4 first:mt-0 text-blog-body`} />
  ),
  ul: (props: ComponentPropsWithoutRef<'ul'>) => (
    <ul {...props} className={`${ARTICLE_BLOCK} mt-4 grid list-disc ps-5 text-blog-body leading-[140%]`} />
  ),
  ol: (props: ComponentPropsWithoutRef<'ol'>) => (
    <ol {...props} className={`${ARTICLE_BLOCK} mt-4 grid list-decimal ps-5 text-blog-body leading-[140%]`} />
  ),
  li: (props: ComponentPropsWithoutRef<'li'>) => <li {...props} className="mb-2 last:mb-0" />,
  // The shared map wraps a table in a plain div, which the article grid then
  // auto-places into whatever cell is free — for a table that meant the empty
  // column to the right of the text. It has to carry the block like everything
  // else, and scroll inside it rather than widening the page.
  table: (props: ComponentPropsWithoutRef<'table'>) => (
    <div className={`${ARTICLE_BLOCK} my-6 w-full overflow-x-auto border border-gray-a6`}>
      <table {...props} className="w-full text-b4" />
    </div>
  ),
  th: (props: ComponentPropsWithoutRef<'th'>) => (
    <th {...props} className="border-b border-gray-a6 px-4 py-2 text-start font-medium text-gray-a1" />
  ),
  td: (props: ComponentPropsWithoutRef<'td'>) => (
    <td {...props} className="border-b border-gray-a6 px-4 py-2 text-alt-gray-e1 last:text-gray-a1" />
  ),
  hr: (props: ComponentPropsWithoutRef<'hr'>) => <hr {...props} className={`${ARTICLE_BLOCK} my-8 border-gray-a6`} />,
  blockquote: (props: ComponentPropsWithoutRef<'blockquote'>) => (
    <blockquote {...props} className={`${ARTICLE_BLOCK} mt-4 border-s-2 border-gray-a6 ps-4 text-blog-body italic`} />
  ),

  // Prose links wipe their underline in on hover, like every other inline link
  // in this layout.
  a: ({ href = '', children }: ComponentPropsWithoutRef<'a'>) => <UnderlineLink href={href}>{children}</UnderlineLink>,
  sup: (props: ComponentPropsWithoutRef<'sup'>) => <sup {...props} className="ms-0.5 me-1" />,
}
