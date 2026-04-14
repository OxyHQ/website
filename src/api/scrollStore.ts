/**
 * Shared window scroll-position store. A single passive scroll listener feeds
 * every consumer through `useSyncExternalStore`, avoiding per-component effect
 * setup. rAF-throttled so we notify at most once per frame.
 */

type Listener = () => void

let scrollY = typeof window !== 'undefined' ? window.scrollY : 0
const listeners = new Set<Listener>()
let rafId = 0
let attached = false

function notify() {
  listeners.forEach(l => l())
}

function onScroll() {
  if (rafId) return
  rafId = requestAnimationFrame(() => {
    rafId = 0
    const next = window.scrollY
    if (next === scrollY) return
    scrollY = next
    notify()
  })
}

function attach() {
  if (attached || typeof window === 'undefined') return
  attached = true
  scrollY = window.scrollY
  window.addEventListener('scroll', onScroll, { passive: true })
}

function detach() {
  if (!attached) return
  attached = false
  window.removeEventListener('scroll', onScroll)
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = 0
  }
}

export function subscribeScrollY(listener: Listener): () => void {
  const wasEmpty = listeners.size === 0
  listeners.add(listener)
  if (wasEmpty) attach()
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) detach()
  }
}

export function getScrollYSnapshot(): number {
  return scrollY
}

export function getScrollYServerSnapshot(): number {
  return 0
}
