import type { CourseLevel } from '../../content/academy-courses'

/* ──────────────────────────────────────────────
 * Academy course cover fallback
 *
 * When a course does not ship a `coverImage` field, the listing/detail/lesson
 * pages render a deterministic gradient + monogram instead of a generic flat
 * square. The gradient is chosen by hashing the course slug so the same
 * course always gets the same palette, but different courses are visually
 * distinct.
 *
 * Each palette mixes three stops (from → via → to) from Bloom's chart family,
 * whose hues are built to stay apart from one another: violet, ocean, sunset,
 * mint and so on. The cover carries `.force-light`, so the stops are the
 * palette's mid-tones in either theme and its `background` is the light glass
 * the overlays are drawn in.
 * ──────────────────────────────────────────── */

export interface CourseGradient {
  from: string
  via: string
  to: string
}

/* Fixed palette ordered for visual contrast between adjacent courses. */
const GRADIENTS: CourseGradient[] = [
  { from: 'from-chart-5-active', via: 'via-chart-1-active', to: 'to-chart-1' },
  { from: 'from-chart-5', via: 'via-chart-9', to: 'to-chart-4' },
  { from: 'from-chart-6', via: 'via-chart-2', to: 'to-chart-7' },
  { from: 'from-chart-4-active', via: 'via-chart-9-active', to: 'to-chart-9' },
  { from: 'from-foreground', via: 'via-muted-foreground', to: 'to-chart-1-active' },
  { from: 'from-chart-5-active', via: 'via-primary', to: 'to-chart-1-active' },
  { from: 'from-chart-6-active', via: 'via-chart-6', to: 'to-chart-2' },
  { from: 'from-chart-8', via: 'via-chart-8-active', to: 'to-chart-4-active' },
]

function hashSlug(slug: string): number {
  let h = 0
  for (let i = 0; i < slug.length; i += 1) {
    h = (h << 5) - h + slug.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

/** Stable colour ramp for a course's slug. */
export function courseGradient(slug: string): CourseGradient {
  const index = hashSlug(slug) % GRADIENTS.length
  return GRADIENTS[index] ?? GRADIENTS[0]
}

/** Two-letter monogram for the course cover fallback. */
export function courseInitials(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return 'OX'
  if (words.length === 1) {
    const w = words[0] ?? ''
    return w.slice(0, 2).toUpperCase()
  }
  const first = (words[0] ?? '').charAt(0)
  const second = (words[1] ?? '').charAt(0)
  return (first + second).toUpperCase()
}

/** Shared level label + status-dot colour, reused across the academy pages. */
export const COURSE_LEVELS: Record<CourseLevel, { label: string; dot: string }> = {
  beginner: { label: 'Beginner', dot: 'bg-success' },
  intermediate: { label: 'Intermediate', dot: 'bg-warning' },
  advanced: { label: 'Advanced', dot: 'bg-error' },
}
