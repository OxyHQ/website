/**
 * Escape a `<Word>` in synced MDX prose that the author meant as text.
 *
 * Upstream docs are markdown to their authors, so "Continue with <Brand>" is a
 * placeholder in a sentence. MDX reads it as a JSX element with no closing tag
 * and the whole site build fails on a file nobody here wrote — and a released
 * version is synced from an immutable git tag, so fixing the sentence upstream
 * cannot repair the version that already shipped.
 *
 * So the MDX parser itself decides, not a pattern: parse, and when it reports
 * an element with no closing tag, escape exactly that `<` and parse again.
 * Anything else it rejects is left alone, so a genuinely broken document still
 * fails the build with the compiler's own message.
 */

import { createProcessor } from '@mdx-js/mdx'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'

/**
 * The parser's own message. Its `place` is the enclosing paragraph, so the
 * tag's position is read from the `(line:column-line:column)` it names.
 */
const UNCLOSED_TAG = /^Expected a closing tag for `<[^>]*>` \((\d+):(\d+)-\d+:\d+\)/

/** A document with more stray tags than this is not prose with a slip in it. */
const MAX_ESCAPES = 50

interface ParseFailure {
  message?: string
  reason?: string
}

/** 1-based line and column to a string offset. */
function offsetAt(source: string, line: number, column: number): number | undefined {
  let offset = 0
  for (let current = 1; current < line; current += 1) {
    const newline = source.indexOf('\n', offset)
    if (newline === -1) return undefined
    offset = newline + 1
  }
  return offset + column - 1
}

export function escapeUnclosedProseTags(source: string): { source: string; escaped: string[] } {
  // The same syntax extensions the site compiles with (`vite.config.ts`).
  const processor = createProcessor({ remarkPlugins: [remarkFrontmatter, remarkGfm] })
  const escaped: string[] = []
  let current = source
  for (let attempt = 0; attempt <= MAX_ESCAPES; attempt += 1) {
    try {
      processor.parse(current)
      return { source: current, escaped }
    } catch (error) {
      const failure = error as ParseFailure
      const reason = failure.reason ?? failure.message ?? ''
      const match = UNCLOSED_TAG.exec(reason)
      const offset = match ? offsetAt(current, Number(match[1]), Number(match[2])) : undefined
      if (offset === undefined || current[offset] !== '<') {
        return { source: current, escaped }
      }
      escaped.push(current.slice(offset, current.indexOf('>', offset) + 1))
      current = `${current.slice(0, offset)}\\${current.slice(offset)}`
    }
  }
  return { source: current, escaped }
}
