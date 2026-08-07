import { Router } from 'express'
import { z } from 'zod'
import { and, asc, count, desc, eq, sql, type SQL } from 'drizzle-orm'
import { db } from '../db/postgres.js'
import { categories, media, helpArticles as table } from '../db/schema/index.js'
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

/** The referenced rows every response carries inline. */
const REFS = { coverImage: media, category: categories }

// Accept either a string (id/slug) or null to clear. Empty string becomes null.
const refSchema = z.union([z.string(), z.null()]).optional().transform((v) => (v && v.length > 0 ? v : null))

const helpArticleBodySchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().optional().default(''),
  content: z.string().optional().default(''),
  category: refSchema,
  icon: z.string().optional().default(''),
  coverImage: refSchema,
  tags: z.array(z.string()).optional().default([]),
  featured: z.boolean().optional().default(false),
  status: z.enum(['draft', 'published']).optional().default('published'),
  publishedAt: z.string().optional(),
  order: z.number().optional().default(0),
})

const helpArticleUpdateSchema = helpArticleBodySchema.partial().omit({ slug: true })

const listQuerySchema = z.object({
  category: z.string().optional(),
  tag: z.string().optional(),
  featured: z.string().optional(),
  status: z.enum(['draft', 'published']).optional(),
  limit: z.string().optional(),
  page: z.string().optional(),
  locale: z.string().optional(),
}).passthrough()

const detailQuerySchema = z.object({
  preview: z.string().optional(),
  locale: z.string().optional(),
}).passthrough()

const slugParamsSchema = z.object({ slug: z.string().min(1) })

function isAdminRequest(req: Parameters<typeof adminOnly>[0]): boolean {
  return isAdminUser(req.user)
}

router.get('/', optionalAuth, localeMiddleware, async (req, res) => {
  const { category, tag, featured, status, limit = '20', page = '1' } = validate(listQuerySchema, req.query)

  const filters: SQL[] = []
  if (category) filters.push(eq(table.category, category))
  if (tag) filters.push(sql`${table.tags} @> ARRAY[${tag}]::text[]`)
  if (featured === 'true') filters.push(eq(table.featured, true))

  if (status === 'draft') {
    if (!isAdminRequest(req)) return res.status(403).json({ error: 'Admin access required' })
    filters.push(eq(table.status, 'draft'))
  } else {
    filters.push(eq(table.status, 'published'))
  }
  const where = and(...filters)

  const { pageNum, limitNum, skip } = parsePagination(page, limit)
  const [rows, [totals]] = await Promise.all([
    db.select().from(table).where(where).orderBy(asc(table.order), desc(table.publishedAt)).offset(skip).limit(limitNum),
    db.select({ value: count() }).from(table).where(where),
  ])
  const total = Number(totals?.value ?? 0)
  const articles = await populate(rows, REFS)

  const result = await localizeMany(req, 'help', articles)

  res.json({ articles: result, total, page: pageNum, pages: Math.ceil(total / limitNum) })
})

router.get('/:slug', optionalAuth, localeMiddleware, async (req, res) => {
  const { slug } = validate(slugParamsSchema, req.params)
  const { preview } = validate(detailQuerySchema, req.query)

  const [row] = await db.select().from(table).where(eq(table.slug, slug)).limit(1)
  const article = await populateOne(row, REFS)
  if (!article) return res.status(404).json({ error: 'Help article not found' })
  if (article.status === 'draft' && (preview !== 'true' || !isAdminRequest(req))) {
    return res.status(404).json({ error: 'Help article not found' })
  }
  res.json(await localizeOne(req, 'help', article))
})

router.post('/', requireAuth, adminOnly, async (req, res) => {
  try {
    const body = validate(helpArticleBodySchema, req.body)
    const [existing] = await db.select({ id: table._id }).from(table).where(eq(table.slug, body.slug)).limit(1)
    if (existing) return res.status(409).json({ error: 'Help article with this slug already exists' })
    const { publishedAt, ...rest } = body
    const [created] = await db
      .insert(table)
      .values({ ...rest, publishedAt: publishedAt ? new Date(publishedAt) : new Date() } as never)
      .returning()
    const populated = await populateOne(created, REFS)
    res.status(201).json(populated)
  } catch (err) {
    res.status(500).json({ error: `Failed to create help article: ${toErrorMessage(err)}` })
  }
})

router.put('/:slug', requireAuth, adminOnly, async (req, res) => {
  const { slug } = validate(slugParamsSchema, req.params)
  try {
    const body = validate(helpArticleUpdateSchema, req.body)
    const { publishedAt, ...rest } = body
    const patch: Record<string, unknown> = { ...rest }
    if (publishedAt) patch.publishedAt = new Date(publishedAt)
    const [updated] = await db
      .update(table)
      .set({ ...patch, updatedAt: new Date() } as never)
      .where(eq(table.slug, slug))
      .returning()
    const article = await populateOne(updated, REFS)
    if (!article) return res.status(404).json({ error: 'Help article not found' })
    res.json(article)
  } catch (err) {
    res.status(500).json({ error: `Failed to update help article: ${toErrorMessage(err)}` })
  }
})

router.delete('/:slug', requireAuth, adminOnly, async (req, res) => {
  const { slug } = validate(slugParamsSchema, req.params)
  try {
    const [article] = await db.delete(table).where(eq(table.slug, slug)).returning({ id: table._id })
    if (!article) return res.status(404).json({ error: 'Help article not found' })
    res.json({ ok: true, slug })
  } catch (err) {
    res.status(500).json({ error: `Failed to delete help article: ${toErrorMessage(err)}` })
  }
})

export default router
