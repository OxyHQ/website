import { useState } from 'react'
import { Tabs, TabsTrigger } from '@oxy.so/bloom/tabs'
import { SurfaceLevelProvider } from '@oxy.so/bloom/styles'
import { useTheme } from '@oxy.so/bloom/theme'
import type { ArticleTabsProps } from './schema'
import type { ReactNode } from 'react'

/**
 * The interactive article tab strip, on Bloom's `Tabs` — which owns the
 * `tablist` name, the single tab stop and the arrow/Home/End keys.
 *
 * BROWSER ONLY. This module imports Bloom (react-native), which the prerender's
 * Node SSR bundle cannot load; `ArticleTabs` reaches it through `React.lazy`
 * behind a client-only switch, so the server bundle keeps this as a chunk it
 * never executes. Do not import it statically from anything `entry-server.tsx`
 * reaches.
 */
export default function ArticleTabsBloom({
  label,
  tabs,
  renderContent,
}: {
  label: string
  tabs: ArticleTabsProps['tabs']
  renderContent: (content: string) => ReactNode
}) {
  const { colors } = useTheme()
  const [activeId, setActiveId] = useState(tabs[0]?.id ?? '')
  const activeTab = tabs.find((tab) => tab.id === activeId) ?? tabs[0]

  return (
    // The section paints `bg-surface` (Bloom's `--surface`, `primaryLight` on
    // the JS theme); publishing it lets the strip's hover and thumb step off
    // the fill they actually sit on rather than off the page.
    <SurfaceLevelProvider level={1} fill={colors.primaryLight}>
      <div className="p-2">
        <Tabs variant="pill" label={label} value={activeTab?.id} onValueChange={setActiveId}>
          {tabs.map((tab) => <TabsTrigger key={tab.id} value={tab.id} label={tab.label} />)}
        </Tabs>
      </div>
      {activeTab && (
        // Bloom's triggers carry no DOM id to point `aria-labelledby` at, so
        // the panel is named by its tab's label directly.
        <div
          role="tabpanel"
          aria-label={activeTab.label}
          tabIndex={0}
          className="p-6 pt-4 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset sm:p-8 sm:pt-6"
        >
          {renderContent(activeTab.content)}
        </div>
      )}
    </SurfaceLevelProvider>
  )
}
