/**
 * The board's panel geometry, in one place.
 *
 * These are Mention's numbers, read out of
 * `packages/frontend/components/shell/PanelChrome.tsx` and
 * `app/(app)/_layout.tsx` rather than eyeballed, so the two products frame a
 * feed the same way. They live here for the same reason they live there: the
 * gutter and the header height are used by the shell, by both sticky tiers and
 * by the scroll padding, and a literal repeated in four places is a literal
 * that will disagree with itself.
 *
 * WHAT IS DELIBERATELY DIFFERENT. Mention owns its whole viewport and pins its
 * chrome 8px from the top of it. This site does not: it has a fixed `Navbar`
 * above everything, and a third vertical rail inside a page that already has
 * top navigation would be two navigations arguing. So the shell keeps the site
 * header and drops Mention's left rail, and every sticky offset below is
 * measured from the bottom of that header instead of from the viewport top.
 * That is the one reconciliation; the proportions, the widths, the gutter, the
 * corner radius and the two-tier chrome are Mention's.
 */

/** Gutter between the floating panel and everything around it, in px. */
export const PANEL_GUTTER = 8

/** Height of the panel's own header row, in px. */
export const PANEL_HEADER_HEIGHT = 48

/** Height of the tab bar that stacks under the header, in px. */
export const PANEL_TABBAR_HEIGHT = 42

/** Widest the feed column and the rail get together, in px. */
export const SHELL_MAX_WIDTH = 950

/** Right rail width, in px. */
export const RAIL_WIDTH = 350

/** The feed column's share of the shell. The rail takes what is left. */
export const FEED_FLEX = 2.2

/** Below this width the panel goes full bleed and loses its rounded frame. */
export const FRAME_BREAKPOINT = 500

/** Below this width the right rail is not rendered at all. */
export const RAIL_BREAKPOINT = 990

export const FRAMED_QUERY = `(min-width: ${FRAME_BREAKPOINT}px)`
export const RAIL_QUERY = `(min-width: ${RAIL_BREAKPOINT}px)`

/**
 * The three sticky offsets, all measured from the bottom of the site header
 * (`useSiteHeaderBottom`) rather than from the viewport top.
 *
 * The site header is `position: fixed` and therefore out of flow, so a sticky
 * child pinned at 0 slides under it. `--site-header-height` cannot supply the
 * number either: it reads 46px while the header renders 59px on desktop and
 * 55px on a phone, and the header additionally moves down by up to 40px while
 * the promo banner scrolls away.
 */

/** `top` for the panel's header row. Level 0 of the two-tier chrome. */
export function stickyHeaderTop(headerBottom: number, framed: boolean): number {
  return headerBottom + (framed ? PANEL_GUTTER : 0)
}

/** `top` for the tab bar, stacked directly under the header. Level 1. */
export function stickyTabsTop(headerBottom: number, framed: boolean): number {
  return stickyHeaderTop(headerBottom, framed) + PANEL_HEADER_HEIGHT
}

/** `top` for the right rail, which pins as a whole below the site header. */
export function railStickyTop(headerBottom: number): number {
  return headerBottom + PANEL_GUTTER
}
