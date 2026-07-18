/// <reference types="@cloudflare/workers-types" />
import { brandForHost, resolveSeoOrDefault, type SeoData } from '../src/lib/seo'

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

const onRequest: PagesFunction<Env> = async (context) => {
  const { request, next, env } = context

  // Oxy is the prerendered default — nothing to rewrite.
  const url = new URL(request.url)
  if (brandForHost(url.hostname) !== 'faircoin') return next()

  const response = await next()
  if (!(response.headers.get('content-type') ?? '').includes('text/html')) return response

  try {
    const seoData = await fetchSeoData(env.VITE_API_URL || DEFAULT_API_BASE, url.pathname, 'faircoin')
    const meta = resolveSeoOrDefault(seoData, url.pathname, url.hostname)
    const setContent = (value: string) => ({
      element(el: Element) {
        el.setAttribute('content', value)
      },
    })
    return new HTMLRewriter()
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
  } catch (err) {
    // Never let a rewrite error break delivery — serve the original document.
    console.error('[seo-middleware] rewrite failed:', err)
    return response
  }
}

export { onRequest }
