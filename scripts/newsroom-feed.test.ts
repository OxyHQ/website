import { describe, expect, test } from 'bun:test'
import { buildNewsroomRss } from './newsroom-feed'
import type { NewsroomPost } from '../src/data/newsroom'

const post: NewsroomPost = {
  slug: 'safe-feed',
  title: 'Oxy & the <open> web',
  resume: 'News without script breakouts.',
  content: 'Body',
  categories: ['Engineering & Product'],
  tags: [],
  products: [],
  featured: false,
  status: 'published',
  publishedAt: '2026-08-30T12:00:00.000Z',
  createdAt: '2026-08-30T12:00:00.000Z',
  updatedAt: '2026-08-30T13:00:00.000Z',
  coverImage: '/cover.jpg',
}

describe('Newsroom RSS', () => {
  test('publishes canonical article URLs and XML-safe editorial fields', () => {
    const xml = buildNewsroomRss([post], {
      siteUrl: 'https://oxy.so/',
      title: 'Oxy Newsroom',
      description: 'Oxy updates',
    })

    expect(xml).toContain('<rss version="2.0"')
    expect(xml).toContain('https://oxy.so/newsroom/safe-feed/')
    expect(xml).toContain('Oxy &amp; the &lt;open&gt; web')
    expect(xml).toContain('https://oxy.so/cover.jpg')
    expect(xml).not.toContain('<open>')
  })
})
