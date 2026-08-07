import { Router } from 'express'
import { and, count, desc, eq, ilike, or, sql, type SQL } from 'drizzle-orm'
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

const router = Router()

/** Single-valued refs resolved inline on every post. */
const NEWSROOM_REFS = { coverImage: media, ogImage: media }

const listQuerySchema = z.object({
  category: z.string().optional(),
  tag: z.string().optional(),
  product: z.string().optional(),
  featured: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  author: z.string().optional(),
  limit: z.string().optional(),
  page: z.string().optional(),
  locale: z.string().optional(),
}).passthrough()

const detailQuerySchema = z.object({
  preview: z.string().optional(),
  locale: z.string().optional(),
}).passthrough()

const slugParamsSchema = z.object({ slug: z.string().min(1) })
const postBodySchema = z.object({}).passthrough()

/**
 * `products` is an array of product ids. Mongo populated it with `productId`
 * and `name` only; this does the same in one query for the whole page.
 */
async function attachProducts(posts: Record<string, unknown>[]): Promise<Record<string, unknown>[]> {
  const ids = [...new Set(posts.flatMap((post) => (post.products as string[] | null) ?? []))]
  if (ids.length === 0) return posts

  const rows = await db
    .select({ _id: products._id, productId: products.productId, name: products.name })
    .from(products)
    .where(sql`${products._id} = ANY(${ids})`)
  const byId = new Map(rows.map((row) => [row._id, row]))

  for (const post of posts) {
    const refs = (post.products as string[] | null) ?? []
    post.products = refs.map((id) => byId.get(id)).filter(Boolean)
  }
  return posts
}

router.get('/', localeMiddleware, optionalAuth, async (req, res) => {
  const {
    category, tag, product: productId, featured, status, search, author,
    limit = '20', page = '1',
  } = validate(listQuerySchema, req.query)

  const filters: SQL[] = []
  if (category) filters.push(sql`${newsroomPosts.categories} @> ARRAY[${category}]::text[]`)
  if (tag) filters.push(sql`${newsroomPosts.tags} @> ARRAY[${tag}]::text[]`)
  if (featured === 'true') filters.push(eq(newsroomPosts.featured, true))
  if (author) filters.push(eq(newsroomPosts.oxyUserId, author))

  if (productId) {
    const [product] = await db.select({ id: products._id }).from(products).where(eq(products.productId, productId)).limit(1)
    if (!product) {
      const { pageNum } = parsePagination(page, limit)
      return res.json({ posts: [], total: 0, page: pageNum, pages: 0 })
    }
    filters.push(sql`${newsroomPosts.products} @> ARRAY[${product.id}]::text[]`)
  }

  // Default to published posts for public requests; only admins may select a status.
  filters.push(eq(newsroomPosts.status, isAdminUser(req.user) && status ? status : 'published'))

  // Search on title and excerpt. `ilike` takes the pattern as a bound
  // parameter, so the user's string is never interpolated into SQL and the
  // regex escaping the Mongo version needed has no equivalent here.
  if (search) {
    const pattern = `%${search}%`
    const searchFilter = or(ilike(newsroomPosts.title, pattern), ilike(newsroomPosts.resume, pattern))
    if (searchFilter) filters.push(searchFilter)
  }

  const where = and(...filters)
  const { pageNum, limitNum, skip } = parsePagination(page, limit)
  const [rows, [totals]] = await Promise.all([
    db.select().from(newsroomPosts).where(where).orderBy(desc(newsroomPosts.publishedAt)).offset(skip).limit(limitNum),
    db.select({ value: count() }).from(newsroomPosts).where(where),
  ])
  const total = Number(totals?.value ?? 0)

  const posts = await attachProducts(await populate(rows, NEWSROOM_REFS))
  const result = await localizeMany(req, 'newsroom', posts)

  res.json({ posts: result, total, page: pageNum, pages: Math.ceil(total / limitNum) })
})

router.get('/:slug', localeMiddleware, optionalAuth, async (req, res) => {
  const { slug } = validate(slugParamsSchema, req.params)
  const { preview } = validate(detailQuerySchema, req.query)

  const [row] = await db.select().from(newsroomPosts).where(eq(newsroomPosts.slug, slug)).limit(1)
  const post = await populateOne(row, NEWSROOM_REFS)
  if (!post) return res.status(404).json({ error: 'Post not found' })
  // Hide drafts from public; admins may see them with preview=true
  if (post.status === 'draft' && (preview !== 'true' || !isAdminUser(req.user))) {
    return res.status(404).json({ error: 'Post not found' })
  }
  const [withProducts] = await attachProducts([post])
  res.json(await localizeOne(req, 'newsroom', withProducts))
})

router.post('/', requireAuth, adminOnly, async (req, res) => {
  const user = req.user
  if (!user) return res.status(401).json({ error: 'Authentication required' })

  const body = validate(postBodySchema, req.body)

  try {
    const [post] = await db
      .insert(newsroomPosts)
      .values({ ...body, oxyUserId: user.id } as never)
      .returning()
    res.status(201).json(post)
  } catch (err) {
    res.status(500).json({ error: `Failed to create post: ${toErrorMessage(err)}` })
  }
})

router.put('/:slug', requireAuth, adminOnly, async (req, res) => {
  const { slug } = validate(slugParamsSchema, req.params)
  const body = validate(postBodySchema, req.body)
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
