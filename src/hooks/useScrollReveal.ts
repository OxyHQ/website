import { useCallback, useRef } from 'react'

interface ScrollRevealOptions {
  threshold?: number
  rootMargin?: string
}

/**
 * Returns a callback ref that, when attached to an element, observes it with
 * an IntersectionObserver. Any descendant with class `scroll-reveal` will get
 * `revealed` added once the container enters the viewport.
 *
 * Uses a callback ref (not useEffect) so observer lifecycle is owned directly
 * by React's ref system — no effect churn, no dep-array edge cases.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: ScrollRevealOptions = {},
): (node: T | null) => void {
  const observerRef = useRef<IntersectionObserver | null>(null)
  const { threshold = 0.15, rootMargin = '0px 0px -50px 0px' } = options

  return useCallback(
    (node: T | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = null
      }
      if (!node) return

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return
            const targets = entry.target.querySelectorAll('.scroll-reveal')
            targets.forEach((target) => target.classList.add('revealed'))
            if (entry.target.classList.contains('scroll-reveal')) {
              entry.target.classList.add('revealed')
            }
            observer.unobserve(entry.target)
          })
        },
        { threshold, rootMargin },
      )
      observer.observe(node)
      observerRef.current = observer
    },
    [threshold, rootMargin],
  )
}
