import type { QueryClient } from '@tanstack/react-query'
import type { NewsroomPost } from '../data/newsroom'
import { newsroomPostQueryKey } from '../api/newsroomQuery'
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from './i18n'

export const NEWSROOM_BOOTSTRAP_ID = 'newsroom-post-bootstrap'

interface NewsroomBootstrapPayload {
  locale: Locale
  post: NewsroomPost
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

/**
 * Reads the inert `<template>` emitted by `scripts/prerender.ts` and seeds the
 * exact React Query key used by the detail page. A template is deliberate: it
 * carries data without adding a per-article inline script to the site's CSP.
 */
export function seedNewsroomBootstrap(
  client: QueryClient,
  doc: Document = document,
): NewsroomPost | null {
  const template = doc.getElementById(NEWSROOM_BOOTSTRAP_ID)
  if (!(template instanceof HTMLTemplateElement)) return null

  try {
    const payload = JSON.parse(template.content.textContent ?? '') as unknown
    if (!isPayload(payload)) return null
    client.setQueryData(newsroomPostQueryKey(payload.post.slug, payload.locale), payload.post, {
      updatedAt: Date.now(),
    })
    return payload.post
  } catch {
    return null
  }
}

export function newsroomBootstrapPayload(post: NewsroomPost): NewsroomBootstrapPayload {
  return { locale: DEFAULT_LOCALE, post }
}
