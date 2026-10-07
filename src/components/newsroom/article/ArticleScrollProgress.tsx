import { useEffect, useState, type RefObject } from 'react'
import { RiBookOpenLine } from '@oxy.so/bloom/icons/RiBookOpenLine'
import { articleReadingProgress } from '../../../lib/articleReadingProgress'

/**
 * How far through the article you are, sticky within the article boundary.
 *
 * Measures only the prose, excluding the hero, products, comments and footer.
 * The body uses `display: contents` to preserve the article grid, so a Range
 * measures its children instead of the wrapper's empty bounding box.
 */
export default function ArticleScrollProgress({ bodyRef }: { bodyRef: RefObject<HTMLDivElement | null> }) {
  const [percent, setPercent] = useState(0)

  useEffect(() => {
    const body = bodyRef.current
    if (!body) return
    let frame = 0
    const range = document.createRange()

    const update = () => {
      frame = 0
      range.selectNodeContents(body)
      const { top, bottom } = range.getBoundingClientRect()
      const headerHeight = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--site-header-occlusion-bottom')) || 0
      setPercent(articleReadingProgress(top, bottom, window.innerHeight, headerHeight))
    }

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    const resizeObserver = new ResizeObserver(onScroll)
    // Covers late-loading media, font changes and layout above the prose.
    resizeObserver.observe(document.body)
    if (body.parentElement) resizeObserver.observe(body.parentElement)
    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [bodyRef])

  return (
    <div data-reading-progress className="pointer-events-none sticky bottom-0 z-30 hidden w-full lg:block">
      <div className="container flex items-start pb-4">
        <div className="flex items-center gap-2 rounded-radius-12 bg-primary p-1 ps-2 text-primary-foreground shadow-md">
          <RiBookOpenLine width={16} height={16} fill="currentColor" aria-hidden />
          <p
            aria-label={`${percent}% read`}
            className="rounded-radius-8 bg-primary-foreground/15 px-1.5 py-1 text-body-sm tabular-nums"
          >
            {percent}%
          </p>
        </div>
      </div>
    </div>
  )
}
