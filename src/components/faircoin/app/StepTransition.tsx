import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface StepTransitionProps {
  /**
   * Stable key for the current step. Changing the key triggers the exit/enter
   * animation. Prefer short string ids (e.g. 'amount', 'pay', 'done').
   */
  stepKey: string
  /**
   * Animation direction. `1` = forward (outgoing slides left, incoming enters
   * from the right). `-1` = backward (outgoing slides right, incoming enters
   * from the left). Parents set this right before updating `stepKey`.
   */
  direction: 1 | -1
  children: ReactNode
}

const VARIANTS = {
  enter: (dir: 1 | -1) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: 1 | -1) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
} as const

const TRANSITION = { duration: 0.3, ease: [0.32, 0.72, 0, 1] as const }

/**
 * Slides step content horizontally when `stepKey` changes.
 *
 * Forward (dir = 1): outgoing slides left + fades; incoming enters from the
 * right.
 * Backward (dir = -1): outgoing slides right + fades; incoming enters from
 * the left.
 *
 * Used by the `/buy` and `/unwrap` wizards to move between amount → pay →
 * status steps in a single `AppShell` frame.
 */
export default function StepTransition({
  stepKey,
  direction,
  children,
}: StepTransitionProps) {
  return (
    <AnimatePresence mode="wait" custom={direction} initial={false}>
      <motion.div
        key={stepKey}
        custom={direction}
        variants={VARIANTS}
        initial="enter"
        animate="center"
        exit="exit"
        transition={TRANSITION}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
