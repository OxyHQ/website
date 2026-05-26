import * as Skeleton from '@oxyhq/bloom/skeleton'
import type { PlaygroundValues } from './_playground'

export const meta = {
  description: 'Animated placeholder primitives for loading states.',
}

export default function SkeletonDemo() {
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <Skeleton.Row>
        <Skeleton.Circle size={48} />
        <Skeleton.Col style={{ flex: 1, gap: 8 }}>
          <Skeleton.Pill size={14} />
          <Skeleton.Pill size={12} style={{ width: '70%' }} />
        </Skeleton.Col>
      </Skeleton.Row>
      <Skeleton.Pill size={14} />
      <Skeleton.Pill size={14} style={{ width: '85%' }} />
      <Skeleton.Pill size={14} style={{ width: '60%' }} />
    </div>
  )
}

export function Playground({ values }: { values: PlaygroundValues }) {
  const lines = typeof values.lines === 'number' ? Math.max(1, Math.floor(values.lines)) : 3
  const lineHeight = typeof values.lineHeight === 'number' ? values.lineHeight : 14
  const avatar = values.avatar === true
  const rows: number[] = Array.from({ length: lines }, (_, i) => i)
  return (
    <div style={{ width: 320, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {avatar ? (
        <Skeleton.Row>
          <Skeleton.Circle size={lineHeight * 3} />
          <Skeleton.Col style={{ flex: 1, gap: 8 }}>
            <Skeleton.Pill size={lineHeight} />
            <Skeleton.Pill size={lineHeight - 2} style={{ width: '70%' }} />
          </Skeleton.Col>
        </Skeleton.Row>
      ) : null}
      {rows.map((i) => (
        <Skeleton.Pill key={i} size={lineHeight} style={{ width: `${100 - i * 10}%` }} />
      ))}
    </div>
  )
}
