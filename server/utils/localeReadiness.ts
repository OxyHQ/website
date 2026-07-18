import { Locale } from '../models/Locale.js'
import { Translation } from '../models/Translation.js'
import { config } from '../config.js'

/**
 * Minimum Translation documents a locale needs before its `/<code>/…` URLs are
 * advertised in the sitemap or prerendered by the build.
 *
 * Site chrome alone (navigation, footer, settings) accounts for roughly three
 * rows, so this floor demands real page content on top of the chrome and stops
 * a locale carrying a few stray strings from emitting an entire URL tree.
 * Prerendering every supported locale unconditionally would emit ~16,400 files
 * against Cloudflare Pages' 20,000-file limit, which is what this gates.
 */
export const MIN_TRANSLATIONS_FOR_LOCALE_URLS = 5

/** Readiness facts attached to every locale the public API returns. */
export interface LocaleReadiness {
  /**
   * Translation documents stored for this locale. Always 0 for a default
   * locale: default-locale copy lives in the source documents themselves, so
   * no Translation rows exist for it by design.
   */
  translationCount: number
  /**
   * Whether this locale's prefixed URLs should be advertised and prerendered.
   * False for both default locales regardless of count — the default surface
   * lives at the bare path and has no `/<code>/` prefix.
   */
  translationReady: boolean
}

/**
 * The locales that must never receive a `/<code>/` prefix: the CMS-configured
 * default (whose copy lives in the source documents) and the static default the
 * SPA routes on. They are normally the same value; both are excluded so a
 * mismatch between them can never produce a prefixed URL for a default locale.
 */
function defaultCodes(cmsDefault: string | undefined): string[] {
  return [...new Set([config.defaultLocale, ...(cmsDefault ? [cmsDefault] : [])])]
}

/**
 * Counts Translation documents per locale in ONE aggregation, grouped on the
 * `locale` field. `$group` is served by the `{ locale, collectionName,
 * documentId }` index because `locale` is its leading key, so this is an index
 * scan rather than a full-collection scan.
 */
async function countTranslationsByLocale(excluded: string[]): Promise<Map<string, number>> {
  const rows = await Translation.aggregate<{ _id: string; count: number }>([
    { $match: { locale: { $nin: excluded } } },
    { $group: { _id: '$locale', count: { $sum: 1 } } },
  ])
  return new Map(rows.map(row => [row._id, row.count]))
}

/**
 * Enabled locales, ordered, each annotated with its translation readiness.
 *
 * Single source of truth for "which locales get prefixed URLs" — the public
 * `/api/locales` response and the sitemap's hreflang alternates both derive
 * from this, so the two can never advertise different locale sets.
 */
export async function getEnabledLocalesWithReadiness() {
  const locales = await Locale.find({ enabled: true }).sort('order').lean()
  const excluded = defaultCodes(locales.find(l => l.isDefault)?.code)
  const counts = await countTranslationsByLocale(excluded)

  return locales.map(locale => {
    const isDefault = excluded.includes(locale.code)
    const translationCount = isDefault ? 0 : counts.get(locale.code) ?? 0
    return {
      ...locale,
      translationCount,
      translationReady: !isDefault && translationCount >= MIN_TRANSLATIONS_FOR_LOCALE_URLS,
    }
  })
}
