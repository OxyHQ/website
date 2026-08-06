import type { ReactNode } from 'react'
import { useMediaQuery } from '../../../hooks/useMediaQuery'
import { useSiteHeaderBottom } from '../../../hooks/useSiteHeaderBottom'
import {
  FEED_FLEX,
  FRAMED_QUERY,
  PANEL_GUTTER,
  RAIL_QUERY,
  RAIL_WIDTH,
  SHELL_MAX_WIDTH,
  railStickyTop,
  stickyHeaderTop,
  stickyTabsTop,
} from './boardChrome'

interface BoardShellProps {
  /** The panel's own header row. Sticks at level 0. */
  header: ReactNode
  /** The tab bar, stacked under the header. Sticks at level 1. */
  tabs?: ReactNode
  /** The feed. */
  children: ReactNode
  /** The right rail. Not rendered below `RAIL_BREAKPOINT`. */
  rail?: ReactNode
}

/**
 * Mention's shell, reconciled with a site that already has a top navigation.
 *
 * A feed column that floats inside a background gutter, framed as a `bg-card`
 * panel with rounded top corners, next to a sticky rail. Below 500px the frame
 * is dropped and the panel runs to the edges; below 990px the rail is not
 * rendered at all, which is a mount gate rather than a `hidden` class so its
 * search input never exists twice in the document.
 */
export default function BoardShell({ header, tabs, children, rail }: BoardShellProps) {
  const framed = useMediaQuery(FRAMED_QUERY)
  const showRail = useMediaQuery(RAIL_QUERY)
  const headerBottom = useSiteHeaderBottom()

  return (
    <div className="flex w-full justify-center bg-background">
      {/* Bleed mask. The gutter between the site header and the panel is a
          window onto the feed, and rows scroll through it above the sticky
          chrome. Mention paints the same band for the same reason. Full width
          because everything at this height is page background anyway, and below
          the site header's own layer so it never covers the navigation. */}
      {framed && (
        <div
          aria-hidden
          className="fixed inset-x-0 z-10 bg-background"
          style={{ top: headerBottom, height: PANEL_GUTTER }}
        />
      )}
      <div
        className="flex w-full flex-row justify-between"
        style={{ maxWidth: SHELL_MAX_WIDTH }}
      >
        {/* The gutter: a band of page background around the floating panel.
            `pl-0` in Mention lets the panel meet the left rail flush; here the
            left edge is the page, so the gutter is symmetric on that side. */}
        <div
          className="min-w-0 bg-background"
          style={{ flex: showRail ? FEED_FLEX : 1, padding: framed ? PANEL_GUTTER : 0 }}
        >
          {/* No `overflow-hidden` here, deliberately. It would clip the rounded
              corners for free, and it would also make this element the sticky
              containing block for everything inside it: the chrome would then
              pin to a box that scrolls with the page, which looks exactly like
              sticky being ignored. The chrome masks the corners itself instead,
              with its own `bg-card` and `rounded-t-[28px]`, which is what
              Mention's `PanelStickyHeader` does and why it does it. */}
          <div className={framed ? 'rounded-t-[28px] border border-b-0 border-border bg-card' : 'bg-card'}>
            <div
              className={`sticky z-30 bg-card ${framed ? 'rounded-t-[28px]' : ''}`}
              style={{ top: stickyHeaderTop(headerBottom, framed) }}
            >
              {header}
            </div>
            {tabs && (
              <div className="sticky z-20 bg-card" style={{ top: stickyTabsTop(headerBottom, framed) }}>
                {tabs}
              </div>
            )}
            {children}
          </div>
        </div>

        {showRail && rail && (
          <aside
            className="shrink-0 self-start px-4"
            style={{ width: RAIL_WIDTH, position: 'sticky', top: railStickyTop(headerBottom) }}
          >
            {rail}
          </aside>
        )}
      </div>
    </div>
  )
}
