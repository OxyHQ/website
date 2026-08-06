/* ──────────────────────────────────────────────
 * RollingNumber
 *
 * The odometer from the source template, unchanged in mechanism: each digit is
 * a column holding `0…9` with the target digit pinned one height below it, and
 * the column translates up by exactly its own height. The number of cycles
 * listed above the target is what makes a digit spin longer or shorter, so the
 * effect is tuned by content rather than by timing.
 *
 * The caller owns the trigger, so every number in a section starts together.
 * ──────────────────────────────────────────── */

interface RollingDigitProps {
  digit: number
  /** Extra full cycles before landing, so neighbouring digits do not spin alike. */
  cycles: number
  active: boolean
}

function RollingDigit({ digit, cycles, active }: RollingDigitProps) {
  const reel: number[] = []
  for (let cycle = 0; cycle < cycles; cycle += 1) {
    for (let i = 0; i < 10; i += 1) reel.push(i)
  }
  for (let i = 0; i < digit; i += 1) reel.push(i)

  return (
    <div className="relative inline-block">
      {/* Holds the column's width; the reel itself is out of flow. */}
      <span className="invisible inline-block">{digit}</span>
      <span
        className={`absolute left-0 top-0 flex flex-col transition-transform delay-300 duration-[2000ms] ease-[cubic-bezier(.42,.08,.04,1)] motion-reduce:-translate-y-full motion-reduce:duration-0 ${
          active ? '-translate-y-full' : ''
        }`}
      >
        {reel.map((value, i) => (
          <span key={i}>{value}</span>
        ))}
        <span className="absolute bottom-0 translate-y-full">{digit}</span>
      </span>
    </div>
  )
}

interface RollingNumberProps {
  /** Digits roll; `$`, `+`, `k`, `.` and the rest stay put. */
  value: string
  active: boolean
}

export default function RollingNumber({ value, active }: RollingNumberProps) {
  let digitIndex = 0
  return (
    <div className="overflow-hidden whitespace-nowrap tracking-tighter">
      {value.split('').map((char, i) => {
        if (char < '0' || char > '9') {
          return (
            <span key={i} className="inline-block">
              {char}
            </span>
          )
        }
        const cycles = digitIndex++ === 0 ? 1 : 2
        return <RollingDigit key={i} digit={Number(char)} cycles={cycles} active={active} />
      })}
    </div>
  )
}
