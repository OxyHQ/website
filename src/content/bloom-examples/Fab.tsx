import { Fab } from '@oxy.so/bloom/fab'

export default function FabExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <Fab accessibilityLabel="Create new item" label="Create" />
    </div>
  )
}
