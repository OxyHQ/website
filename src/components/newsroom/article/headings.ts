/**
 * The article's own headings, read straight from the markdown.
 *
 * The body is markdown rendered at runtime, so there is no build step to ask —
 * and reading them back out of the DOM would race the render. Both the contents
 * list and the rendered headings derive their ids from `slugify` here, so a link
 * and its target cannot disagree.
 */

export interface ArticleHeading {
  id: string
  text: string
  /** 2 for a section, 3 for a subsection. */
  level: 2 | 3
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
}

/** Strips the inline markdown a heading may carry (`**bold**`, `` `code` ``, links). */
function plainText(markdown: string): string {
  return markdown
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_]{1,3}/g, '')
    .trim()
}

export function extractHeadings(markdown: string): ArticleHeading[] {
  const headings: ArticleHeading[] = []
  // A `##` inside a fenced block is code, not a heading — the fence has to be
  // tracked, or a shell comment ends up in the contents list.
  let inFence = false
  for (const line of markdown.split('\n')) {
    if (line.startsWith('```')) {
      inFence = !inFence
      continue
    }
    if (inFence) continue
    const match = /^(#{2,3})\s+(.*)$/.exec(line)
    if (!match) continue
    const text = plainText(match[2] ?? '')
    if (!text) continue
    headings.push({ id: slugify(text), text, level: match[1]?.length === 2 ? 2 : 3 })
  }
  return headings
}
