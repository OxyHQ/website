import { useEffect, useRef, useState } from 'react'

interface AnimatedNumberProps {
  /** Numeric value to display. Pass `null` to render the placeholder. */
  value: number | null
  /** Number of decimals to show in the rendered output. */
  decimals?: number
  /** Format with thousands separators when true (default). */
  thousands?: boolean
  /** Suffix appended after the number (e.g. "FAIR"). */
  suffix?: string
  /** Prefix before the number (e.g. "$"). */
  prefix?: string
  /** Placeholder shown while value is null. */
  placeholder?: string
  /** Animation duration in ms. */
  durationMs?: number
}

/**
 * Smoothly animates between numeric values with an ease-out interpolation.
 *
 * Renders as a `<span>` so the parent controls typography. The component
 * intentionally drives a `requestAnimationFrame` loop rather than a setState
 * cadence — ensures the count-up matches the display refresh rate.
 *
 * Updating `value` triggers a fresh tween from the previously-rendered
 * number, so when polling delivers a new chain tip the number visibly counts
 * up rather than snapping.
 */
export default function AnimatedNumber({
  value,
  decimals = 0,
  thousands = true,
  suffix,
  prefix,
  placeholder = '—',
  durationMs = 800,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState<number | null>(value)
  const startRef = useRef<number | null>(null)
  const fromRef = useRef<number>(value ?? 0)
  const toRef = useRef<number | null>(value)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (value === null) {
      setDisplay(null)
      return
    }
    fromRef.current = display ?? value
    toRef.current = value
    startRef.current = null

    const tick = (ts: number) => {
      if (startRef.current === null) startRef.current = ts
      const elapsed = ts - startRef.current
      const t = Math.min(1, elapsed / durationMs)
      const eased = 1 - (1 - t) ** 3 // ease-out cubic
      const from = fromRef.current
      const to = toRef.current
      if (to === null) return
      const next = from + (to - from) * eased
      setDisplay(next)
      if (t < 1) {
        rafRef.current = window.requestAnimationFrame(tick)
      }
    }
    rafRef.current = window.requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current)
    }
    // We intentionally omit `display` from deps — it would cancel the tween.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, durationMs])

  if (display === null) {
    return <span>{placeholder}</span>
  }

  const formatted = display.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: thousands,
  })
  return (
    <span className="tabular-nums">
      {prefix}
      {formatted}
      {suffix ? <span className="ml-1.5 text-xs font-medium text-muted-foreground">{suffix}</span> : null}
    </span>
  )
}
