import type { QueryClient } from '@tanstack/react-query'
import type { NewsroomPost } from '../data/newsroom'
import type { Locale } from '../lib/i18n'
import { apiFetch, errorStatus } from './client'

export const NEWSROOM_REQUEST_TIMEOUT_MS = 8_000

export function newsroomPostQueryKey(slug: string, locale: Locale) {
  return ['newsroom', slug, locale] as const
}

export function newsroomRequestSignal(parent: AbortSignal): AbortSignal {
  const timeout = AbortSignal.timeout(NEWSROOM_REQUEST_TIMEOUT_MS)
  return AbortSignal.any([parent, timeout])
}

export async function fetchNewsroomPost(
  slug: string,
  locale: Locale,
  signal: AbortSignal,
): Promise<NewsroomPost> {
  if (import.meta.env.DEV && slug === 'article-components-showcase-preview') {
    const { articleComponentsShowcasePost } = await import(
      '../content/newsroom-previews/article-components-showcase'
    )
    return articleComponentsShowcasePost
  }

  return apiFetch<NewsroomPost>(`/newsroom/${encodeURIComponent(slug)}`, {
    locale,
    signal: newsroomRequestSignal(signal),
  })
}

/** Retry one transient failure; never retry a deterministic client response. */
export function shouldRetryNewsroomRequest(failureCount: number, error: Error): boolean {
  if (failureCount >= 1) return false
  const status = errorStatus(error)
  return status === undefined || status === 408 || status === 429 || status >= 500
}

export function prefetchNewsroomPost(
  client: QueryClient,
  slug: string,
  locale: Locale,
): Promise<void> {
  return client.prefetchQuery({
    queryKey: newsroomPostQueryKey(slug, locale),
    queryFn: ({ signal }) => fetchNewsroomPost(slug, locale, signal),
    staleTime: 5 * 60_000,
    retry: shouldRetryNewsroomRequest,
  })
}
