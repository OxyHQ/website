import { useRef } from 'react'
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import HomiioPropertyCard from './HomiioPropertyCard'
import { HOMIIO_LISTINGS } from './data'

interface Pt {
  x: number
  y: number
  rot: number
}

/**
 * One continuous ribbon of cards: it runs in from one edge, winds (almost) all
 * the way around a loop in the middle and runs out the other edge. The loop is
 * left open a few degrees at the bottom so the strand entering and the strand
 * leaving are different points — no card ever lands on top of another at a seam.
 * The whole ribbon slides along itself as you scroll.
 */
const EDGE = 1180 // each tail reaches past the viewport edge
const R_LOOP = 205
// Loop opening / tail tilt (rad). Big enough that the entry strand and the exit
// strand are > a card apart at the bottom, so they only graze (like the wheel)
// instead of stacking — at the cost of a shallow tilt on the tails.
const BETA = 0.26
const LOOP_ARC = (2 * Math.PI - 2 * BETA) * R_LOOP
const DS = 4
const PATH_LEN = 2 * EDGE + LOOP_ARC

const heading = (s: number) => {
  if (s < EDGE) return BETA
  if (s < EDGE + LOOP_ARC) return BETA + ((2 * Math.PI - 2 * BETA) * (s - EDGE)) / LOOP_ARC
  return 2 * Math.PI - BETA
}

const PATH: Pt[] = (() => {
  const pts: Pt[] = []
  let x = 0
  let y = 0
  for (let s = 0; s <= PATH_LEN; s += DS) {
    const th = heading(s)
    pts.push({ x, y: -y, rot: (-th * 180) / Math.PI }) // negate → loop bulges upward
    x += Math.cos(th) * DS
    y += Math.sin(th) * DS
  }
  const xs = pts.map((p) => p.x)
  const ys = pts.map((p) => p.y)
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2
  return pts.map((p) => ({ ...p, x: p.x - cx, y: p.y - cy }))
})()

function pointAt(s: number): Pt {
  const m = ((s % PATH_LEN) + PATH_LEN) % PATH_LEN
  return PATH[Math.min(PATH.length - 1, Math.round(m / DS))]
}

const COUNT = Math.round(PATH_LEN / 122) // ≈ card-width spacing (overlap, no gaps)
const STEP = PATH_LEN / COUNT // exact divisor → seamless
const TRAVEL = 720

function FlowCard({ index, progress }: { index: number; progress: MotionValue<number> }) {
  const transform = useTransform(progress, (v) => {
    const p = pointAt(index * STEP + v * TRAVEL)
    return `translate(-50%, -50%) translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) rotate(${p.rot.toFixed(1)}deg) scale(0.9)`
  })
  return (
    <motion.div className="absolute left-0 top-0" style={{ transform }}>
      <HomiioPropertyCard listing={HOMIIO_LISTINGS[index % HOMIIO_LISTINGS.length]} />
    </motion.div>
  )
}

export default function HomiioSpiral() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  return (
    <section ref={ref} className="relative overflow-hidden bg-[#FFF7D8] py-[7vh]">
      <div className="relative mx-auto flex h-[clamp(440px,62vh,720px)] items-center justify-center">
        <div className="relative h-0 w-0 scale-[0.5] sm:scale-75 lg:scale-100">
          {Array.from({ length: COUNT }, (_, i) => (
            <FlowCard key={i} index={i} progress={scrollYProgress} />
          ))}
        </div>
      </div>
    </section>
  )
}
