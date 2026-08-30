import { Router, type Request, type Response } from 'express'
import { and, asc, count, desc, eq, ilike, inArray, or, sql, type SQL } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/postgres.js'
import { media, newsroomPosts, products } from '../db/schema/index.js'
import { populate, populateOne } from '../db/refs.js'
import { optionalAuth, requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { localeMiddleware } from '../middleware/locale.js'
import { localizeMany, localizeOne } from '../utils/localize.js'
import { toErrorMessage } from '../utils/errorMessage.js'
import { parsePagination } from '../utils/parsePagination.js'
import { validate } from '../utils/validate.js'
import { isAdminUser } from '../utils/adminAccess.js'
import { isNewsroomThemePreset, newsroomThemeForSlug } from '../constants/newsroomThemes.js'

const router = Router()

/** Single-valued refs resolved inline on every post. */
const NEWSROOM_REFS = { coverImage: media, ogImage: media }

/**
 * The public feed only needs the fields rendered by newsroom cards and rails.
 * In particular, selecting the markdown body here made every listing request
 * transfer every article before a visitor chose one to read.
 */
const NEWSROOM_SUMMARY_COLUMNS = {
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

const PUBLIC_NEWSROOM_CACHE = 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400'

function hasAuthContext(req: Request): boolean {
  return Boolean(req.user || req.get('authorization') || req.headers.cookie)
}

function setNewsroomReadCache(req: Request, res: Response, privateResponse = false): void {
  // Auth changes both visibility (draft previews) and the list representation
  // (the CMS receives full rows), so shared caches must keep it in their key.
  res.vary('Authorization')
  res.vary('Cookie')
  if (req.locale) res.set('Content-Language', req.locale)
  res.set('Cache-Control', privateResponse || hasAuthContext(req) ? 'private, no-store' : PUBLIC_NEWSROOM_CACHE)
}

function toNewsroomSummary(post: Record<string, unknown>): Record<string, unknown> {
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

const listQuerySchema = z.object({
  category: z.string().optional(),
  tag: z.string().optional(),
  product: z.string().optional(),
  featured: z.string().optional(),
  status: z.enum(['draft', 'published']).optional(),
  search: z.string().optional(),
  author: z.string().optional(),
  limit: z.string().optional(),
  page: z.string().optional(),
  locale: z.string().optional(),
  view: z.enum(['summary', 'full']).optional(),
}).passthrough()

const detailQuerySchema = z.object({
  preview: z.string().optional(),
  locale: z.string().optional(),
}).passthrough()

const slugParamsSchema = z.object({ slug: z.string().min(1) })
const postBodySchema = z.object({
  status: z.enum(['draft', 'published']).optional(),
}).passthrough()

/**
 * `products` is an array of product ids, expanded to `productId` and `name`
 * only, in one query for the whole page.
 */
async function attachProducts(posts: Record<string, unknown>[]): Promise<Record<string, unknown>[]> {
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
async function attachSummaryCoverImages(posts: Record<string, unknown>[]): Promise<Record<string, unknown>[]> {
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

router.get('/', localeMiddleware, optionalAuth, async (req, res) => {
  const {
    category, tag, product: productId, featured, status, search, author,
    limit = '20', page = '1', view = 'summary',
  } = validate(listQuerySchema, req.query)
  const adminRequest = isAdminUser(req.user)
  // The authenticated CMS must keep receiving editable rows. Public build-time
  // consumers that genuinely need article bodies can opt in with `view=full`.
  const fullResponse = adminRequest || view === 'full'
  const privateResponse = adminRequest || status !== undefined

  const filters: SQL[] = []
  if (category) filters.push(sql`${newsroomPosts.categories} @> ARRAY[${category}]::text[]`)
  if (tag) filters.push(sql`${newsroomPosts.tags} @> ARRAY[${tag}]::text[]`)
  if (featured === 'true') filters.push(eq(newsroomPosts.featured, true))
  if (author) filters.push(eq(newsroomPosts.oxyUserId, author))

  if (productId) {
    const [product] = await db.select({ id: products._id }).from(products).where(eq(products.productId, productId)).limit(1)
    if (!product) {
      const { pageNum } = parsePagination(page, limit)
      setNewsroomReadCache(req, res, privateResponse)
      return res.json({ posts: [], total: 0, page: pageNum, pages: 0 })
    }
    filters.push(sql`${newsroomPosts.products} @> ARRAY[${product.id}]::text[]`)
  }

  // Default to published posts for public requests; only admins may select a status.
  filters.push(eq(newsroomPosts.status, adminRequest && status ? status : 'published'))

  // Search on title and excerpt. `ilike` takes the pattern as a bound
  // parameter, so the user's string is never interpolated into SQL.
  if (search) {
    const pattern = `%${search}%`
    const searchFilter = or(ilike(newsroomPosts.title, pattern), ilike(newsroomPosts.resume, pattern))
    if (searchFilter) filters.push(searchFilter)
  }

  const where = and(...filters)
  const { pageNum, limitNum, skip } = parsePagination(page, limit)
  const rowsQuery = fullResponse
    ? db.select().from(newsroomPosts).where(where).orderBy(desc(newsroomPosts.publishedAt), asc(newsroomPosts._id)).offset(skip).limit(limitNum)
    : db.select(NEWSROOM_SUMMARY_COLUMNS).from(newsroomPosts).where(where).orderBy(desc(newsroomPosts.publishedAt), asc(newsroomPosts._id)).offset(skip).limit(limitNum)
  const [rows, [totals]] = await Promise.all([
    rowsQuery,
    db.select({ value: count() }).from(newsroomPosts).where(where),
  ])
  const total = Number(totals?.value ?? 0)

  if (fullResponse) {
    await populate(rows, NEWSROOM_REFS)
    await attachProducts(rows)
  } else {
    await attachSummaryCoverImages(rows)
  }
  const localized = await localizeMany(req, 'newsroom', rows)
  // Translation rows contain the full editorial document. Project once more
  // after localization so translated summaries cannot reintroduce `content`.
  const result = fullResponse ? localized : localized.map(toNewsroomSummary)

  setNewsroomReadCache(req, res, privateResponse)
  res.json({ posts: result, total, page: pageNum, pages: Math.ceil(total / limitNum) })
})

router.get('/:slug', localeMiddleware, optionalAuth, async (req, res) => {
  const { slug } = validate(slugParamsSchema, req.params)
  const { preview } = validate(detailQuerySchema, req.query)

  const [row] = await db.select().from(newsroomPosts).where(eq(newsroomPosts.slug, slug)).limit(1)
  const post = await populateOne(row, NEWSROOM_REFS)
  if (!post) {
    setNewsroomReadCache(req, res, true)
    return res.status(404).json({ error: 'Post not found' })
  }
  // Every non-published state is private; admins may inspect it explicitly.
  // The column predates a database enum, so checking only literal `draft`
  // would accidentally publish a malformed or future workflow state.
  if (post.status !== 'published' && (preview !== 'true' || !isAdminUser(req.user))) {
    setNewsroomReadCache(req, res, true)
    return res.status(404).json({ error: 'Post not found' })
  }
  const [withProducts] = await attachProducts([post])
  setNewsroomReadCache(req, res, preview === 'true' || post.status !== 'published')
  res.json(await localizeOne(req, 'newsroom', withProducts))
})

router.post('/', requireAuth, adminOnly, async (req, res) => {
  const user = req.user
  if (!user) return res.status(401).json({ error: 'Authentication required' })

  const body = validate(postBodySchema, req.body)
  if (body.themePreset !== undefined && !isNewsroomThemePreset(body.themePreset)) {
    return res.status(400).json({ error: 'Invalid newsroom theme preset' })
  }

  try {
    const [post] = await db
      .insert(newsroomPosts)
      .values({
        ...body,
        themePreset: isNewsroomThemePreset(body.themePreset)
          ? body.themePreset
          : newsroomThemeForSlug(typeof body.slug === 'string' ? body.slug : ''),
        oxyUserId: user.id,
      } as never)
      .returning()
    res.status(201).json(post)
  } catch (err) {
    res.status(500).json({ error: `Failed to create post: ${toErrorMessage(err)}` })
  }
})

router.put('/:slug', requireAuth, adminOnly, async (req, res) => {
  const { slug } = validate(slugParamsSchema, req.params)
  const body = validate(postBodySchema, req.body)
  if (body.themePreset !== undefined && !isNewsroomThemePreset(body.themePreset)) {
    return res.status(400).json({ error: 'Invalid newsroom theme preset' })
  }
  try {
    const [post] = await db
      .update(newsroomPosts)
      .set({ ...body, updatedAt: new Date() } as never)
      .where(eq(newsroomPosts.slug, slug))
      .returning()
    if (!post) return res.status(404).json({ error: 'Post not found' })
    res.json(post)
  } catch (err) {
    res.status(500).json({ error: `Failed to update post: ${toErrorMessage(err)}` })
  }
})

router.delete('/:slug', requireAuth, adminOnly, async (req, res) => {
  const { slug } = validate(slugParamsSchema, req.params)
  try {
    const [post] = await db.delete(newsroomPosts).where(eq(newsroomPosts.slug, slug)).returning({ id: newsroomPosts._id })
    if (!post) return res.status(404).json({ error: 'Post not found' })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: `Failed to delete post: ${toErrorMessage(err)}` })
  }
})

export default router
