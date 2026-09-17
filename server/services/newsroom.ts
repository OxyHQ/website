import { inArray } from 'drizzle-orm'
import { db } from '../db/postgres.js'
import { media, newsroomPosts, products } from '../db/schema/index.js'

/* ──────────────────────────────────────────────
 * Newsroom representations, shared by the REST route and the MCP tools so a
 * post reads the same through both: the summary a listing carries, and the
 * product references a full post expands.
 * ──────────────────────────────────────────── */

/** Single-valued refs resolved inline on every post. */
export const NEWSROOM_REFS = { coverImage: media, ogImage: media }

/**
 * The public feed only needs the fields rendered by newsroom cards and rails.
 * In particular, selecting the markdown body here made every listing request
 * transfer every article before a visitor chose one to read.
 */
export const NEWSROOM_SUMMARY_COLUMNS = {
  _id: newsroomPosts._id,
  title: newsroomPosts.title,
  slug: newsroomPosts.slug,
  resume: newsroomPosts.resume,
  coverImage: newsroomPosts.coverImage,
  imageAlt: newsroomPosts.imageAlt,
  categories: newsroomPosts.categories,
  featured: newsroomPosts.featured,
  themePreset: newsroomPosts.themePreset,
  publishedAt: newsroomPosts.publishedAt,
}

export function toNewsroomSummary(post: Record<string, unknown>): Record<string, unknown> {
  return {
    _id: post._id,
    title: post.title,
    slug: post.slug,
    resume: post.resume,
    coverImage: post.coverImage,
    imageAlt: post.imageAlt,
    categories: post.categories,
    featured: post.featured,
    themePreset: post.themePreset,
    publishedAt: post.publishedAt,
  }
}

/**
 * `products` is an array of product ids, expanded to `productId` and `name`
 * only, in one query for the whole page.
 */
export async function attachProducts(posts: Record<string, unknown>[]): Promise<Record<string, unknown>[]> {
  const ids = [...new Set(posts.flatMap((post) => (post.products as string[] | null) ?? []))]
  if (ids.length === 0) return posts

  // `inArray`, not `= ANY(${ids})`: a JS array bound into a raw fragment
  // arrives as one scalar parameter, and Postgres reads the first id as an
  // array literal — `malformed array literal: "6a5074…"`, 22P02, on every
  // newsroom request. The typed builder expands the list into placeholders.
  const rows = await db
    .select({ _id: products._id, productId: products.productId, name: products.name })
    .from(products)
    .where(inArray(products._id, ids))
  const byId = new Map(rows.map((row) => [row._id, row]))

  for (const post of posts) {
    const refs = (post.products as string[] | null) ?? []
    post.products = refs.map((id) => byId.get(id)).filter(Boolean)
  }
  return posts
}

/** Populate only the media fields a card can render, without storage metadata. */
export async function attachSummaryCoverImages(posts: Record<string, unknown>[]): Promise<Record<string, unknown>[]> {
  const ids = [...new Set(posts.map((post) => post.coverImage).filter((id): id is string => typeof id === 'string' && id.length > 0))]
  if (ids.length === 0) {
    for (const post of posts) post.coverImage = null
    return posts
  }

  const rows = await db
    .select({ _id: media._id, url: media.url, thumbnails: media.thumbnails })
    .from(media)
    .where(inArray(media._id, ids))
  const byId = new Map(rows.map((row) => [row._id, row]))

  for (const post of posts) {
    const id = post.coverImage
    post.coverImage = typeof id === 'string' ? (byId.get(id) ?? null) : null
  }
  return posts
}

