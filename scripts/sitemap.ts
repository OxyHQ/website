/**
 * sitemap.xml, built from the exact route list the prerender emits.
 *
 * There is deliberately only one sitemap, and it is generated at build time
 * from `enumerateAllRoutes()`. A second, runtime-generated sitemap used to live
 * in the backend, which produced two problems:
 *
 *  1. `robots.txt` advertises `https://oxy.so/sitemap.xml`, but the backend runs
 *     on `website-api.oxy.so`, and the Pages SPA catch-all (`/*  /index.html`)
 *     answered that URL with the React shell — so crawlers were served HTML
 *     where XML was promised, and the sitemap was never actually read.
 *  2. It enumerated its own, much shorter route list (13 static entries), so it
 *     could advertise URLs the build had not prerendered, and omitted every
 *     help/academy/docs page the build had.
 *
 * Generating from the prerender's own list makes both impossible: a URL is in
 * the sitemap if and only if a document was written for it.
 */

/** One canonical URL, as it will appear in the sitemap. */
export interface SitemapEntry {
  /** Absolute path on the site, e.g. `/pricing`. Bare (no locale prefix). */
  path: string
  /** W3C date (`YYYY-MM-DD`). Omitted when the route has no known date. */
  lastmod?: string
  changefreq: string
  priority: number
}

export interface SitemapOptions {
  siteUrl: string
  defaultLocale: string
  /** Translation-ready locales only — never advertise a locale with no pages. */
  localeCodes: readonly string[]
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** W3C `YYYY-MM-DD`, or undefined for an unparseable input. */
export function toW3CDate(value: string | Date | undefined): string | undefined {
  if (!value) return undefined
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return undefined
  return date.toISOString().slice(0, 10)
}

/**
 * Absolute URL for a path in a locale. The default locale lives at the bare
 * path; every other locale lives under `/<code>`. Mirrors `buildLocalizedUrl`
 * in src/components/SEO.tsx, so the sitemap and the page's own canonical tag
 * always agree.
 */
function localizedUrl(path: string, locale: string, opts: SitemapOptions): string {
  if (locale === opts.defaultLocale) return opts.siteUrl + path
  return `${opts.siteUrl}/${locale}${path === '/' ? '' : path}`
}

/**
 * hreflang alternates as `xhtml:link` annotations on the canonical `<url>`,
 * rather than one `<url>` per locale — the form Google documents, and the one
 * that keeps the file from multiplying by locale count.
 */
function buildAlternates(path: string, opts: SitemapOptions): string {
  if (opts.localeCodes.length === 0) return ''
  const codes = [opts.defaultLocale, ...opts.localeCodes]
  const links = codes.map(
    (code) =>
      `\n    <xhtml:link rel="alternate" hreflang="${escapeXml(code)}" href="${escapeXml(localizedUrl(path, code, opts))}"/>`,
  )
  links.push(
    `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(localizedUrl(path, opts.defaultLocale, opts))}"/>`,
  )
  return links.join('')
}

function buildUrlNode(entry: SitemapEntry, opts: SitemapOptions): string {
  const lastmod = entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : ''
  return `  <url>
    <loc>${escapeXml(opts.siteUrl + entry.path)}</loc>${lastmod}${buildAlternates(entry.path, opts)}
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority.toFixed(1)}</priority>
  </url>`
}

export function buildSitemapXml(entries: readonly SitemapEntry[], opts: SitemapOptions): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.map((entry) => buildUrlNode(entry, opts)).join('\n')}
</urlset>
`
}

/**
 * How often a route changes and how much it matters, derived from its path.
 *
 * Deriving beats a hand-maintained table: the route list comes from the
 * prerender, so a table would need an entry added every time a page is, and a
 * missing entry is invisible until someone reads the XML. Prefixes are ordered
 * most-specific-first.
 */
const ROUTE_WEIGHTS: ReadonlyArray<{ prefix: string; changefreq: string; priority: number }> = [
  { prefix: '/newsroom/', changefreq: 'monthly', priority: 0.7 },
  { prefix: '/company/careers/', changefreq: 'monthly', priority: 0.6 },
  { prefix: '/academy/', changefreq: 'monthly', priority: 0.6 },
  { prefix: '/help/', changefreq: 'monthly', priority: 0.5 },
  { prefix: '/developers/docs/', changefreq: 'monthly', priority: 0.5 },
  { prefix: '/newsroom', changefreq: 'daily', priority: 0.8 },
  { prefix: '/changelog', changefreq: 'weekly', priority: 0.7 },
  { prefix: '/company/careers', changefreq: 'weekly', priority: 0.7 },
  { prefix: '/company/news', changefreq: 'weekly', priority: 0.7 },
  { prefix: '/developers/docs', changefreq: 'monthly', priority: 0.7 },
  { prefix: '/pricing', changefreq: 'monthly', priority: 0.9 },
  { prefix: '/codea', changefreq: 'monthly', priority: 0.9 },
]

export function classifyRoute(path: string): { changefreq: string; priority: number } {
  if (path === '/') return { changefreq: 'weekly', priority: 1.0 }
  for (const weight of ROUTE_WEIGHTS) {
    if (path === weight.prefix || path.startsWith(weight.prefix)) {
      return { changefreq: weight.changefreq, priority: weight.priority }
    }
  }
  // Everything else is a top-level marketing page (/os, /partners, /help, …).
  // Depth is a good enough proxy for importance once the named cases are out.
  const depth = path.split('/').filter(Boolean).length
  return { changefreq: 'monthly', priority: depth <= 1 ? 0.8 : 0.6 }
}
