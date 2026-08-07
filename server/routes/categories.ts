import { Router } from 'express'
import { asc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/postgres.js'
import { categories } from '../db/schema/index.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { localeMiddleware } from '../middleware/locale.js'
import { localizeMany, localizeOne } from '../utils/localize.js'
import { validate } from '../utils/validate.js'

const router = Router()

const categoryBodySchema = z.object({
  slug: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional().default(''),
  scope: z.enum(['apps', 'nav', 'generic']).optional().default('generic'),
  order: z.number().optional().default(0),
})

const categoryUpdateSchema = categoryBodySchema.partial().omit({ slug: true })

const listQuerySchema = z.object({
  scope: z.enum(['apps', 'nav', 'generic']).optional(),
})

router.get('/', localeMiddleware, async (req, res) => {
  const query = validate(listQuerySchema, req.query)
  const docs = await db
    .select()
    .from(categories)
    .where(query.scope ? eq(categories.scope, query.scope) : undefined)
    .orderBy(asc(categories.order), asc(categories.label))
  res.json(await localizeMany(req, 'categories', docs))
})

router.get('/:slug', localeMiddleware, async (req, res) => {
  const [doc] = await db.select().from(categories).where(eq(categories.slug, String(req.params.slug))).limit(1)
  if (!doc) return res.status(404).json({ error: 'Not found' })
  res.json(await localizeOne(req, 'categories', doc))
})

router.post('/', requireAuth, adminOnly, async (req, res) => {
  const body = validate(categoryBodySchema, req.body)
  const [existing] = await db.select({ id: categories._id }).from(categories).where(eq(categories.slug, body.slug)).limit(1)
  if (existing) return res.status(409).json({ error: 'Category with this slug already exists' })
  const [doc] = await db.insert(categories).values(body).returning()
  res.status(201).json(doc)
})

router.put('/:slug', requireAuth, adminOnly, async (req, res) => {
  const patch = validate(categoryUpdateSchema, req.body)
  const [doc] = await db
    .update(categories)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(categories.slug, String(req.params.slug)))
    .returning()
  if (!doc) return res.status(404).json({ error: 'Not found' })
  res.json(doc)
})

router.delete('/:slug', requireAuth, adminOnly, async (req, res) => {
  const [doc] = await db.delete(categories).where(eq(categories.slug, String(req.params.slug))).returning({ id: categories._id })
  if (!doc) return res.status(404).json({ error: 'Not found' })
  res.json({ ok: true, slug: req.params.slug })
})

export default router
