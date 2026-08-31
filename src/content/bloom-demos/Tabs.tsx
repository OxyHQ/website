import { useState } from 'react'
import { Tabs, TabsTrigger } from '@oxyhq/bloom/tabs'
import type { PlaygroundValues } from './_playground'

type TabsVariant = 'underline' | 'filled' | 'outlined'

export const meta = {
  description: 'Horizontally-scrollable tab bar with three visual variants.',
}

export default function TabsDemo() {
  const [tab, setTab] = useState('overview')
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <Tabs value={tab} onValueChange={setTab} variant="underline">
        <TabsTrigger value="overview" label="Overview" />
        <TabsTrigger value="activity" label="Activity" />
        <TabsTrigger value="settings" label="Settings" />
      </Tabs>
      {/*
        The panel is plain markup driven by the same state. `TabsContent` reads
        the context `Tabs` provides, and `Tabs` provides it only to its own
        children — which it lays out as a horizontal strip, so a panel nested
        there renders beside the triggers rather than under them.
      */}
      <div className="rounded-xl border border-border bg-surface p-4 text-sm text-foreground">
        You are viewing the {tab} panel.
      </div>
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
      <Tabs value={tab} onValueChange={setTab} variant={variant}>
        <TabsTrigger value="overview" label="Overview" />
        <TabsTrigger value="activity" label="Activity" />
        <TabsTrigger value="settings" label="Settings" />
      </Tabs>
    </div>
  )
}
