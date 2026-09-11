/**
 * Which routes exist in a locale other than the default — the single authority
 * shared by `<SEO>` (hreflang), `scripts/sitemap.ts` (`xhtml:link` alternates)
 * and `scripts/prerender.ts` (which `/<code>/…` documents get written).
 *
 * The site's chrome and its marketing copy come from `src/lib/i18n/locales/`,
 * so those pages really are translated. The synced developer documentation does
 * not: `src/content/_synced/**` is generated upstream from each package's own
 * English source, and `/es/developers/docs/bloom/1.0.0/use-theme/` served a
 * byte-identical copy of the English page under a Spanish URL.
 *
 * That is 2,087 of the site's 2,217 routes. Mirrored across the two
 * translation-ready locales it published ~4,200 duplicate URLs, advertised them
 * as translations via hreflang, and spent the crawl budget that the pages we do
 * want indexed were waiting for — Search Console filed 1,171 URLs as
 * "Discovered – currently not indexed".
 *
 * A prefix listed here is not "untranslatable", it is "not translated yet". The
 * day the docs sync gains localized sources, drop the prefix and the locale
 * mirrors, hreflang annotations and sitemap alternates all come back together,
 * because all three read this function.
 */
const UNTRANSLATED_PREFIXES: readonly string[] = ['/developers/docs']

/**
 * True when `path` (a bare, default-locale route path) has a real translation
 * and may therefore be mirrored, advertised in hreflang and given sitemap
 * alternates.
 */
export function hasLocalizedVariants(path: string): boolean {
  const normalized = path.replace(/\/+$/, '') || '/'
  return !UNTRANSLATED_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
  )
}
