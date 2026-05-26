import { Divider } from '@oxyhq/bloom/divider'
import type { PlaygroundValues } from './_playground'

export const meta = {
  description: 'Thin horizontal or vertical rule used to separate content groups.',
}

export default function DividerDemo() {
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="text-sm text-foreground">Above</div>
      <Divider />
      <div className="text-sm text-foreground">Between</div>
      <Divider thickness={2} />
      <div className="text-sm text-foreground">Below</div>
    </div>
  )
}

export function Playground({ values }: { values: PlaygroundValues }) {
  const thickness = typeof values.thickness === 'number' ? values.thickness : 1
  const vertical = values.vertical === true
  const spacing = typeof values.spacing === 'number' ? values.spacing : 8
  if (vertical) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', height: 80, gap: 8 }}>
        <span style={{ color: 'var(--bloom-color-text, currentColor)' }}>Left</span>
        <Divider vertical thickness={thickness} spacing={spacing} />
        <span style={{ color: 'var(--bloom-color-text, currentColor)' }}>Right</span>
      </div>
    )
  }
  return (
    <div style={{ width: 280 }}>
      <div className="text-sm text-foreground">Above</div>
      <Divider thickness={thickness} spacing={spacing} />
      <div className="text-sm text-foreground">Below</div>
    </div>
  )
}
