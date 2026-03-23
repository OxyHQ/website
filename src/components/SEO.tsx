import { Helmet } from 'react-helmet-async'

interface SEOProps {
  title: string
  description: string
  canonicalPath: string
  ogImage?: string
  ogType?: string
  noIndex?: boolean
}

const SITE_URL = 'https://oxy.so'
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`

export default function SEO({
  title,
  description,
  canonicalPath,
  ogImage,
  ogType = 'website',
  noIndex = false,
}: SEOProps) {
  const fullTitle = canonicalPath === '/' ? title : `${title} | Oxy`
  const canonicalUrl = `${SITE_URL}${canonicalPath}`
  const image = ogImage ?? DEFAULT_OG_IMAGE

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={image} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content="Oxy" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {noIndex && <meta name="robots" content="noindex, nofollow" />}
    </Helmet>
  )
}
