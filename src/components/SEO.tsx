import { Helmet } from 'react-helmet-async'
import { useLocaleContext, DEFAULT_LOCALE, type Locale } from '../lib/i18n'
import { brandConfig, normalizeSeoTitle, resolveSeo } from '../lib/seo'
import { useSeo } from '../api/hooks'
import { buildLocalizedSeoUrl } from '../lib/seoUrl'
import { hasLocalizedVariants } from '../lib/localizedRoute'

export interface SEOProps {
  title: string
  description: string
  canonicalPath: string
  ogImage?: string
  ogType?: string
  noIndex?: boolean
  publishedTime?: string
  modifiedTime?: string
  author?: string
}

/**
 * BCP-47 og:locale codes for our supported 2-letter locales. og:locale wants
 * a `language_TERRITORY` shape; we pick the most common territory variant for
 * each so social embeds render in the right script/typography.
 */
const OG_LOCALES: Record<Locale, string> = {
  en: 'en_US',
  es: 'es_ES',
  fr: 'fr_FR',
  de: 'de_DE',
  it: 'it_IT',
  pt: 'pt_PT',
  ca: 'ca_ES',
  ja: 'ja_JP',
  ko: 'ko_KR',
  zh: 'zh_CN',
  ar: 'ar_SA',
  hi: 'hi_IN',
  bn: 'bn_BD',
  ru: 'ru_RU',
  id: 'id_ID',
}

/** Build the canonical URL for a given path + locale on a brand origin. The
 *  default locale surface lives at the bare URL; non-default locales live under
 *  `/{locale}`. */
function buildLocalizedUrl(origin: string, canonicalPath: string, locale: Locale): string {
  return buildLocalizedSeoUrl(origin, canonicalPath, locale, DEFAULT_LOCALE)
}

/**
 * Per-page meta tags. Two things are resolved here rather than hardcoded:
 *  - **Brand** (oxy.so vs fairco.in) comes from the host, so a FairCoin page
 *    canonicalizes to fairco.in with the FairCoin site_name and OG image,
 *    instead of pointing at oxy.so.
 *  - **Copy** comes from the CMS (`GET /api/seo`) when it has an entry for the
 *    route. The `title`/`description`/`ogImage` props are the fallback used
 *    when the CMS has no entry or is unreachable, so a page is never left
 *    without meta. The prerender seeds the same CMS data so crawlers get it too.
 */
export default function SEO({
  title,
  description,
  canonicalPath,
  ogImage,
  ogType = 'website',
  noIndex = false,
  publishedTime,
  modifiedTime,
  author,
}: SEOProps) {
  const { locale, locales } = useLocaleContext()
  const host = typeof window === 'undefined' ? undefined : window.location.hostname
  const { brand, origin, siteName, ogImage: defaultOgImage } = brandConfig(host)
  const { data: seoData } = useSeo(canonicalPath, brand)
  const cms = resolveSeo(seoData ?? null, canonicalPath, host)

  // A CMS entry for THIS route is editorial intent and wins. The brand-wide
  // `*` entry is only a floor: it fills in for a page that states nothing of
  // its own, and never overwrites the page's title, description or OG image.
  const cmsRoute = cms?.matchedRoute ? cms : null

  const metaTitle = cmsRoute?.title ?? title
  const metaDescription = cmsRoute?.description ?? description
  // A page hands over a site-relative path (the same artwork its card shows);
  // og:image has to be absolute.
  const pageImage = cmsRoute?.ogImage ?? ogImage ?? cms?.ogImage
  const image = pageImage
    ? (pageImage.startsWith('/') ? `${origin}${pageImage}` : pageImage)
    : defaultOgImage

  const fullTitle = canonicalPath === '/'
    ? metaTitle
    : `${normalizeSeoTitle(metaTitle, siteName)} | ${siteName}`
  const canonicalUrl = buildLocalizedUrl(origin, canonicalPath, locale)
  // Advertise only locales that actually have translations. `enabled` is an
  // editorial "show in the picker" toggle that defaults to true, so it says
  // nothing about whether `/<code>/…` would render anything but an English
  // shell. `translationReady` comes from the same server helper the sitemap
  // uses, so the two can never advertise different locale sets — and the server
  // guarantees it is false for the default locale, which lives at the bare path.
  //
  // There is deliberately no static fallback: before the query resolves every
  // entry is translationReady:false, so a cold render advertises nothing rather
  // than all 11 locales. Cold render is exactly when a crawler is most likely
  // to be looking.
  //
  // A route with no translated variant gets no annotations at all. An hreflang
  // set whose members serve the same English bytes tells Google the URLs are
  // equivalent translations when they are plain duplicates, and it answers by
  // picking its own canonical.
  const localized = hasLocalizedVariants(canonicalPath)
  const alternateCodes: readonly Locale[] = localized
    ? locales.filter((l) => l.translationReady).map((l) => l.code)
    : []
  // hreflang is reciprocal: every page in the set must list the whole set,
  // itself included. The default locale is `translationReady: false` by
  // construction (it lives at the bare path and has nothing to translate), so
  // it never came out of the filter above and the set shipped without its own
  // member — leaving `x-default` as the only pointer at the English URL, which
  // is not a substitute. An hreflang set missing a self-reference is invalid
  // and Google drops it whole.
  const hreflangCodes: readonly Locale[] =
    alternateCodes.length > 0 ? [DEFAULT_LOCALE, ...alternateCodes] : []

  return (
    <Helmet>
      <html lang={locale} />
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={canonicalUrl} />
      {/* No theme-color here on purpose. index.html owns that tag
          (`id="site-theme-color"`) and the inline brand script rewrites it per
          host. A second, brand-blind copy emitted from here would land after it
          in <head> and win — repainting FairCoin's chrome with Oxy's color. */}

      {/* hreflang — the default locale's self-reference, one entry per
          translation-ready locale, and x-default → the bare path. Emitted only
          for routes that have translated variants. */}
      {hreflangCodes.map((code) => (
        <link
          key={`hreflang-${code}`}
          rel="alternate"
          hrefLang={code}
          href={buildLocalizedUrl(origin, canonicalPath, code)}
        />
      ))}
      {hreflangCodes.length > 0 && (
        <link rel="alternate" hrefLang="x-default" href={buildLocalizedUrl(origin, canonicalPath, DEFAULT_LOCALE)} />
      )}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={image} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={OG_LOCALES[locale]} />
      {alternateCodes
        .filter((code) => code !== locale)
        .map((code) => (
          <meta key={`og-alt-${code}`} property="og:locale:alternate" content={OG_LOCALES[code]} />
        ))}

      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {author && <meta property="article:author" content={author} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@oxyhqinc" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={image} />

      {noIndex && <meta name="robots" content="noindex, nofollow" />}
    </Helmet>
  )
}
