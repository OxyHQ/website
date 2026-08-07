import { Router } from 'express'
import { z } from 'zod'
import { and, asc, count, desc, eq, sql, type SQL } from 'drizzle-orm'
import { db } from '../db/postgres.js'
import { categories, media, resources as table } from '../db/schema/index.js'
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

const refSchema = z.union([z.string(), z.null()]).optional().transform((v) => (v && v.length > 0 ? v : null))

const RESOURCE_TYPES = ['guide', 'paper', 'video', 'tool', 'template', 'link'] as const

const resourceBodySchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().optional().default(''),
  type: z.enum(RESOURCE_TYPES).optional().default('guide'),
  coverImage: refSchema,
  category: refSchema,
  href: z.string().min(1),
  external: z.boolean().optional().default(false),
  tags: z.array(z.string()).optional().default([]),
  featured: z.boolean().optional().default(false),
  status: z.enum(['draft', 'published']).optional().default('published'),
  publishedAt: z.string().optional(),
  order: z.number().optional().default(0),
})

const resourceUpdateSchema = resourceBodySchema.partial().omit({ slug: true })

const listQuerySchema = z.object({
  category: z.string().optional(),
  tag: z.string().optional(),
  type: z.string().optional(),
  featured: z.string().optional(),
  status: z.string().optional(),
  limit: z.string().optional(),
  page: z.string().optional(),
  locale: z.string().optional(),
}).passthrough()

const detailQuerySchema = z.object({
  preview: z.string().optional(),
  locale: z.string().optional(),
}).passthrough()

const slugParamsSchema = z.object({ slug: z.string().min(1) })

router.get('/', localeMiddleware, optionalAuth, async (req, res) => {
  const { category, tag, type, featured, status, limit = '20', page = '1' } = validate(listQuerySchema, req.query)

  const filters: SQL[] = []
  if (category) filters.push(eq(table.category, category))
  if (tag) filters.push(sql`${table.tags} @> ARRAY[${tag}]::text[]`)
  if (type) filters.push(eq(table.type, type))
  if (featured === 'true') filters.push(eq(table.featured, true))
  filters.push(eq(table.status, isAdminUser(req.user) && status ? status : 'published'))
  const where = and(...filters)

  const { pageNum, limitNum, skip } = parsePagination(page, limit)
  const [rows, [totals]] = await Promise.all([
    db.select().from(table).where(where).orderBy(asc(table.order), desc(table.publishedAt)).offset(skip).limit(limitNum),
    db.select({ value: count() }).from(table).where(where),
  ])
  const total = Number(totals?.value ?? 0)
  const resources = await populate(rows, REFS)

  const result = await localizeMany(req, 'resources', resources)

  res.json({ resources: result, total, page: pageNum, pages: Math.ceil(total / limitNum) })
})

router.get('/:slug', localeMiddleware, optionalAuth, async (req, res) => {
  const { slug } = validate(slugParamsSchema, req.params)
  const { preview } = validate(detailQuerySchema, req.query)

  const visibility = !isAdminUser(req.user) || preview !== 'true' ? eq(table.status, 'published') : undefined

  const [row] = await db.select().from(table).where(and(eq(table.slug, slug), visibility)).limit(1)
  const resource = await populateOne(row, REFS)
  if (!resource) return res.status(404).json({ error: 'Resource not found' })
  res.json(await localizeOne(req, 'resources', resource))
})

router.post('/', requireAuth, adminOnly, async (req, res) => {
  try {
    const body = validate(resourceBodySchema, req.body)
    const [existing] = await db.select({ id: table._id }).from(table).where(eq(table.slug, body.slug)).limit(1)
    if (existing) return res.status(409).json({ error: 'Resource with this slug already exists' })
    const { publishedAt, ...rest } = body
    const [created] = await db
      .insert(table)
      .values({ ...rest, publishedAt: publishedAt ? new Date(publishedAt) : new Date() } as never)
      .returning()
    const populated = await populateOne(created, REFS)
    res.status(201).json(populated)
  } catch (err) {
    res.status(500).json({ error: `Failed to create resource: ${toErrorMessage(err)}` })
  }
})

router.put('/:slug', requireAuth, adminOnly, async (req, res) => {
  const { slug } = validate(slugParamsSchema, req.params)
  try {
    const body = validate(resourceUpdateSchema, req.body)
    const { publishedAt, ...rest } = body
    const patch: Record<string, unknown> = { ...rest }
    if (publishedAt) patch.publishedAt = new Date(publishedAt)
    const [updated] = await db
      .update(table)
      .set({ ...patch, updatedAt: new Date() } as never)
      .where(eq(table.slug, slug))
      .returning()
    const resource = await populateOne(updated, REFS)
    if (!resource) return res.status(404).json({ error: 'Resource not found' })
    res.json(resource)
  } catch (err) {
    res.status(500).json({ error: `Failed to update resource: ${toErrorMessage(err)}` })
  }
})

router.delete('/:slug', requireAuth, adminOnly, async (req, res) => {
  const { slug } = validate(slugParamsSchema, req.params)
  try {
    const [resource] = await db.delete(table).where(eq(table.slug, slug)).returning({ id: table._id })
    if (!resource) return res.status(404).json({ error: 'Resource not found' })
    res.json({ ok: true, slug })
  } catch (err) {
    res.status(500).json({ error: `Failed to delete resource: ${toErrorMessage(err)}` })
  }
})

export default router
