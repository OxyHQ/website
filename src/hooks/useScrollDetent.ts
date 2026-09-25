import { useEffect, type RefObject } from 'react'

/** Distance from the stop, in px, within which a resting page is drawn onto it. */
const PULL_ZONE = 220
/** How long scrolling must be still before the pull kicks in. */
const SETTLE_MS = 140
/** Duration of the pull onto the stop. */
const PULL_MS = 420
/** Wheel travel, in px, the visitor must push against the stop to break through. */
const RELEASE_THRESHOLD = 360
/** Furthest the page gives under that push, approached but never reached. */
const MAX_STRETCH = 90
/** How fast pushed-but-abandoned travel drains away, in px per ms. */
const LEAK_PER_MS = 0.3
/** After landing, inertia that carried the visitor here cannot count as pushing. */
const LANDING_GRACE_MS = 350

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

/**
 * A magnet on the element's bottom edge. Scrolling that comes to rest near the
 * point where that edge meets the bottom of the viewport is drawn onto it.
 * Wheel scrolling down meets resistance there: the page gives a little under
 * the push and springs back when it stops, and breaks through only when the
 * push is kept up. Scrolling back above the stop re-arms it.
 *
 * The pull applies to every input; the resistance to the wheel only, since
 * holding back a finger fights the platform's own touch physics.
 */
export function useScrollDetent(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    let armed = true
    let holding = false
    let pushed = 0
    let lastPushAt = 0
    let landedAt = 0
    let touching = false
    let settleTimer = 0
    let animFrame = 0
    let animating = false

    const stopAt = () => {
      const el = ref.current
      if (!el) return null
      const top = el.getBoundingClientRect().bottom + window.scrollY - window.innerHeight
      // A stop inside the first screen would pin the page on load.
      return top > 0 ? Math.round(top) : null
    }

    const jump = (top: number) => window.scrollTo({ top, behavior: 'instant' })

    const cancelAnim = () => {
      if (animFrame) cancelAnimationFrame(animFrame)
      animFrame = 0
      animating = false
    }

    const glideTo = (to: number) => {
      cancelAnim()
      const from = window.scrollY
      if (Math.abs(to - from) < 1) return
      const start = performance.now()
      animating = true
      const step = (now: number) => {
        const t = Math.min((now - start) / PULL_MS, 1)
        jump(from + (to - from) * easeOutCubic(t))
        if (t < 1) animFrame = requestAnimationFrame(step)
        else cancelAnim()
      }
      animFrame = requestAnimationFrame(step)
    }

    const settle = () => {
      if (touching) return
      const target = stopAt()
      if (target === null) return
      if (holding) {
        // The push was let go before it broke through: spring back.
        holding = false
        pushed = 0
        glideTo(target)
        return
      }
      if (Math.abs(window.scrollY - target) <= PULL_ZONE) glideTo(target)
    }

    const scheduleSettle = () => {
      window.clearTimeout(settleTimer)
      settleTimer = window.setTimeout(settle, SETTLE_MS)
    }

    const onWheel = (event: WheelEvent) => {
      cancelAnim()
      scheduleSettle()
      if (!armed || event.deltaY <= 0 || event.ctrlKey) return
      const target = stopAt()
      if (target === null) return
      const y = window.scrollY
      const now = performance.now()

      if (!holding) {
        if (y > target + 1 || y + event.deltaY <= target) return
        // This step would cross the stop: land on it instead.
        event.preventDefault()
        holding = true
        pushed = 0
        lastPushAt = now
        landedAt = now
        jump(target)
        return
      }

      event.preventDefault()
      if (now - landedAt < LANDING_GRACE_MS) return
      pushed = Math.max(0, pushed - (now - lastPushAt) * LEAK_PER_MS) + event.deltaY
      lastPushAt = now
      if (pushed >= RELEASE_THRESHOLD) {
        holding = false
        armed = false
        pushed = 0
        return
      }
      // The page gives under the push, less the harder it is pushed.
      jump(target + MAX_STRETCH * (1 - Math.exp(-pushed / (RELEASE_THRESHOLD / 2))))
    }

    const onScroll = () => {
      const target = stopAt()
      if (target !== null && window.scrollY < target - 1) armed = true
      if (!animating) scheduleSettle()
    }

    const onTouchStart = () => {
      touching = true
      cancelAnim()
      window.clearTimeout(settleTimer)
    }
    const onTouchEnd = () => {
      touching = false
      scheduleSettle()
    }
    // A key or a scrollbar drag outranks the magnet.
    const onUserInput = () => {
      cancelAnim()
      holding = false
      pushed = 0
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('touchcancel', onTouchEnd, { passive: true })
    window.addEventListener('keydown', onUserInput)
    window.addEventListener('pointerdown', onUserInput)
    return () => {
      cancelAnim()
      window.clearTimeout(settleTimer)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchcancel', onTouchEnd)
      window.removeEventListener('keydown', onUserInput)
      window.removeEventListener('pointerdown', onUserInput)
    }
  }, [ref])
}
