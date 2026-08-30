import { describe, expect, test } from 'bun:test'
import { shouldRetryNewsroomRequest } from '../src/api/newsroomQuery'
import {
  newsroomBootstrapPayload,
  newsroomIndexBootstrapPayload,
} from '../src/lib/newsroom-bootstrap'
import { resolveResponsiveImage } from '../src/lib/responsiveImage'
import type { NewsroomPost } from '../src/data/newsroom'

const post: NewsroomPost = {
  slug: 'fast-newsroom',
  title: 'Fast Newsroom',
  resume: 'Ready on first render.',
  content: 'Article body',
  categories: ['Engineering'],
  tags: [],
  products: [],
  featured: true,
  status: 'published',
  publishedAt: '2026-08-30T00:00:00.000Z',
  createdAt: '2026-08-30T00:00:00.000Z',
  updatedAt: '2026-08-30T00:00:00.000Z',
}

describe('Newsroom performance contracts', () => {
  test('serializes a default-locale bootstrap payload', () => {
    expect(newsroomBootstrapPayload(post)).toEqual({ locale: 'en', post })
  })

  test('serializes the list response used by the first Newsroom render', () => {
    const payload = newsroomIndexBootstrapPayload([{
      slug: post.slug,
      title: post.title,
      resume: post.resume,
      categories: post.categories,
      featured: post.featured,
      publishedAt: post.publishedAt,
    }])

    expect(payload.locale).toBe('en')
    expect(payload.data).toMatchObject({ total: 1, page: 1, pages: 1 })
    expect(payload.data.posts[0]?.slug).toBe(post.slug)
  })

  test('uses responsive thumbnails and never falls back to a large original unnecessarily', () => {
    expect(resolveResponsiveImage({
      url: 'original.png',
      thumbnails: { sm: 'small.jpg', md: 'medium.jpg', lg: 'large.jpg' },
    })).toEqual({
      src: 'large.jpg',
      srcSet: 'small.jpg 200w, medium.jpg 400w, large.jpg 800w',
    })

    expect(resolveResponsiveImage({
      url: 'large-original.png',
      thumbnails: { sm: 'small.jpg', md: 'medium.jpg', lg: '' },
    })).toEqual({ src: 'medium.jpg' })

    expect(resolveResponsiveImage({
      url: 'compact-original.png',
      thumbnails: { sm: 'small.jpg', md: '', lg: '' },
    })).toEqual({ src: 'compact-original.png' })
  })

  test('retries one transient failure only', () => {
    expect(shouldRetryNewsroomRequest(0, new Error('network'))).toBe(true)
    expect(shouldRetryNewsroomRequest(1, new Error('network'))).toBe(false)
    expect(shouldRetryNewsroomRequest(0, new Error('missing', { cause: { status: 404 } }))).toBe(false)
    expect(shouldRetryNewsroomRequest(0, new Error('server', { cause: { status: 503 } }))).toBe(true)
  })
})
