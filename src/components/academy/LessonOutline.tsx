import { useEffect, useState } from 'react'
import { OutlineNav } from '@oxy.so/bloom/outline-nav'
import type { MdxHeading } from '../../../scripts/vite-mdx-headings'
import { useTranslation } from '../../lib/i18n'
import { useSiteHeaderBottom } from '../../hooks/useSiteHeaderBottom'

/* ──────────────────────────────────────────────
 * "On this page" for a lesson: Bloom's `OutlineNav` fed by the headings read
 * back from the rendered lesson (`useContentHeadings`), with the heading the
 * reader is in worked out per scroll frame — the same reading line the docs'
 * contents list uses. `OutlineNav` does not scroll; this does, clearing the
 * fixed site header.
 * ──────────────────────────────────────────── */

function useActiveHeading(headings: readonly MdxHeading[]): string | undefined {
  const [activeId, setActiveId] = useState<string | undefined>(undefined)
  useEffect(() => {
    if (headings.length === 0) return
    let frame = 0
    const update = () => {
      frame = 0
      const readingLine = window.innerHeight * 0.25
      let current = headings[0].id
      for (const heading of headings) {
        const element = document.getElementById(heading.id)
        if (element && element.getBoundingClientRect().top <= readingLine) current = heading.id
      }
      setActiveId(current)
    }
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [headings])
  return activeId
}

export function LessonOutline({ headings }: { headings: MdxHeading[] }) {
  const { t } = useTranslation()
  const activeId = useActiveHeading(headings)
  const headerBottom = useSiteHeaderBottom()
  if (headings.length === 0) return null
  return (
    <OutlineNav
      headings={headings}
      activeId={activeId}
      title={t('academy.onThisPage')}
      labels={{
        outline: t('academy.onThisPage'),
        progress: (at, of) => t('academy.headingProgress', { at, total: of }),
      }}
      onSelect={(heading) => {
        const element = document.getElementById(heading.id)
        if (!element) return
        const top = element.getBoundingClientRect().top + window.scrollY - headerBottom - 16
        window.scrollTo({ top, behavior: 'smooth' })
        history.replaceState(null, '', `#${heading.id}`)
      }}
    />
  )
}
