import { useReducedMotion } from 'framer-motion'

/* ──────────────────────────────────────────────
 * RollingNumber
 *
 * A number whose digits roll into place when the section holding it comes into
 * view. Ten digits stacked in a column, the column translated by `-digit * 10%`
 * of its own height: nothing is measured, nothing runs per frame, and it lands
 * on the right glyph at any font size.
 *
 * The caller owns the trigger (`active`), so a section can start every number
 * it holds at the same moment.
 * ──────────────────────────────────────────── */

function RollingDigit({ digit, active, delayMs }: { digit: number; active: boolean; delayMs: number }) {
  const reduce = useReducedMotion()
  return (
    <span className="relative inline-block overflow-hidden align-bottom" style={{ height: '1em' }}>
      {/* Reserves the column's width without being visible. */}
      <span className="invisible">{digit}</span>
      <span
        className="absolute inset-x-0 top-0 flex flex-col will-change-transform"
        style={{
          transform: `translateY(-${(reduce || active ? digit : 0) * 10}%)`,
          transition: reduce ? undefined : `transform 1.6s cubic-bezier(.42,.08,.04,1) ${delayMs}ms`,
        }}
      >
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i}>{i}</span>
        ))}
      </span>
    </span>
  )
}

interface RollingNumberProps {
  /** Digits roll; everything else (a `+`, a `%`, a `.`) stays put. */
  value: string
  /** Flip to true when the number is on screen. */
  active: boolean
}

export default function RollingNumber({ value, active }: RollingNumberProps) {
  let digitIndex = 0
  return (
    <span className="inline-flex tabular-nums">
      {value.split('').map((char, i) => {
        if (char < '0' || char > '9') return <span key={i}>{char}</span>
        const delay = digitIndex++ * 90
        return <RollingDigit key={i} digit={Number(char)} active={active} delayMs={delay} />
      })}
    </span>
  )
}
