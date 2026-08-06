import type { ReactNode } from 'react'
import { PANEL_HEADER_HEIGHT, PANEL_TABBAR_HEIGHT } from './boardChrome'

/**
 * The panel's header row: a title on the left, one action on the right.
 *
 * Fixed height rather than padded content, because the tab bar below it pins at
 * exactly this height. If the header could grow, the two tiers would overlap
 * the moment a title wrapped.
 */
export function PanelHeader({ title, subtitle, action }: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div
      className="flex items-center justify-between gap-3 border-b border-border px-4"
      style={{ height: PANEL_HEADER_HEIGHT }}
    >
      <div className="min-w-0">
        <h1 className="truncate text-[15px] font-semibold leading-tight text-foreground">{title}</h1>
        {subtitle && <p className="truncate text-[12px] leading-tight text-muted-foreground">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export interface PanelTab {
  key: string
  label: string
}

/**
 * The tab bar, stacked directly under the header. Tabs share a row and split it
 * evenly, with the active one carrying a short underline rather than a filled
 * pill: the row is chrome, not content, and a filled tab competes with the feed
 * underneath it.
 */
export function PanelTabs({ tabs, active, onSelect }: {
  tabs: readonly PanelTab[]
  active: string
  onSelect: (key: string) => void
}) {
  return (
    <div
      className="flex border-b border-border"
      style={{ height: PANEL_TABBAR_HEIGHT }}
      role="tablist"
    >
      {tabs.map((tab) => {
        const selected = tab.key === active
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={selected}
            onClick={() => onSelect(tab.key)}
            className={`relative flex flex-1 cursor-pointer items-center justify-center text-[14px] font-medium transition-colors ${
              selected ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            {selected && (
              <span className="absolute bottom-0 h-[3px] w-14 rounded-full bg-primary" aria-hidden />
            )}
          </button>
        )
      })}
    </div>
  )
}
