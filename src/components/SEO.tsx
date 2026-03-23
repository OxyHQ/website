import { Helmet } from 'react-helmet-async'

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

const SITE_URL = 'https://oxy.so'
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`

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
  const fullTitle = canonicalPath === '/' ? title : `${title} | Oxy`
  const canonicalUrl = `${SITE_URL}${canonicalPath}`
  const image = ogImage ?? DEFAULT_OG_IMAGE

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      <meta name="theme-color" content="#0a0a0b" />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={image} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content="Oxy" />
      <meta property="og:locale" content="en_US" />

      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {author && <meta property="article:author" content={author} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@oxyhqinc" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {noIndex && <meta name="robots" content="noindex, nofollow" />}
    </Helmet>
  )
}
