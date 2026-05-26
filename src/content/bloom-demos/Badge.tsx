import { Badge } from '@oxyhq/bloom/badge'
import type { BadgeColor, BadgeSize, BadgeVariant } from '@oxyhq/bloom/badge'
import type { PlaygroundValues } from './_playground'

export const meta = {
  description: 'Status indicator and counter, dot or content-based.',
}

export default function BadgeDemo() {
  return (
    <div className="flex flex-wrap items-center gap-6">
      <Badge content="New" color="primary" />
      <Badge content={3} color="error" />
      <Badge content="Beta" variant="outlined" color="info" />
      <Badge content="Success" variant="subtle" color="success" />
      <Badge dot color="warning" />
    </div>
  )
}

export function Playground({ values }: { values: PlaygroundValues }) {
  const variant = values.variant as BadgeVariant
  const color = values.color as BadgeColor
  const size = values.size as BadgeSize
  const content = typeof values.content === 'string' ? values.content : ''
  const dot = values.dot === true
  return <Badge content={dot ? undefined : content} variant={variant} color={color} size={size} dot={dot} />
}
