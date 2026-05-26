import { useState } from 'react'
import { Switch } from '@oxyhq/bloom/switch'
import type { PlaygroundValues } from './_playground'

export const meta = {
  description: 'Two-state toggle with default and compact sizes.',
}

export default function SwitchDemo() {
  const [wifi, setWifi] = useState(true)
  const [bluetooth, setBluetooth] = useState(false)
  return (
    <div className="flex flex-col gap-4">
      <label className="flex items-center justify-between gap-6 text-sm text-foreground">
        Wi-Fi
        <Switch value={wifi} onValueChange={setWifi} />
      </label>
      <label className="flex items-center justify-between gap-6 text-sm text-foreground">
        Bluetooth (sm)
        <Switch value={bluetooth} onValueChange={setBluetooth} size="sm" />
      </label>
      <label className="flex items-center justify-between gap-6 text-sm text-muted-foreground">
        Airplane mode
        <Switch value={false} onValueChange={() => undefined} disabled />
      </label>
    </div>
  )
}

export function Playground({ values }: { values: PlaygroundValues }) {
  const initial = values.value === true
  const size = values.size === 'sm' ? 'sm' : 'default'
  const disabled = values.disabled === true
  const [on, setOn] = useState(initial)
  const [lastInitial, setLastInitial] = useState(initial)
  if (initial !== lastInitial) {
    setLastInitial(initial)
    setOn(initial)
  }
  return <Switch value={on} onValueChange={setOn} size={size} disabled={disabled} />
}
