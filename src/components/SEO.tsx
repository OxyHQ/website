import { Helmet } from 'react-helmet-async'
import { useLocaleContext, DEFAULT_LOCALE, type Locale } from '../lib/i18n'
import { brandConfig, resolveSeo } from '../lib/seo'
import { useSeo } from '../api/hooks'

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
}

/** Build the canonical URL for a given path + locale on a brand origin. The
 *  default locale surface lives at the bare URL; non-default locales live under
 *  `/{locale}`. */
function buildLocalizedUrl(origin: string, canonicalPath: string, locale: Locale): string {
  const cleanPath = canonicalPath === '/' ? '' : canonicalPath
  if (locale === DEFAULT_LOCALE) return `${origin}${canonicalPath}`
  return `${origin}/${locale}${cleanPath}`
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

  const metaTitle = cms?.title ?? title
  const metaDescription = cms?.description ?? description
  const image = cms?.ogImage ?? ogImage ?? defaultOgImage

  const fullTitle = canonicalPath === '/' ? metaTitle : `${metaTitle} | ${siteName}`
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
  const alternateCodes: readonly Locale[] = locales
    .filter((l) => l.translationReady)
    .map((l) => l.code)

  return (
    <Helmet>
      <html lang={locale} />
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={canonicalUrl} />
      <meta name="theme-color" content="#0a0a0b" />

      {/* hreflang — one entry per translation-ready locale, plus x-default →
          the bare (default-locale) path. */}
      {alternateCodes.map((code) => (
        <link
          key={`hreflang-${code}`}
          rel="alternate"
          hrefLang={code}
          href={buildLocalizedUrl(origin, canonicalPath, code)}
        />
      ))}
      <link rel="alternate" hrefLang="x-default" href={buildLocalizedUrl(origin, canonicalPath, DEFAULT_LOCALE)} />

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
