import { Button } from '@oxy.so/bloom/button'
import type { ButtonSize } from '@oxy.so/bloom/button'
import type { BloomAppearance, BloomTone } from '@oxy.so/bloom/appearance'
import type { PlaygroundValues } from './_playground'

export const meta = {
  description: 'Action button with appearances, tones and sizes.',
}

export default function ButtonDemo() {
  return (
    <div className="flex flex-wrap gap-3">
      <Button appearance="solid" tone="accent">Solid</Button>
      <Button appearance="outline" tone="neutral">Outline</Button>
      <Button appearance="subtle">Subtle</Button>
      <Button appearance="plain">Plain</Button>
      <Button appearance="solid" tone="accent" size="sm">
        Small
      </Button>
      <Button appearance="solid" tone="accent" disabled>
        Disabled
      </Button>
    </div>
  )
}

export function Playground({ values }: { values: PlaygroundValues }) {
  const appearance = values.appearance as BloomAppearance
  const tone = values.tone as BloomTone
  const size = values.size as ButtonSize
  const disabled = values.disabled === true
  const label = typeof values.children === 'string' ? values.children : 'Click me'
  return (
    <Button appearance={appearance} tone={tone} size={size} disabled={disabled}>
      {label}
    </Button>
  )
}
