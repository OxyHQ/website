/**
 * The article column, block by block.
 *
 * In the source layout every block of an article is its own grid child that
 * narrows as the viewport grows and is pulled back toward the contents column
 * past `xl`. Written out, that is:
 *
 *   layout-container-2xl                    → 1 / -1, then 1 / span 12 at sm
 *   lg:layout-container-xl                  → 4 / span 8
 *   xl:layout-container-lg                  → 4 / span 8
 *   3xl:layout-container-md (min-[120rem])  → 4 / span 8
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
  'col-span-full sm:col-span-12 sm:col-start-1 lg:col-start-4 lg:col-span-8 xl:col-start-4 xl:col-span-8 min-[120rem]:col-start-4 min-[120rem]:col-span-8'
