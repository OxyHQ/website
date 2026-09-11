/**
 * The canonical shape of an internal URL, for anything that renders a link.
 *
 * Cloudflare Pages serves a prerendered route from `dist/<route>/index.html`
 * and answers the slash-less form with a 308 to the trailing-slash one. Every
 * `<Link to="/pricing">` in the app therefore rendered `href="/pricing"` — a
 * URL that redirects. Googlebot crawls hrefs, so the whole route tree was
 * discovered in its redirecting shape and filed under "Page with redirect"
 * instead of being indexed, while the canonical tag and the sitemap advertised
 * the trailing-slash form that nothing on the site linked to.
 *
 * These helpers run `withDocumentTrailingSlash` — the same function behind the
 * canonical tag, the hreflang set and the sitemap — over link targets, so the
 * signals cannot disagree. React Router matches slash-agnostically, so routes
 * keep their bare `path` declarations.
 */
import type { To } from 'react-router-dom'
import { withDocumentTrailingSlash } from './seoUrl'

/**
 * Extensions of things `public/` serves verbatim. A slash appended to one of
 * these is a 404, so they are the exception to the rule below.
 *
 * Deliberately an allow-list rather than "the last segment contains a dot":
 * typedoc names a symbol page `ColorEngine.argbFromHex`, and the dot rule left
 * every one of the ~1,700 generated API reference cross-links pointing at a
 * URL that 308s.
 */
const STATIC_FILE_EXTENSIONS: readonly string[] = [
  '.txt', '.xml', '.json', '.webmanifest', '.pdf', '.zip', '.csv',
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif', '.ico',
  '.mp4', '.webm', '.mp3', '.woff', '.woff2', '.ttf',
  '.css', '.js', '.mjs', '.map', '.html',
]

/**
 * True for a path this site serves as a prerendered document, i.e. one that
 * Cloudflare answers at `<path>/`. False for a file in `public/`
 * (`/llms.txt`, `/og-default.png`), which is served exactly as named.
 */
export function isDocumentPath(pathname: string): boolean {
  const last = pathname.split('/').filter(Boolean).pop()
  if (last === undefined) return true
  const lower = last.toLowerCase()
  return !STATIC_FILE_EXTENSIONS.some((extension) => lower.endsWith(extension))
}

/**
 * Origins this build serves. An absolute link to one of them is an internal
 * link written the long way — prose in the synced docs does exactly that
 * (`[the newsroom](https://oxy.so/newsroom)`) — and redirects like any other.
 * Mirrors `BRANDS` in `./seo`; kept here so this module stays dependency-free.
 */
const SITE_ORIGINS: readonly string[] = ['https://oxy.so', 'https://fairco.in']

/** Normalise a site-internal `to` to its canonical trailing-slash form. */
export function canonicalTo(to: To): To {
  if (typeof to === 'string') {
    for (const origin of SITE_ORIGINS) {
      if (to === origin) return `${origin}/`
      if (to.startsWith(`${origin}/`)) {
        const rest = canonicalTo(to.slice(origin.length))
        return typeof rest === 'string' ? `${origin}${rest}` : to
      }
    }
    // Relative (`../x`), bare hash (`#faq`) and third-party absolute targets
    // are not documents this build controls.
    if (!to.startsWith('/') || to.startsWith('//')) return to
    const pathname = to.split(/[?#]/)[0] ?? ''
    if (!isDocumentPath(pathname)) return to
    return withDocumentTrailingSlash(to)
  }
  if (!to.pathname || !to.pathname.startsWith('/') || !isDocumentPath(to.pathname)) return to
  return { ...to, pathname: withDocumentTrailingSlash(to.pathname) }
}

/**
 * Canonical form of a raw `href`, for markup this app renders but does not
 * route: prose links out of Markdown/MDX and hand-written anchors.
 */
export function canonicalHref(href: string | undefined): string | undefined {
  if (href === undefined) return href
  const to = canonicalTo(href)
  return typeof to === 'string' ? to : href
}
