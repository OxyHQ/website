import { useCallback, useState } from 'react'
import type { MdxHeading } from '../../scripts/vite-mdx-headings'

/**
 * The headings of a rendered article, read from the article itself.
 *
 * Every other contents list on this site is handed its headings as data —
 * `scripts/vite-mdx-headings.ts` exports them from the MDX module, and reading
 * the DOM would race the render. Docs cannot use that route: the export is
 * appended as an ESM statement, which only compiles in `.mdx`, and 1463 of the
 * 1570 synced pages are the `.md` TypeDoc emits. Putting the headings in
 * `_synced/index.json` instead would work, but that file is imported eagerly
 * into the main chunk, so every visitor to the home page would carry the
 * contents of every API page.
 *
 * So this reads them back — and answers the race with the instrument for it. A
 * `MutationObserver` re-reads on every change to the subtree, which covers the
 * body arriving from its lazy chunk, a client-side navigation swapping it, and
 * an MDX component that renders its own headings late. `rehype-slug` has
 * already given each one the id its anchor points at.
 */

const SELECTOR = 'h2[id], h3[id]'

function read(root: HTMLElement): MdxHeading[] {
  return Array.from(root.querySelectorAll<HTMLElement>(SELECTOR)).map((element) => ({
    id: element.id,
    label: element.textContent?.trim() ?? '',
    level: element.tagName === 'H2' ? 2 : 3,
  }))
}

/** What makes two readings the same reading, so equal ones don't re-render. */
function signature(headings: MdxHeading[]): string {
  return headings.map((heading) => `${heading.level}:${heading.id}:${heading.label}`).join('\n')
}

export function useContentHeadings(): {
  headings: MdxHeading[]
  contentRef: (node: HTMLElement | null) => void
} {
  const [headings, setHeadings] = useState<MdxHeading[]>([])

  const contentRef = useCallback((node: HTMLElement | null) => {
    if (!node) {
      setHeadings([])
      return
    }

    let frame = 0
    const apply = () => {
      frame = 0
      const next = read(node)
      // Replacing the array on every mutation would re-render the list for a
      // paragraph edit; the signature is what actually changed.
      setHeadings((current) => (signature(current) === signature(next) ? current : next))
    }

    apply()
    const observer = new MutationObserver(() => {
      if (frame === 0) frame = window.requestAnimationFrame(apply)
    })
    observer.observe(node, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      if (frame !== 0) window.cancelAnimationFrame(frame)
    }
  }, [])

  return { headings, contentRef }
}
