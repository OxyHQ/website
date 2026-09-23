import type { ReactNode } from 'react'
import { Tabs, TabsTrigger } from '@oxy.so/bloom/tabs'
import { BloomSelectionKeys } from '../../ui/BloomSelectionKeys'
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
        <h1 className="truncate text-body-md font-semibold leading-tight text-foreground">{title}</h1>
        {subtitle && <p className="truncate text-body-xs leading-tight text-muted-foreground">{subtitle}</p>}
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
 * The tab bar, stacked directly under the header: Bloom's underline `Tabs`,
 * spread edge to edge so the tabs split the row evenly. An underline rather
 * than a filled pill because the row is chrome, not content, and a filled tab
 * competes with the feed underneath it. Bloom draws the baseline that used to
 * be this row's bottom border.
 */
export function PanelTabs({ label, tabs, active, onSelect }: {
  /** The tab list's accessible name. */
  label: string
  tabs: readonly PanelTab[]
  active: string
  onSelect: (key: string) => void
}) {
  return (
    <BloomSelectionKeys item="tab" label={label} className="flex flex-col justify-end" style={{ height: PANEL_TABBAR_HEIGHT }}>
      <Tabs value={active} onValueChange={onSelect} fullWidth>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.key} value={tab.key} label={tab.label} />
        ))}
      </Tabs>
    </BloomSelectionKeys>
  )
}
