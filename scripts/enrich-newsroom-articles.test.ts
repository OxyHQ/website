import { describe, expect, test } from 'bun:test'
import {
  ARTICLE_ENRICHMENTS,
  enrichNewsroomMarkdown,
} from './enrich-newsroom-articles'
import { parseArticleFence } from '../src/components/slices/article-blocks/schema'

function parsedFences(markdown: string) {
  return [...markdown.matchAll(/^```(article-[\w-]+)\n([\s\S]*?)\n```$/gm)].map((match) => ({
    name: match[1],
    result: parseArticleFence(match[1], match[2]),
  }))
}

describe('Newsroom article enrichment', () => {
  test('is selective and deliberately varied', () => {
    expect(Object.keys(ARTICLE_ENRICHMENTS)).toHaveLength(10)
    expect(new Set(Object.values(ARTICLE_ENRICHMENTS).map(({ block }) => block.name))).toEqual(new Set([
      'article-stats',
      'article-comparison',
      'article-callout',
      'article-tabs',
      'article-table',
    ]))
    expect(ARTICLE_ENRICHMENTS['a-better-world-is-a-design-constraint']).toBeUndefined()
    expect(ARTICLE_ENRICHMENTS['oxy-principles']).toBeUndefined()
  })

  test('inserts one validated block without replacing editorial copy', () => {
    const source = 'Opening context.\n\n## What federation means in Mention\n\nBody copy.'
    const result = enrichNewsroomMarkdown(source, { slug: 'mention-joins-the-fediverse' })
    expect(result.changed).toBe(true)
    expect(result.blockCount).toBe(1)
    expect(result.content).toContain('Opening context.')
    expect(result.content).toContain('## What federation means in Mention')
    expect(result.content).toContain('Body copy.')
    expect(parsedFences(result.content).every((fence) => fence.result?.ok)).toBe(true)
  })

  test('leaves a prose-first article unchanged', () => {
    const source = 'An essay introduction.\n\n## A section\n\nIts argument.'
    expect(enrichNewsroomMarkdown(source, { slug: 'a-better-world-is-a-design-constraint' })).toEqual({
      content: source,
      changed: false,
      blockCount: 0,
    })
  })

  test('is idempotent and preserves already-authored rich articles', () => {
    const source = '```article-callout\n{"title":"Authored","body":"Keep me."}\n```'
    expect(enrichNewsroomMarkdown(source, { slug: 'housing-is-a-right-homiio' })).toEqual({
      content: source,
      changed: false,
      blockCount: 0,
    })
  })

  test('fails loudly if the editorial insertion point drifts', () => {
    expect(() => enrichNewsroomMarkdown('Heading changed.', { slug: 'introducing-alia-oxy-ai-assistant' }))
      .toThrow('Insertion heading not found')
  })
})
