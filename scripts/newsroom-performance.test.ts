import { describe, expect, test } from 'bun:test'
import { shouldRetryNewsroomRequest } from '../src/api/newsroomQuery'
import { newsroomBootstrapPayload } from '../src/lib/newsroom-bootstrap'
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

  test('retries one transient failure only', () => {
    expect(shouldRetryNewsroomRequest(0, new Error('network'))).toBe(true)
    expect(shouldRetryNewsroomRequest(1, new Error('network'))).toBe(false)
    expect(shouldRetryNewsroomRequest(0, new Error('missing', { cause: { status: 404 } }))).toBe(false)
    expect(shouldRetryNewsroomRequest(0, new Error('server', { cause: { status: 503 } }))).toBe(true)
  })
})
