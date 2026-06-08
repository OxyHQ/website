import { Helmet } from 'react-helmet-async'
import { useLocaleContext, SUPPORTED_LOCALES, DEFAULT_LOCALE, type Locale } from '../lib/i18n'
import { brandConfig, resolveSeo } from '../lib/seo'
import { useSeo } from '../api/hooks'

interface SEOProps {
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
  const { brand, origin, siteName } = brandConfig(host)
  const { data: seoData } = useSeo()
  const cms = resolveSeo(seoData ?? null, canonicalPath, host)

  const metaTitle = cms?.title ?? title
  const metaDescription = cms?.description ?? description
  const defaultOgImage = `${origin}${brand === 'faircoin' ? '/og-faircoin.png' : '/og-default.png'}`
  const image = cms?.ogImage ?? ogImage ?? defaultOgImage

  const fullTitle = canonicalPath === '/' ? metaTitle : `${metaTitle} | ${siteName}`
  const canonicalUrl = buildLocalizedUrl(origin, canonicalPath, locale)
  // Restrict hreflang output to locales the API exposes as enabled, falling
  // back to the static SUPPORTED_LOCALES list if the picker hasn't hydrated.
  const enabledCodes: readonly Locale[] =
    locales.length > 0 ? locales.map((l) => l.code) : SUPPORTED_LOCALES

  return (
    <Helmet>
      <html lang={locale} />
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={canonicalUrl} />
      <meta name="theme-color" content="#0a0a0b" />

      {/* hreflang — one entry per enabled locale plus x-default → English. */}
      {enabledCodes.map((code) => (
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
      {enabledCodes
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
