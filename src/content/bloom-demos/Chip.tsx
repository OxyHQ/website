import { Chip } from '@oxyhq/bloom/chip'
import type { ChipColor, ChipSize, ChipVariant } from '@oxyhq/bloom/chip'
import type { PlaygroundValues } from './_playground'

export const meta = {
  description: 'Compact, optionally interactive tags with semantic colors.',
}

export default function ChipDemo() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Chip>Default</Chip>
      <Chip color="primary">Primary</Chip>
      <Chip color="success" variant="soft">
        Success
      </Chip>
      <Chip color="warning" variant="outlined">
        Warning
      </Chip>
      <Chip color="error" onClose={() => undefined}>
        Closable
      </Chip>
      <Chip selected onPress={() => undefined}>
        Selected
      </Chip>
      <Chip disabled>Disabled</Chip>
    </div>
  )
}

export function Playground({ values }: { values: PlaygroundValues }) {
  const variant = values.variant as ChipVariant
  const color = values.color as ChipColor
  const size = values.size as ChipSize
  const selected = values.selected === true
  const disabled = values.disabled === true
  const label = typeof values.children === 'string' ? values.children : 'Chip'
  return (
    <Chip variant={variant} color={color} size={size} selected={selected} disabled={disabled}>
      {label}
    </Chip>
  )
}
