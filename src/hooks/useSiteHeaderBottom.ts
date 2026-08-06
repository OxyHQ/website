import { useSyncExternalStore } from 'react'

/**
 * Where the site header ends, in viewport pixels.
 *
 * Anything that sticks inside a page needs this number, and it cannot be
 * written down. `--site-header-height` says 46px; the header actually renders
 * 59px at desktop widths and 55px on a phone, so a sticky offset derived from
 * the variable tucks the panel's own header under the site's. Measured here
 * instead, from the element itself.
 *
 * It also MOVES. The promo banner above the header is fixed at the top and
 * scrolls away over its first 40px (`Navbar`'s `bannerOffset`), carrying the
 * header down with it, so a value read once at mount is wrong for the first
 * 40px of every page. Tracking the bottom edge rather than the height makes the
 * panel chrome follow the header down and settle under it, instead of sliding
 * beneath it for the first fifth of a scroll.
 *
 * Same shape as `useMediaQuery`: one module-level store behind
 * `useSyncExternalStore`, so every consumer shares one observer and one
 * listener, and nothing needs an effect.
 */

type Listener = () => void

const listeners = new Set<Listener>()
let current = 0
let observer: ResizeObserver | null = null
let frame = 0

/** The fixed site header, told apart from any other `header` on the page. */
function findSiteHeader(): HTMLElement | null {
  const headers = document.querySelectorAll('header')
  for (const header of headers) {
    if (window.getComputedStyle(header).position === 'fixed') return header as HTMLElement
  }
  return null
}

function measure(): void {
  const header = findSiteHeader()
  const next = header ? Math.round(header.getBoundingClientRect().bottom) : 0
  if (next !== current) {
    current = next
    listeners.forEach((listener) => listener())
  }
}

function scheduleMeasure(): void {
  if (frame !== 0) return
  frame = window.requestAnimationFrame(() => {
    frame = 0
    measure()
  })
}

function subscribe(listener: Listener): () => void {
  if (listeners.size === 0 && typeof window !== 'undefined') {
    measure()
    window.addEventListener('scroll', scheduleMeasure, { passive: true })
    window.addEventListener('resize', scheduleMeasure, { passive: true })
    const header = findSiteHeader()
    if (header && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(scheduleMeasure)
      observer.observe(header)
    }
  }
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
    if (listeners.size === 0 && typeof window !== 'undefined') {
      window.removeEventListener('scroll', scheduleMeasure)
      window.removeEventListener('resize', scheduleMeasure)
      if (frame !== 0) {
        window.cancelAnimationFrame(frame)
        frame = 0
      }
      observer?.disconnect()
      observer = null
    }
  }
}

function getSnapshot(): number {
  return current
}

/** Zero during prerender, where there is no layout and nothing is scrolled. */
function getServerSnapshot(): number {
  return 0
}

export function useSiteHeaderBottom(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
