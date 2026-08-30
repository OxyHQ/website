/// <reference types="@cloudflare/workers-types" />
import { brandForHost, resolveSeoOrDefault, type SeoData } from '../src/lib/seo'
import { hasPrerenderedNewsroomPost, matchNewsroomPostPath } from './newsroom-status'

/**
 * Cloudflare Pages edge middleware: per-host SEO at request time.
 *
 * One static build is served on both oxy.so and fairco.in. Crawlers don't run
 * JS, so without this they'd read the prerendered Oxy `<head>` on fairco.in
 * (wrong title/description/OG when a FairCoin link is shared). This rewrites the
 * meta tags by Host before the bytes leave the edge.
 *
 * Oxy is the prerendered default, so Oxy requests pass straight through. Only
 * FairCoin hosts get rewritten, and only HTML responses. The metadata is
 * CMS-managed (`GET /api/seo?brand&path`, edge-cached); if that is unseeded or unreachable
 * we fall back to the brand bootstrap meta, so this can never make things worse.
 */

/** Cloudflare Pages runtime bindings this middleware reads. */
interface Env {
  /**
   * Website backend origin, mirroring the `VITE_API_URL` the SPA reads. Set it
   * as a Pages environment variable to point a preview deployment at a staging
   * backend; unset it falls back to production.
   */
  VITE_API_URL?: string
}

const DEFAULT_API_BASE = 'https://website-api.oxy.so'

async function fetchSeoData(
  apiBase: string,
  pathname: string,
  brand: string,
): Promise<SeoData | null> {
  try {
    const url = new URL(`${apiBase}/api/seo`)
    url.searchParams.set('brand', brand)
    url.searchParams.set('path', pathname)
    const res = await fetch(url.toString(), {
      cf: { cacheTtl: 300, cacheEverything: true },
    } as RequestInit)
    if (!res.ok) return null
    return (await res.json()) as SeoData
  } catch (err) {
    console.error('[seo-middleware] /api/seo fetch failed:', err)
    return null
  }
}

async function newsroomPostExists(
  apiBase: string,
  slug: string,
  locale?: string,
): Promise<boolean | null> {
  try {
    const url = new URL(`${apiBase}/api/newsroom/${encodeURIComponent(slug)}`)
    if (locale) url.searchParams.set('locale', locale)
    const res = await fetch(url.toString(), {
      cf: { cacheTtl: 60, cacheEverything: true },
    } as RequestInit)
    if (res.ok) return true
    if (res.status === 404) return false
    return null
  } catch (err) {
    console.error('[newsroom-status] detail probe failed:', err)
    return null
  }
}

function asNotFound(response: Response, html: string): Response {
  const headers = new Headers(response.headers)
  headers.set('Cache-Control', 'public, max-age=60, must-revalidate')
  headers.set('X-Robots-Tag', 'noindex, nofollow')
  return new Response(html, { status: 404, statusText: 'Not Found', headers })
}

const onRequest: PagesFunction<Env> = async (context) => {
  const { request, next, env } = context
  const url = new URL(request.url)
  let response = await next()
  if (!(response.headers.get('content-type') ?? '').includes('text/html')) return response

  // Pages' SPA fallback returns index.html with 200 for any unknown path. For
  // Newsroom detail URLs, preserve valid prerendered files and convert only an
  // API-confirmed missing slug to a real HTTP 404. Backend failures remain 200
  // rather than incorrectly de-indexing a live article during an outage.
  const newsroomPath = matchNewsroomPostPath(url.pathname)
  if (newsroomPath && response.status === 200) {
    const html = await response.clone().text()
    if (!hasPrerenderedNewsroomPost(html)) {
      const exists = await newsroomPostExists(
        env.VITE_API_URL || DEFAULT_API_BASE,
        newsroomPath.slug,
        newsroomPath.locale,
      )
      if (exists === false) return asNotFound(response, html)
    }
  }

  // Oxy is the prerendered default — only FairCoin needs host-specific meta.
  if (brandForHost(url.hostname) !== 'faircoin') return response

  try {
    const seoData = await fetchSeoData(env.VITE_API_URL || DEFAULT_API_BASE, url.pathname, 'faircoin')
    const meta = resolveSeoOrDefault(seoData, url.pathname, url.hostname)
    const setContent = (value: string) => ({
      element(el: Element) {
        el.setAttribute('content', value)
      },
    })
    response = new HTMLRewriter()
      .on('title', {
        element(el) {
          el.setInnerContent(meta.title)
        },
      })
      .on('meta[name="description"]', setContent(meta.description))
      .on('meta[property="og:title"]', setContent(meta.title))
      .on('meta[property="og:description"]', setContent(meta.description))
      .on('meta[property="og:url"]', setContent(meta.canonical))
      .on('meta[property="og:image"]', setContent(meta.ogImage))
      .on('meta[property="og:site_name"]', setContent(meta.siteName))
      .on('meta[name="twitter:title"]', setContent(meta.title))
      .on('meta[name="twitter:description"]', setContent(meta.description))
      .on('meta[name="twitter:image"]', setContent(meta.ogImage))
      .on('link[rel="canonical"]', {
        element(el) {
          el.setAttribute('href', meta.canonical)
        },
      })
      .transform(response)
    return response
  } catch (err) {
    // Never let a rewrite error break delivery — serve the original document.
    console.error('[seo-middleware] rewrite failed:', err)
    return response
  }
}

export { onRequest }
