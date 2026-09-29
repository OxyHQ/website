import { Loading } from '@oxy.so/bloom/loading'
import type { LoadingSize } from '@oxy.so/bloom/loading'
import type { BloomTone } from '@oxy.so/bloom/appearance'
import type { PlaygroundValues } from './_playground'

export const meta = {
  description: 'Loading indicators — spinner, inline, and skeleton variants.',
}

export default function LoadingDemo() {
  return (
    <div className="flex flex-wrap items-center gap-8">
      <Loading variant="spinner" size="sm" />
      <Loading variant="spinner" size="md" />
      <Loading variant="spinner" size="lg" tone="neutral" />
      <Loading variant="inline" text="Loading…" />
    </div>
  )
}

export function Playground({ values }: { values: PlaygroundValues }) {
  const variant = values.variant === 'inline' ? 'inline' : 'spinner'
  const size = values.size as LoadingSize
  const tone = values.tone as BloomTone
  const text = typeof values.text === 'string' ? values.text : 'Loading…'
  if (variant === 'inline') {
    return <Loading variant="inline" size={size} tone={tone} text={text} />
  }
  return <Loading variant="spinner" size={size} tone={tone} text={text} showText />
}
