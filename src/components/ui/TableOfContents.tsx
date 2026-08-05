import { useEffect, useState } from 'react'
import type { MdxHeading } from '../../../scripts/vite-mdx-headings'

/* ──────────────────────────────────────────────
 * TableOfContents
 *
 * Contents list for any long article — help, newsroom — with the section being
 * read highlighted as you scroll.
 *
 * The headings are always passed in, never read back out of the DOM: a help
 * article's come from the MDX module (`scripts/vite-mdx-headings.ts`), a
 * newsroom one's from its markdown source. Both know their headings before the
 * body has rendered, and reading the DOM meant racing that render.
 * ──────────────────────────────────────────── */

interface TableOfContentsProps {
  /** The article's headings, in document order. */
  headings: MdxHeading[]
  /**
   * Whether the list pins itself while the body scrolls. Off when the caller
   * already pins the column it sits in, so the two do not fight.
   */
  sticky?: boolean
}

export default function TableOfContents({ headings, sticky = true }: TableOfContentsProps) {
  const items = headings.filter((heading) => heading.level <= 3)
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null)

  // Which section is being read. The headings are known before their elements
  // exist (the article body is a lazily loaded module), so this resolves them
  // per scroll frame instead of once up front: an element that is not in the
  // document yet simply does not win, and the next frame picks it up.
  useEffect(() => {
    if (items.length === 0) return
    let frame = 0

    const update = () => {
      frame = 0
      const readingLine = window.innerHeight * 0.25
      let current = items[0].id
      for (const item of items) {
        const element = document.getElementById(item.id)
        if (element && element.getBoundingClientRect().top <= readingLine) current = item.id
      }
      setActiveId(current)
    }

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [items])

  if (items.length === 0) {
    return null
  }

  function handleSelectChange(event: React.ChangeEvent<HTMLSelectElement>): void {
    const id = event.target.value
    if (!id) return
    setActiveId(id)
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      history.replaceState(null, '', `#${id}`)
    }
  }

  return (
    <>
      {/* Mobile: a "Jump to" select. */}
      <div className="lg:hidden mb-6">
        <label htmlFor="article-toc-mobile" className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
          On this page
        </label>
        <select
          id="article-toc-mobile"
          value={activeId ?? ''}
          onChange={handleSelectChange}
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground transition-colors hover:border-input focus:border-input focus:outline-none"
        >
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.level === 3 ? '  · ' : ''}
              {item.label}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop: sticky sidebar TOC. */}
      <nav
        className={`max-lg:hidden self-start ${sticky ? 'sticky top-24' : ''}`}
        aria-label="Table of contents"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          On this page
        </p>
        <ul className="flex flex-col gap-1 text-sm border-l border-border">
          {items.map((item) => {
            const isActive = item.id === activeId
            const indent = item.level === 3 ? 'pl-7' : 'pl-4'
            return (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className={`relative block py-1.5 ${indent} pr-2 transition-colors ${
                    isActive
                      ? 'text-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setActiveId(item.id)}
                >
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute -left-px top-1.5 bottom-1.5 w-0.5 rounded-full bg-primary"
                    />
                  )}
                  {item.label}
                </a>
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  )
}
