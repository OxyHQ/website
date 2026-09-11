import { describe, expect, test } from 'bun:test'
import { renderSEO, renderStructuredData } from '../src/entry-server'
import {
  NEWSROOM_PRERENDER_MARKER,
  renderNewsroomBootstrapTemplate,
  renderNewsroomIndexBootstrapTemplate,
} from './newsroom-prerender'
import {
  buildNewsroomArticleStructuredData,
  buildNewsroomCollectionStructuredData,
  normalizeNewsroomSeoTitle,
} from '../src/lib/newsroomSeo'

const brand = {
  origin: 'https://oxy.so',
  siteName: 'Oxy',
  ogImage: 'https://oxy.so/og-default.png',
}

const post = {
  slug: 'a-faster-newsroom',
  title: 'A faster Newsroom',
  resume: 'How the Newsroom became faster.',
  coverImage: '/images/newsroom/faster.webp',
  publishedAt: '2026-08-29T10:00:00.000Z',
  updatedAt: '2026-08-30T12:00:00.000Z',
  authorUsername: 'nate',
  categories: ['Engineering'],
  tags: ['performance', 'web'],
}

describe('Newsroom SEO title', () => {
  test('removes every editorial brand suffix before SEO appends one', () => {
    expect(normalizeNewsroomSeoTitle('A faster Newsroom | Oxy', 'Oxy')).toBe('A faster Newsroom')
    expect(normalizeNewsroomSeoTitle('A faster Newsroom | Oxy | Oxy', 'Oxy')).toBe('A faster Newsroom')
    expect(normalizeNewsroomSeoTitle('How Oxy works', 'Oxy')).toBe('How Oxy works')
  })

  test('renders one suffix plus canonical and translation-ready hreflang', () => {
    const title = normalizeNewsroomSeoTitle('A faster Newsroom | Oxy', 'Oxy')
    const { head } = renderSEO(
      {
        title,
        description: post.resume,
        canonicalPath: `/newsroom/${post.slug}`,
        ogType: 'article',
      },
      null,
      { locales: [{ code: 'es', translationReady: true }] },
    )

    expect(head).toContain('<title>A faster Newsroom | Oxy</title>')
    expect(head).not.toContain('| Oxy | Oxy')
    expect(head).toContain('rel="canonical" href="https://oxy.so/newsroom/a-faster-newsroom/"')
    expect(head).toContain('hreflang="es" href="https://oxy.so/es/newsroom/a-faster-newsroom/"')
    expect(head).toContain('hreflang="x-default" href="https://oxy.so/newsroom/a-faster-newsroom/"')
  })

  test('normalizes an exact-route CMS override too', () => {
    const canonicalPath = `/newsroom/${post.slug}`
    const { head } = renderSEO(
      { title: post.title, description: post.resume, canonicalPath },
      {
        oxy: {
          default: null,
          routes: {
            [canonicalPath]: {
              title: 'A faster Newsroom | Oxy | Oxy',
              description: post.resume,
              ogImage: '',
            },
          },
        },
        faircoin: { default: null, routes: {} },
      },
    )

    expect(head).toContain('<title>A faster Newsroom | Oxy</title>')
    expect(head).not.toContain('| Oxy | Oxy')
  })
})

describe('Newsroom structured data', () => {
  test('describes the article and its breadcrumbs with real editorial fields', () => {
    const data = buildNewsroomArticleStructuredData(post, brand)
    const graph = data['@graph'] as Array<Record<string, unknown>>
    const article = graph.find((entry) => entry['@type'] === 'NewsArticle')
    const breadcrumbs = graph.find((entry) => entry['@type'] === 'BreadcrumbList')

    expect(article).toMatchObject({
      headline: post.title,
      image: 'https://oxy.so/images/newsroom/faster.webp',
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      articleSection: 'Engineering',
      keywords: ['performance', 'web'],
    })
    expect(article?.author).toMatchObject({
      '@type': 'Person',
      name: 'nate',
      url: 'https://oxy.so/u/nate/',
    })
    expect(breadcrumbs?.itemListElement).toHaveLength(3)
  })

  test('adds a real ItemList to the Newsroom collection', () => {
    const data = buildNewsroomCollectionStructuredData([post], brand, 'Newsroom', 'Latest Oxy news.')
    const graph = data['@graph'] as Array<Record<string, unknown>>
    const collection = graph.find((entry) => entry['@type'] === 'CollectionPage')
    const list = graph.find((entry) => entry['@type'] === 'ItemList')

    expect(collection?.mainEntity).toEqual({ '@id': 'https://oxy.so/newsroom/#articles' })
    expect(list).toMatchObject({ numberOfItems: 1 })
    expect(list?.itemListElement).toEqual([
      {
        '@type': 'ListItem',
        position: 1,
        name: post.title,
        url: 'https://oxy.so/newsroom/a-faster-newsroom/',
      },
    ])
  })

  test('serializes CMS text without allowing a script breakout', () => {
    const html = renderStructuredData({
      '@context': 'https://schema.org',
      name: '</script><script>alert(1)</script>',
    })

    expect(html).toContain('type="application/ld+json"')
    expect(html).not.toContain('</script><script>')
    expect(html).toContain('\\u003c/script\\u003e')
  })
})

describe('Newsroom prerender bootstrap', () => {
  test('emits an inert, escaped default-locale payload and the edge marker', () => {
    const template = renderNewsroomBootstrapTemplate({
      ...post,
      title: 'A faster <Newsroom>',
      content: 'Never close </template> from CMS content.',
      tags: [...post.tags],
      products: [],
      featured: false,
      status: 'published',
      createdAt: post.publishedAt,
      updatedAt: post.updatedAt,
    })

    expect(template).toStartWith('<template id="newsroom-post-bootstrap">')
    expect(template).toContain('&quot;locale&quot;:&quot;en&quot;')
    expect(template).toContain('&lt;/template&gt;')
    expect(template).not.toContain('<script')
    expect(NEWSROOM_PRERENDER_MARKER).toBe('<meta data-prerender-kind="newsroom-post">')
  })

  test('emits an inert index payload for the default Newsroom route', () => {
    const template = renderNewsroomIndexBootstrapTemplate([{
      slug: post.slug,
      title: 'A faster <Newsroom>',
      resume: post.resume,
      categories: post.categories,
      featured: false,
      publishedAt: post.publishedAt,
    }])

    expect(template).toStartWith('<template id="newsroom-index-bootstrap">')
    expect(template).toContain('&quot;total&quot;:1')
    expect(template).toContain('A faster &lt;Newsroom&gt;')
    expect(template).not.toContain('<script')
  })
})
