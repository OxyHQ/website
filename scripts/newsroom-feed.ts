import type { NewsroomPost } from '../src/data/newsroom'

export interface NewsroomFeedOptions {
  siteUrl: string
  title: string
  description: string
}

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
  })[character] ?? character)
}

function absoluteUrl(origin: string, value: string): string {
  if (/^https?:\/\//i.test(value)) return value
  return `${origin}${value.startsWith('/') ? '' : '/'}${value}`
}

function imageMimeType(value: string): string {
  const pathname = value.toLowerCase().split(/[?#]/, 1)[0]
  if (pathname.endsWith('.png')) return 'image/png'
  if (pathname.endsWith('.webp')) return 'image/webp'
  if (pathname.endsWith('.gif')) return 'image/gif'
  if (pathname.endsWith('.svg')) return 'image/svg+xml'
  return 'image/jpeg'
}

/** Build the public RSS document from the same rows used by prerender + sitemap. */
export function buildNewsroomRss(
  posts: readonly NewsroomPost[],
  options: NewsroomFeedOptions,
): string {
  const siteUrl = options.siteUrl.replace(/\/$/, '')
  const feedUrl = `${siteUrl}/newsroom.xml`
  const sorted = [...posts].sort(
    (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
  )
  const lastBuildDate = sorted[0]?.updatedAt || sorted[0]?.publishedAt
  const items = sorted.map((post) => {
    const url = `${siteUrl}/newsroom/${encodeURIComponent(post.slug)}`
    const categories = post.categories
      .map((category) => `<category>${escapeXml(category)}</category>`)
      .join('')
    const enclosure = post.coverImage
      ? `<enclosure url="${escapeXml(absoluteUrl(siteUrl, post.coverImage))}" type="${imageMimeType(post.coverImage)}"/>`
      : ''
    return [
      '<item>',
      `<title>${escapeXml(post.title)}</title>`,
      `<link>${escapeXml(url)}</link>`,
      `<guid isPermaLink="true">${escapeXml(url)}</guid>`,
      `<pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>`,
      `<description>${escapeXml(post.resume || post.description || post.title)}</description>`,
      categories,
      enclosure,
      '</item>',
    ].join('')
  }).join('')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '<channel>',
    `<title>${escapeXml(options.title)}</title>`,
    `<link>${escapeXml(`${siteUrl}/newsroom`)}</link>`,
    `<description>${escapeXml(options.description)}</description>`,
    '<language>en</language>',
    `<atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml"/>`,
    lastBuildDate ? `<lastBuildDate>${new Date(lastBuildDate).toUTCString()}</lastBuildDate>` : '',
    items,
    '</channel>',
    '</rss>',
    '',
  ].join('\n')
}
