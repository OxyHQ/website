import { useEffect, useState } from 'react'
import SliceIcon from './SliceIcon'

export interface TocEntry {
  id: string
  label: string
  /** 2 for a top-level section, 3+ for a subsection. */
  level: number
}

interface ArticleTocProps {
  entries: TocEntry[]
  /** Rendered as a "Download PDF" control above the list when present. */
  pdfHref?: string
}

/** Groups each top-level entry with the subsections that follow it. */
function toSections(entries: TocEntry[]): { entry: TocEntry; children: TocEntry[] }[] {
  const sections: { entry: TocEntry; children: TocEntry[] }[] = []
  for (const entry of entries) {
    if (entry.level <= 2 || sections.length === 0) sections.push({ entry, children: [] })
    else sections[sections.length - 1].children.push(entry)
  }
  return sections
}

/**
 * A numbered heading ("2.1 Open by default") reads as a number and a title, so
 * the list can align every title on one edge however wide the numbers get. An
 * unnumbered heading ("Summary") has no first column at all.
 */
function splitNumber(label: string): { number?: string; text: string } {
  const match = /^(\d+(?:\.\d+)*\.?)\s+(.*)$/.exec(label)
  return match ? { number: match[1], text: match[2] } : { text: label }
}

function Row({
  entry,
  spacing,
  onNavigate,
  active,
}: {
  entry: TocEntry
  spacing: string
  onNavigate?: () => void
  active?: boolean
}) {
  const { number, text } = splitNumber(entry.label)
  return (
    <a
      href={`#${entry.id}`}
      onClick={onNavigate}
      aria-current={active ? 'location' : undefined}
      className={`flex-1 cursor-pointer ${spacing} transition duration-100 ${
        active ? 'text-[var(--logo-letter-color)]' : 'text-muted-foreground hover:text-primary'
      } ${
        number ? 'grid grid-cols-[auto_1fr] gap-x-2' : ''
      }`}
    >
      {number && <span className="shrink-0 tabular-nums">{number}</span>}
      <span>{text}</span>
    </a>
  )
}

/**
 * Contents list for a long article: a disclosure button on narrow screens, a
 * pinned tree on wide ones. Sections with subsections collapse, so a long
 * document still fits the viewport without its own scrollbar.
 *
 * Entries are anchors, not scroll handlers, so a jump lands in history and a
 * copied URL reopens at the same place.
 */
export default function ArticleToc({ entries, pdfHref }: ArticleTocProps) {
  const [openOnMobile, setOpenOnMobile] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [activeId, setActiveId] = useState(entries[0]?.id)
  const sections = toSections(entries)

  useEffect(() => {
    if (entries.length === 0) return

    let frame: number | undefined

    const updateActiveEntry = () => {
      frame = undefined
      const headerHeight = Number.parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue('--header-height'),
      ) || 0
      const marker = headerHeight + 96
      let currentId = entries[0].id

      for (const entry of entries) {
        const heading = document.getElementById(entry.id)
        if (!heading) continue
        if (heading.getBoundingClientRect().top <= marker) currentId = entry.id
        else break
      }

      setActiveId((previous) => (previous === currentId ? previous : currentId))
    }

    const scheduleUpdate = () => {
      if (frame === undefined) frame = window.requestAnimationFrame(updateActiveEntry)
    }

    updateActiveEntry()
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)

    return () => {
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
      if (frame !== undefined) window.cancelAnimationFrame(frame)
    }
  }, [entries])

  const pdfLink = (className: string) =>
    pdfHref && (
      <a
        href={pdfHref}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex shrink-0 items-center rounded-full border border-border px-3.5 py-2 text-b3 text-foreground outline-none transition-all duration-100 ease-impulse hover:border-primary ${className}`}
      >
        Download PDF
        <SliceIcon name="download" className="ms-1 size-4" />
      </a>
    )

  return (
    <nav className="sticky top-[var(--header-height)] col-span-full text-b4 max-lg:z-10 max-lg:w-full max-lg:bg-background/95 lg:col-start-1 lg:col-span-2 lg:row-span-99 lg:row-start-1 lg:top-[calc(var(--header-height)+5rem)] lg:w-full lg:max-w-[13rem] lg:min-h-0 lg:overflow-clip">
      {/* Narrow: one disclosure so the article starts at the top of the screen. */}
      <div className="lg:hidden">
        <div className="flex items-center gap-3 pb-2">
          <button
            type="button"
            onClick={() => setOpenOnMobile((open) => !open)}
            aria-expanded={openOnMobile}
            className="flex flex-1 cursor-pointer items-center justify-between rounded-full border border-border px-3.5 py-2 text-b3 text-foreground outline-none"
          >
            <span>Table of contents</span>
            <SliceIcon
              name="chevron-down"
              className={`size-4 transition-transform duration-200 ${openOnMobile ? 'rotate-180' : 'rotate-0'}`}
            />
          </button>
          {pdfLink('')}
        </div>
        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${openOnMobile ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
        >
          <div className="overflow-hidden">
            <div className="max-h-[calc(100dvh-var(--header-height)-3rem)] touch-pan-y overflow-y-auto pt-4 [scrollbar-width:none]">
              {entries.map((entry) => {
                const { number, text } = splitNumber(entry.label)
                return (
                  <a
                    key={entry.id}
                    href={`#${entry.id}`}
                    onClick={() => setOpenOnMobile(false)}
                    aria-current={activeId === entry.id ? 'location' : undefined}
                    className={`cursor-pointer py-1.5 text-start transition duration-100 ${
                      activeId === entry.id
                        ? 'text-[var(--logo-letter-color)]'
                        : 'text-muted-foreground hover:text-primary'
                    } ${
                      number ? 'grid grid-cols-[auto_1fr] gap-x-2' : 'block'
                    } ${entry.level > 2 ? 'ps-4' : ''}`}
                  >
                    {number && <span className="shrink-0 tabular-nums">{number}</span>}
                    <span>{text}</span>
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="hidden lg:block lg:max-h-[calc(100vh-var(--header-height)-5rem)] lg:overflow-x-hidden lg:overflow-y-auto [scrollbar-width:none]">
        {pdfLink('mb-8 w-fit justify-self-start bg-background')}
        {sections.map(({ entry, children }, index) => (
          <div key={entry.id}>
            <div className="flex items-center">
              {/* The list sits directly under the PDF control, so the first row
                  pads below only — its own top padding would double that gap. */}
              <Row entry={entry} active={activeId === entry.id} spacing={index === 0 ? 'pb-2' : 'py-2'} />
              {children.length > 0 && (
                <button
                  type="button"
                  onClick={() => setExpanded((state) => ({ ...state, [entry.id]: !state[entry.id] }))}
                  aria-expanded={Boolean(expanded[entry.id])}
                  aria-label={expanded[entry.id] ? 'Collapse section' : 'Expand section'}
                  className="-me-3 cursor-pointer p-3 text-muted-foreground transition-colors duration-100 hover:text-primary"
                >
                  <SliceIcon
                    name="chevron-down"
                    className={`size-4 transition-transform duration-200 ${expanded[entry.id] ? 'rotate-180' : 'rotate-0'}`}
                  />
                </button>
              )}
            </div>
            {children.length > 0 && (
              <div
                className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                  expanded[entry.id] ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                }`}
              >
                <div className="overflow-hidden">
                  <div className="ps-4">
                    {children.map((child) => (
                      <div key={child.id} className="flex items-center">
                        <Row entry={child} active={activeId === child.id} spacing="py-2" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </nav>
  )
}
