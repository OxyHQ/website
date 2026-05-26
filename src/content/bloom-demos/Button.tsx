import { Button, PrimaryButton, SecondaryButton, GhostButton, TextButton } from '@oxyhq/bloom/button'
import type { ButtonSize, ButtonVariant } from '@oxyhq/bloom/button'
import type { PlaygroundValues } from './_playground'

export const meta = {
  description: 'Primary action button with variants and sizes.',
}

export default function ButtonDemo() {
  return (
    <div className="flex flex-wrap gap-3">
      <PrimaryButton>Primary</PrimaryButton>
      <SecondaryButton>Secondary</SecondaryButton>
      <GhostButton>Ghost</GhostButton>
      <TextButton>Text</TextButton>
      <Button variant="primary" size="small">
        Small
      </Button>
      <Button variant="primary" disabled>
        Disabled
      </Button>
    </div>
  )
}

export function Playground({ values }: { values: PlaygroundValues }) {
  const variant = values.variant as ButtonVariant
  const size = values.size as ButtonSize
  const disabled = values.disabled === true
  const label = typeof values.children === 'string' ? values.children : 'Click me'
  return (
    <Button variant={variant} size={size} disabled={disabled}>
      {label}
    </Button>
  )
}
