import { useEffect, useState } from 'react'
import { BookOpen } from '@phosphor-icons/react'

/**
 * How far through the article you are, pinned to the bottom of the page.
 *
 * Reads the document on scroll rather than observing the body element: the
 * measure people want is "how much of this page is left", and the page includes
 * what follows the prose — comments, related posts.
 */
export default function ArticleScrollProgress() {
  const [percent, setPercent] = useState(0)

  useEffect(() => {
    let frame = 0

    const update = () => {
      frame = 0
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      setPercent(scrollable <= 0 ? 100 : Math.min(100, Math.round((window.scrollY / scrollable) * 100)))
    }

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div className="sticky bottom-0 mx-auto hidden w-full max-w-[108rem] items-start p-4 lg:flex">
      <div className="flex items-center gap-2 rounded-radius-12 bg-fill-inverse p-1 pl-2 text-bg">
        <BookOpen size={16} weight="bold" />
        <p className="rounded-radius-8 bg-black/20 px-1.5 py-1 text-sm font-semibold tabular-nums">{percent}%</p>
      </div>
    </div>
  )
}
