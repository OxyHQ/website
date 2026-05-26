import { Loading } from '@oxyhq/bloom/loading'
import type { LoadingSize } from '@oxyhq/bloom/loading'
import type { PlaygroundValues } from './_playground'

export const meta = {
  description: 'Loading indicators — spinner, inline, and skeleton variants.',
}

export default function LoadingDemo() {
  return (
    <div className="flex flex-wrap items-center gap-8">
      <Loading variant="spinner" size="small" />
      <Loading variant="spinner" size="medium" />
      <Loading variant="spinner" size="large" />
      <Loading variant="inline" text="Loading…" />
    </div>
  )
}

export function Playground({ values }: { values: PlaygroundValues }) {
  const variant = values.variant === 'inline' ? 'inline' : 'spinner'
  const size = values.size as LoadingSize
  const text = typeof values.text === 'string' ? values.text : 'Loading…'
  if (variant === 'inline') {
    return <Loading variant="inline" size={size} text={text} />
  }
  return <Loading variant="spinner" size={size} text={text} showText />
}
