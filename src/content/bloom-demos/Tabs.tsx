import { useState } from 'react'
import * as Tabs from '@oxyhq/bloom/tabs'
import type { PlaygroundValues } from './_playground'

type TabsVariant = 'underline' | 'filled' | 'outlined'

export const meta = {
  description: 'Horizontally-scrollable tab bar with three visual variants.',
}

export default function TabsDemo() {
  const [tab, setTab] = useState('overview')
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <Tabs.TabsBar value={tab} onValueChange={setTab} variant="underline">
        <Tabs.Tab value="overview" label="Overview" />
        <Tabs.Tab value="activity" label="Activity" />
        <Tabs.Tab value="settings" label="Settings" />
      </Tabs.TabsBar>
      <Tabs.TabPanel value={tab}>
        <div className="rounded-xl border border-border bg-surface p-4 text-sm text-foreground">
          You are viewing the {tab} panel.
        </div>
      </Tabs.TabPanel>
    </div>
  )
}

export function Playground({ values }: { values: PlaygroundValues }) {
  const variant = values.variant as TabsVariant
  const initial = typeof values.value === 'string' ? values.value : 'overview'
  const [tab, setTab] = useState(initial)
  const [lastInitial, setLastInitial] = useState(initial)
  if (initial !== lastInitial) {
    setLastInitial(initial)
    setTab(initial)
  }
  return (
    <div style={{ width: 360 }}>
      <Tabs.TabsBar value={tab} onValueChange={setTab} variant={variant}>
        <Tabs.Tab value="overview" label="Overview" />
        <Tabs.Tab value="activity" label="Activity" />
        <Tabs.Tab value="settings" label="Settings" />
      </Tabs.TabsBar>
    </div>
  )
}
