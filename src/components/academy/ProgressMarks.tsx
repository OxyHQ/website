import { MeterRing } from '@oxy.so/bloom/stat-bar'
import { RiCheckboxCircleFill } from '@oxy.so/bloom/icons/RiCheckboxCircleFill'
import { RiCheckboxBlankCircleLine } from '@oxy.so/bloom/icons/RiCheckboxBlankCircleLine'
import type { LessonStatus } from './progressStorage'

/* ──────────────────────────────────────────────
 * The Academy's two progress glyphs.
 *
 * Both are DECORATIVE: every place that draws one also says the state in
 * words (a visible `n/m`, or the visually-hidden status from
 * `useStatusLabel`), so the glyph is never the only carrier of the state and a
 * screen reader is not told it twice.
 * ──────────────────────────────────────────── */


/** A lesson's state: a filled check, a half ring, or an empty circle. */
export function LessonStatusMark({ status, size = 18 }: { status: LessonStatus; size?: number }) {
  if (status === 'completed') {
    return (
      <span aria-hidden="true" className="inline-flex text-primary">
        <RiCheckboxCircleFill width={size} height={size} fill="currentColor" />
      </span>
    )
  }
  if (status === 'in-progress') {
    return (
      <span aria-hidden="true" className="inline-flex">
        <MeterRing value={0.5} size={size - 2} thickness={2.5} cap="butt" accessibilityLabel="" />
      </span>
    )
  }
  return (
    <span aria-hidden="true" className="inline-flex text-muted-foreground">
      <RiCheckboxBlankCircleLine width={size} height={size} fill="currentColor" />
    </span>
  )
}

/** A course's state: a filled check once done, otherwise a ring filled to the share of lessons completed. */
export function CourseProgressRing({ completed, total, size = 18 }: { completed: number; total: number; size?: number }) {
  if (total > 0 && completed === total) return <LessonStatusMark status="completed" size={size} />
  return (
    <span aria-hidden="true" className="inline-flex">
      <MeterRing value={completed} max={Math.max(total, 1)} size={size - 2} thickness={2.5} cap="butt" accessibilityLabel="" />
    </span>
  )
}
