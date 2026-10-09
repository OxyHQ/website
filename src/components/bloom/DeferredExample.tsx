import { useEffect, useRef, useState, type ReactNode } from 'react'

/** Keep the catalogue's many live examples offscreen until they are needed. */
export default function DeferredExample({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setReady(true)
        observer.disconnect()
      }
    }, { rootMargin: '240px' })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  return <div ref={ref} className="w-full min-w-0">{ready ? children : <div className="h-24 animate-pulse rounded-xl bg-muted" aria-hidden="true" />}</div>
}
