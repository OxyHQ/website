import type { CourseLevel } from '../../content/academy-loader'

/* ──────────────────────────────────────────────
 * Academy course cover fallback
 *
 * When a course does not ship a `coverImage` field, the listing/detail/lesson
 * pages render a deterministic gradient + monogram instead of a generic flat
 * square. The gradient is chosen by hashing the course slug so the same
 * course always gets the same palette, but different courses are visually
 * distinct.
 *
 * Each palette mixes three Tailwind colour stops (from → via → to). The
 * palettes are tuned to feel "branded": warm sunset, deep ocean, fresh
 * mint, etc. They all sit on darker backgrounds with white-glass overlays
 * so light text remains readable.
 * ──────────────────────────────────────────── */

export interface CourseGradient {
  from: string
  via: string
  to: string
}

/* Fixed palette ordered for visual contrast between adjacent courses. */
const GRADIENTS: CourseGradient[] = [
  { from: 'from-indigo-600', via: 'via-violet-600', to: 'to-fuchsia-600' },
  { from: 'from-sky-600', via: 'via-cyan-600', to: 'to-teal-500' },
  { from: 'from-rose-500', via: 'via-orange-500', to: 'to-amber-500' },
  { from: 'from-emerald-600', via: 'via-teal-600', to: 'to-cyan-700' },
  { from: 'from-slate-800', via: 'via-zinc-700', to: 'to-stone-600' },
  { from: 'from-blue-700', via: 'via-indigo-700', to: 'to-purple-800' },
  { from: 'from-pink-600', via: 'via-rose-500', to: 'to-red-500' },
  { from: 'from-lime-600', via: 'via-green-600', to: 'to-emerald-700' },
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
  beginner: { label: 'Beginner', dot: 'bg-emerald-500' },
  intermediate: { label: 'Intermediate', dot: 'bg-amber-500' },
  advanced: { label: 'Advanced', dot: 'bg-rose-500' },
}
