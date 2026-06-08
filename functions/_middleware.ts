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
 * CMS-managed (`GET /api/seo`, edge-cached); if that is unseeded or unreachable
 * we fall back to the brand bootstrap meta, so this can never make things worse.
 */

const SEO_API = 'https://website-api.oxy.so/api/seo'

async function fetchSeoData(): Promise<SeoData | null> {
  try {
    const res = await fetch(SEO_API, {
      cf: { cacheTtl: 300, cacheEverything: true },
    } as RequestInit)
    if (!res.ok) return null
    return (await res.json()) as SeoData
  } catch (err) {
    console.error('[seo-middleware] /api/seo fetch failed:', err)
    return null
  }
}

const onRequest: PagesFunction = async (context) => {
  const { request, next } = context

  // Oxy is the prerendered default — nothing to rewrite.
  const url = new URL(request.url)
  if (brandForHost(url.hostname) !== 'faircoin') return next()

  const response = await next()
  if (!(response.headers.get('content-type') ?? '').includes('text/html')) return response

  try {
    const meta = resolveSeoOrDefault(await fetchSeoData(), url.pathname, url.hostname)
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
