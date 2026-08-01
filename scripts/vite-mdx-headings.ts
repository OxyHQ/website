import GithubSlugger from 'github-slugger'
import type { Plugin } from 'vite'

/* ──────────────────────────────────────────────
 * vite-mdx-headings
 *
 * Exposes an MDX document's own headings as `export const headings` on the
 * compiled module, next to the `frontmatter` export `remarkMdxFrontmatter`
 * adds. A page that needs a table of contents then reads it as data instead of
 * scraping the rendered DOM: the contents exist before the body does, so they
 * survive a client-side navigation into a lazily loaded MDX module.
 *
 * Ids come from `github-slugger`, which is what `rehype-slug` uses to id the
 * headings themselves, so an anchor here always matches the element it points
 * at.
 * ──────────────────────────────────────────── */

export interface MdxHeading {
  id: string
  label: string
  /** 2 for a section, 3+ for a subsection. */
  level: number
}

const HEADING = /^(#{2,4})\s+(.+?)\s*$/
const FENCE = /^\s*(?:```|~~~)/
/** Inline emphasis and code marks, which are formatting rather than text. */
const INLINE_MARKS = /[*_`]/g

/** Every `##`–`####` in a document, in source order, outside code fences. */
export function collectMdxHeadings(source: string): MdxHeading[] {
  const slugger = new GithubSlugger()
  const headings: MdxHeading[] = []
  let insideFence = false

  for (const line of source.split('\n')) {
    if (FENCE.test(line)) {
      insideFence = !insideFence
      continue
    }
    if (insideFence) continue

    const match = HEADING.exec(line)
    if (!match) continue

    const label = match[2].replace(INLINE_MARKS, '').trim()
    if (!label) continue
    headings.push({ id: slugger.slug(label), label, level: match[1].length })
  }

  return headings
}

export default function mdxHeadings(): Plugin {
  return {
    name: 'mdx-headings',
    // Ahead of the MDX compiler, so this appends to the document source and
    // MDX turns the export statement into a module export like any other.
    enforce: 'pre',
    transform(code, id) {
      if (!id.endsWith('.mdx')) return null
      const headings = collectMdxHeadings(code)
      return { code: `${code}\n\nexport const headings = ${JSON.stringify(headings)}\n`, map: null }
    },
  }
}
