import { describe, expect, test } from 'bun:test'
import { compile } from '@mdx-js/mdx'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'

import { escapeUnclosedProseTags } from './mdx-literal-tags'

const compiles = async (source: string) =>
  compile(source, { remarkPlugins: [remarkFrontmatter, remarkGfm] }).then(() => true)

describe('escapeUnclosedProseTags', () => {
  test('escapes a placeholder tag in prose so the document compiles', async () => {
    // The sentence Bloom 2.0.0 shipped in docs/auth-card.mdx.
    const input = '# Auth card\n\n- `inline` — icon-only. Each keeps "Continue with <Brand>" as its name.\n'
    await expect(compiles(input)).rejects.toThrow('Expected a closing tag')
    const { source, escaped } = escapeUnclosedProseTags(input)
    expect(escaped).toEqual(['<Brand>'])
    expect(source).toContain('Continue with \\<Brand>')
    expect(await compiles(source)).toBe(true)
  })

  test('escapes every stray tag, not only the first', () => {
    const { escaped } = escapeUnclosedProseTags('Use <A> then <B> here.\n')
    expect(escaped.sort()).toEqual(['<A>', '<B>'])
  })

  test('leaves real JSX, code and frontmatter untouched', () => {
    const input = '---\ntitle: <X>\n---\n\n<Card>\nBody\n</Card>\n\n`<Brand>` and\n\n```tsx\n<Open>\n```\n'
    expect(escapeUnclosedProseTags(input)).toEqual({ source: input, escaped: [] })
  })

  test('does not paper over an unrelated syntax error', () => {
    const input = 'An expression {that never closes\n'
    expect(escapeUnclosedProseTags(input)).toEqual({ source: input, escaped: [] })
  })
})
