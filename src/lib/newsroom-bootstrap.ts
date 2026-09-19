import type { QueryClient } from '@tanstack/react-query'
import type { NewsroomPost, NewsroomPostSummary } from '../data/newsroom'
import { newsroomPostQueryKey, newsroomPostsQueryKey } from '../api/newsroomQuery'
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from './i18n'

export const NEWSROOM_BOOTSTRAP_ID = 'newsroom-post-bootstrap'
export const NEWSROOM_INDEX_BOOTSTRAP_ID = 'newsroom-index-bootstrap'

interface NewsroomBootstrapPayload {
  locale: Locale
  post: NewsroomPost
}

export interface NewsroomIndexData {
  posts: NewsroomPostSummary[]
  total: number
  page: number
  pages: number
}

interface NewsroomIndexBootstrapPayload {
  locale: Locale
  data: NewsroomIndexData
}

function isPayload(value: unknown): value is NewsroomBootstrapPayload {
  if (!value || typeof value !== 'object') return false
  const payload = value as Partial<NewsroomBootstrapPayload>
  return (
    typeof payload.locale === 'string' &&
    SUPPORTED_LOCALES.includes(payload.locale as Locale) &&
    !!payload.post &&
    typeof payload.post.slug === 'string' &&
    typeof payload.post.title === 'string' &&
    typeof payload.post.content === 'string'
  )
}

function isSummary(value: unknown): value is NewsroomPostSummary {
  if (!value || typeof value !== 'object') return false
  const post = value as Partial<NewsroomPostSummary>
  return (
    typeof post.slug === 'string' &&
    typeof post.title === 'string' &&
    typeof post.resume === 'string' &&
    Array.isArray(post.categories) &&
    typeof post.featured === 'boolean' &&
    typeof post.publishedAt === 'string'
  )
}

function isIndexPayload(value: unknown): value is NewsroomIndexBootstrapPayload {
  if (!value || typeof value !== 'object') return false
  const payload = value as Partial<NewsroomIndexBootstrapPayload>
  return (
    typeof payload.locale === 'string' &&
    SUPPORTED_LOCALES.includes(payload.locale as Locale) &&
    !!payload.data &&
    Array.isArray(payload.data.posts) &&
    payload.data.posts.every(isSummary) &&
    typeof payload.data.total === 'number' &&
    typeof payload.data.page === 'number' &&
    typeof payload.data.pages === 'number'
  )
}

function readTemplatePayload(doc: Document, id: string): unknown {
  const template = doc.getElementById(id)
  if (!(template instanceof HTMLTemplateElement)) return null

  try {
    return JSON.parse(template.content.textContent ?? '') as unknown
  } catch {
    return null
  }
}

/**
 * Reads the inert `<template>` emitted by `scripts/prerender.ts` and seeds the
 * exact React Query key used by either the index or detail page. A template is
 * deliberate: it carries data without adding inline script to the site's CSP.
 */
export function seedNewsroomBootstrap(
  client: QueryClient,
  doc: Document = document,
): NewsroomPost | null {
  const indexPayload = readTemplatePayload(doc, NEWSROOM_INDEX_BOOTSTRAP_ID)
  if (isIndexPayload(indexPayload)) {
    client.setQueryData(
      newsroomPostsQueryKey({ limit: 50 }, indexPayload.locale),
      indexPayload.data,
      { updatedAt: Date.now() },
    )
  }

  const payload = readTemplatePayload(doc, NEWSROOM_BOOTSTRAP_ID)
  if (isPayload(payload)) {
    client.setQueryData(newsroomPostQueryKey(payload.post.slug, payload.locale), payload.post, {
      updatedAt: Date.now(),
    })
    return payload.post
  }

  return null
}

export function newsroomBootstrapPayload(post: NewsroomPost): NewsroomBootstrapPayload {
  return { locale: DEFAULT_LOCALE, post }
}

export function newsroomIndexBootstrapPayload(
  posts: NewsroomPostSummary[],
): NewsroomIndexBootstrapPayload {
  return {
    locale: DEFAULT_LOCALE,
    data: {
      posts,
      total: posts.length,
      page: 1,
      pages: posts.length > 0 ? 1 : 0,
    },
  }
}
