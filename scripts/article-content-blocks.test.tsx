import { describe, expect, test } from 'bun:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { ArticleCustomBlock } from '../src/components/slices/article-blocks/ArticleBlocks'
import { expandArticleCitations, parseArticleFence } from '../src/components/slices/article-blocks/schema'
import ArticleMarkdown from '../src/components/newsroom/article/ArticleMarkdown'
import { articleSpeechText, estimatedSpeechDuration } from '../src/components/newsroom/article/articleSpeech'

const examples = {
  'article-media': { type: 'image', src: '/images/example.webp', alt: 'Example', caption: 'Caption' },
  'article-callout': { title: 'Why this matters', body: 'A concise **editorial** explanation.' },
  'article-stats': { items: [{ value: '42%', label: 'Less waiting' }] },
  'article-tabs': { tabs: [{ id: 'people', label: 'People', content: 'Human view' }, { id: 'systems', label: 'Systems', content: 'System view' }] },
  'article-testimonials': { items: [{ quote: 'It changed the work.', name: 'Ada', role: 'Researcher' }] },
  'article-comparison': { panels: [{ label: 'Before', content: 'Manual.' }, { label: 'After', content: 'Clear.' }] },
  'article-table': { columns: ['Signal', 'Result'], rows: [['Latency', 'Lower']] },
  'article-footnotes': { items: [{ id: 'method', text: 'Methodology note.', url: 'https://example.com/source' }] },
} as const

describe('typed article fences', () => {
  for (const [name, payload] of Object.entries(examples)) {
    test(`parses and renders ${name}`, () => {
      const parsed = parseArticleFence(name, JSON.stringify(payload))
      expect(parsed?.ok).toBe(true)
      if (!parsed?.ok) return
      const html = renderToStaticMarkup(<ArticleCustomBlock block={parsed.block} />)
      expect(html.length).toBeGreaterThan(40)
      expect(html).not.toContain('<script')
    })
  }

  test('rejects unsafe media URLs', () => {
    const parsed = parseArticleFence('article-media', JSON.stringify({ type: 'embed', src: 'javascript:alert(1)' }))
    expect(parsed?.ok).toBe(false)
  })

  test('requires an accessible title for embeds', () => {
    const parsed = parseArticleFence('article-media', JSON.stringify({ type: 'embed', src: 'https://www.youtube.com/embed/example' }))
    expect(parsed?.ok).toBe(false)
  })

  test('rejects uneven table rows', () => {
    const parsed = parseArticleFence('article-table', JSON.stringify({ columns: ['A', 'B'], rows: [['only one']] }))
    expect(parsed?.ok).toBe(false)
  })

  test('expands citation shorthand into a marked local link', () => {
    expect(expandArticleCitations('Evidence [[cite:method]].')).toBe('Evidence [method](#fn-method "citation").')
  })

  test('leaves unknown fences to normal Markdown rendering', () => {
    expect(parseArticleFence('javascript', '{}')).toBeNull()
  })

  test('renders typed fences through the Newsroom Markdown pipeline', () => {
    const markdown = [
      'Opening [[cite:method]].',
      '',
      '```article-callout',
      JSON.stringify(examples['article-callout']),
      '```',
      '',
      '```article-footnotes',
      JSON.stringify(examples['article-footnotes']),
      '```',
    ].join('\n')
    const html = renderToStaticMarkup(<div className="grid"><ArticleMarkdown content={markdown} /></div>)
    expect(html).toContain('Why this matters')
    expect(html).toContain('id="fnref-method"')
    expect(html).toContain('href="#fnref-method"')
    expect(html).not.toContain('language-article-callout')
  })

  test('prepares clean article speech and a stable duration', () => {
    const speech = articleSpeechText('Title', 'Standfirst', '# Heading\nA [link](https://example.com).\n```article-stats\n{"items":[]}\n```')
    expect(speech).toBe('Title. Standfirst. Heading A link.')
    expect(estimatedSpeechDuration(Array.from({ length: 180 }, () => 'word').join(' '))).toBe('1:00')
  })
})
