import { useEffect, type RefObject } from 'react'
import { animate, type AnimationPlaybackControls } from 'framer-motion'

/** Distance from the stop, in px, within which a resting page is drawn onto it. */
const PULL_ZONE = 220
/** How long scrolling must be still before the pull kicks in. */
const SETTLE_MS = 140
/** Duration of the pull onto the stop, in seconds. */
const PULL_S = 0.42
/** Wheel travel, in px, the visitor must push against the stop to break through. */
const RELEASE_THRESHOLD = 360
/** Furthest the page gives under that push, approached but never reached. */
const MAX_STRETCH = 90
/** How fast pushed-but-abandoned travel drains away, in px per ms. */
const LEAK_PER_MS = 0.3
/** After landing, inertia that carried the visitor here cannot count as pushing. */
const LANDING_GRACE_MS = 350

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
    // While holding, `pushed` is the travel pushed against the stop; it is 0 otherwise.
    let holding = false
    let pushed = 0
    let lastPushAt = 0
    let landedAt = 0
    let touching = false
    let settleTimer = 0
    let glide: AnimationPlaybackControls | null = null

    const stopAt = () => {
      const el = ref.current
      if (!el) return null
      const top = el.getBoundingClientRect().bottom + window.scrollY - window.innerHeight
      // A stop inside the first screen would pin the page on load.
      return top > 0 ? Math.round(top) : null
    }

    const jump = (top: number) => window.scrollTo({ top, behavior: 'instant' })

    const letGo = () => {
      holding = false
      pushed = 0
    }

    const stopGlide = () => {
      glide?.stop()
      glide = null
    }

    const glideTo = (to: number) => {
      stopGlide()
      if (Math.abs(to - window.scrollY) < 1) return
      glide = animate(window.scrollY, to, {
        duration: PULL_S,
        ease: 'easeOut',
        onUpdate: jump,
        onComplete: () => {
          glide = null
        },
      })
    }

    const settle = () => {
      if (touching) return
      const target = stopAt()
      if (target === null) return
      if (holding) {
        // The push was let go before it broke through: spring back.
        letGo()
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
      stopGlide()
      scheduleSettle()
      if (!armed || event.deltaY <= 0 || event.ctrlKey) return
      const target = stopAt()
      if (target === null) return
      const now = performance.now()

      if (!holding) {
        const y = window.scrollY
        if (y > target + 1 || y + event.deltaY <= target) return
        // This step would cross the stop: land on it instead.
        event.preventDefault()
        holding = true
        landedAt = now
        jump(target)
        return
      }

      event.preventDefault()
      if (now - landedAt < LANDING_GRACE_MS) return
      pushed = Math.max(0, pushed - (now - lastPushAt) * LEAK_PER_MS) + event.deltaY
      lastPushAt = now
      if (pushed >= RELEASE_THRESHOLD) {
        letGo()
        armed = false
        return
      }
      // The page gives under the push, less the harder it is pushed.
      jump(target + MAX_STRETCH * (1 - Math.exp(-pushed / (RELEASE_THRESHOLD / 2))))
    }

    const onScroll = () => {
      const target = stopAt()
      if (target !== null && window.scrollY < target - 1) armed = true
      if (!glide) scheduleSettle()
    }

    const onTouchStart = () => {
      touching = true
      stopGlide()
      window.clearTimeout(settleTimer)
    }
    const onTouchEnd = () => {
      touching = false
      scheduleSettle()
    }
    // A key or a scrollbar drag outranks the magnet.
    const onUserInput = () => {
      stopGlide()
      letGo()
    }

    const listeners = new AbortController()
    const { signal } = listeners
    window.addEventListener('wheel', onWheel, { passive: false, signal })
    window.addEventListener('scroll', onScroll, { passive: true, signal })
    window.addEventListener('touchstart', onTouchStart, { passive: true, signal })
    window.addEventListener('touchend', onTouchEnd, { passive: true, signal })
    window.addEventListener('touchcancel', onTouchEnd, { passive: true, signal })
    window.addEventListener('keydown', onUserInput, { signal })
    window.addEventListener('pointerdown', onUserInput, { signal })
    return () => {
      listeners.abort()
      stopGlide()
      window.clearTimeout(settleTimer)
    }
  }, [ref])
}
