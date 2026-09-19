/**
 * Canonical public URLs follow the shape Cloudflare Pages actually serves:
 * the homepage is `/`, and every other document ends in `/`.
 *
 * Internal React Router paths intentionally remain slash-agnostic. This helper
 * is only for externally visible SEO signals (canonical, hreflang, sitemap,
 * structured data and feeds), where publishing a URL that immediately 308s
 * wastes crawl budget and weakens canonical agreement.
 */
export function withDocumentTrailingSlash(value: string): string {
  const suffixIndex = value.search(/[?#]/)
  const pathname = suffixIndex === -1 ? value : value.slice(0, suffixIndex)
  const suffix = suffixIndex === -1 ? '' : value.slice(suffixIndex)
  const rooted = pathname.startsWith('/') ? pathname : `/${pathname}`
  const normalized = rooted === '/' ? '/' : `${rooted.replace(/\/+$/, '')}/`
  return normalized + suffix
}

/** Build one canonical/hreflang URL for the default or a translated locale. */
export function buildLocalizedSeoUrl(
  origin: string,
  canonicalPath: string,
  locale: string,
  defaultLocale: string,
): string {
  const cleanOrigin = origin.replace(/\/+$/, '')
  const path = withDocumentTrailingSlash(canonicalPath)
  if (locale === defaultLocale) return `${cleanOrigin}${path}`
  if (path === '/') return `${cleanOrigin}/${locale}/`
  return `${cleanOrigin}/${locale}${path}`
}

