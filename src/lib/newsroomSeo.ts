/**
 * Shared Newsroom SEO builders.
 *
 * Both the browser pages and `scripts/prerender.ts` consume these helpers so
 * article titles and structured data cannot drift between the initial HTML and
 * the client-rendered head.
 */

import { normalizeSeoTitle } from './seo'
import { buildLocalizedSeoUrl } from './seoUrl'

export interface NewsroomSeoBrand {
  origin: string
  siteName: string
  ogImage: string
}

export interface NewsroomSeoPost {
  slug: string
  title: string
  resume?: string
  description?: string
  coverImage?: string
  ogImage?: string
  publishedAt?: string
  updatedAt?: string
  authorUsername?: string
  tags?: readonly string[]
  categories?: readonly string[]
}

/**
 * `<SEO>` appends the active brand name to non-homepage titles. Editorial
 * `metaTitle` values sometimes already contain that suffix, so remove every
 * trailing copy before handing the title to `<SEO>`.
 */
export function normalizeNewsroomSeoTitle(title: string, siteName: string): string {
  return normalizeSeoTitle(title, siteName)
}

function absoluteUrl(origin: string, value: string): string {
  if (/^https?:\/\//i.test(value)) return value
  return `${origin}${value.startsWith('/') ? '' : '/'}${value}`
}

function newsroomPostUrl(origin: string, slug: string): string {
  return buildLocalizedSeoUrl(origin, `/newsroom/${slug}`, 'en', 'en')
}

function publisher(brand: NewsroomSeoBrand): Record<string, unknown> {
  return {
    '@type': 'Organization',
    name: brand.siteName,
    url: `${brand.origin}/`,
    logo: { '@type': 'ImageObject', url: `${brand.origin}/favicon.svg` },
  }
}

export function buildNewsroomArticleStructuredData(
  post: NewsroomSeoPost,
  brand: NewsroomSeoBrand,
): Record<string, unknown> {
  const url = newsroomPostUrl(brand.origin, post.slug)
  const description = post.description || post.resume || post.title
  const image = absoluteUrl(brand.origin, post.ogImage || post.coverImage || brand.ogImage)
  const author = post.authorUsername
    ? {
        '@type': 'Person',
        name: post.authorUsername,
        // Trailing slash for the same reason as every other URL this file
        // publishes: the bare form is a 308.
        url: `${brand.origin}/u/${encodeURIComponent(post.authorUsername)}/`,
      }
    : publisher(brand)

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'NewsArticle',
        '@id': `${url}#article`,
        headline: post.title,
        description,
        image,
        datePublished: post.publishedAt,
        dateModified: post.updatedAt || post.publishedAt,
        author,
        publisher: publisher(brand),
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        articleSection: post.categories?.[0],
        keywords: post.tags && post.tags.length > 0 ? [...post.tags] : undefined,
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumbs`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: `${brand.origin}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Newsroom',
            item: buildLocalizedSeoUrl(brand.origin, '/newsroom', 'en', 'en'),
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: post.title,
            item: url,
          },
        ],
      },
    ],
  }
}

export function buildNewsroomCollectionStructuredData(
  posts: readonly NewsroomSeoPost[],
  brand: NewsroomSeoBrand,
  title: string,
  description: string,
): Record<string, unknown> {
  const url = buildLocalizedSeoUrl(brand.origin, '/newsroom', 'en', 'en')
  const items = posts.map((post, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: post.title,
    url: newsroomPostUrl(brand.origin, post.slug),
  }))

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${url}#collection`,
        name: title,
        description,
        url,
        isPartOf: { '@type': 'WebSite', name: brand.siteName, url: `${brand.origin}/` },
        publisher: publisher(brand),
        mainEntity: { '@id': `${url}#articles` },
      },
      {
        '@type': 'ItemList',
        '@id': `${url}#articles`,
        name: `${title} articles`,
        numberOfItems: items.length,
        itemListElement: items,
      },
    ],
  }
}
