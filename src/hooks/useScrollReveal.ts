import { useEffect, useRef } from 'react'

interface ScrollRevealOptions {
  threshold?: number
  rootMargin?: string
}

/**
 * Attaches an IntersectionObserver to a container ref.
 * Any child with class `scroll-reveal` will get `revealed` added
 * when the container enters the viewport.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: ScrollRevealOptions = {}
) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Reveal all scroll-reveal children
            const targets = entry.target.querySelectorAll('.scroll-reveal')
            targets.forEach((target) => target.classList.add('revealed'))
            // Also reveal the container itself if it has the class
            if (entry.target.classList.contains('scroll-reveal')) {
              entry.target.classList.add('revealed')
            }
            observer.unobserve(entry.target)
          }
        })
      },
      {
        threshold: options.threshold ?? 0.15,
        rootMargin: options.rootMargin ?? '0px 0px -50px 0px',
      }
    )

    observer.observe(el)

    return () => observer.disconnect()
  }, [options.threshold, options.rootMargin])

  return ref
}
