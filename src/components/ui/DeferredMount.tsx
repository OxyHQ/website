import { useEffect, useRef, useState, type ReactNode } from 'react'

interface DeferredMountProps {
  children: ReactNode
  fallback?: ReactNode
  /** Start secondary work shortly before the reader can see it. */
  rootMargin?: string
}

/**
 * Keeps below-the-fold queries and chunks out of the article's critical path.
 * Content mounts as it approaches the viewport; browsers without an observer
 * get the content immediately instead of losing functionality.
 */
export default function DeferredMount({
  children,
  fallback = null,
  rootMargin = '700px 0px',
}: DeferredMountProps) {
  const [ready, setReady] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ready) return
    const node = sentinelRef.current
    if (!node || typeof IntersectionObserver === 'undefined') {
      setReady(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        setReady(true)
        observer.disconnect()
      },
      { rootMargin },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [ready, rootMargin])

  if (ready) return children
  return <div ref={sentinelRef}>{fallback}</div>
}
