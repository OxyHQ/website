import { Router } from 'express'
import { and, asc, eq, type SQL } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/postgres.js'
import { categories, media, products } from '../db/schema/index.js'
import { populate, populateOne } from '../db/refs.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { localeMiddleware } from '../middleware/locale.js'
import { localizeMany, localizeOne } from '../utils/localize.js'
import { validate } from '../utils/validate.js'

const router = Router()

/** The referenced rows every product response carries inline. */
const PRODUCT_REFS = { logo: media, category: categories }

// Accept either a string (Media id) or null to clear. Empty string becomes null.
const mediaRefSchema = z.union([z.string(), z.null()]).optional().transform((v) => (v && v.length > 0 ? v : null))
const categoryRefSchema = z.union([z.string(), z.null()]).optional().transform((v) => (v && v.length > 0 ? v : null))

const productBodySchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  tagline: z.string().optional().default(''),
  description: z.string().optional().default(''),
  href: z.string().min(1),
  landingUrl: z.string().optional(),
  healthUrl: z.string().optional(),
  external: z.boolean().optional().default(false),
  cta: z.string().optional().default('Learn more'),
  brand: z.string().min(1),
  brandForeground: z.string().optional(),
  mark: z.string().min(1),
  logo: mediaRefSchema,
  category: categoryRefSchema,
  section: z.string().optional().default('apps'),
  lifecycle: z.enum(['live', 'in-development']).optional().default('live'),
  showOnProducts: z.boolean().optional().default(true),
  showOnStatus: z.boolean().optional().default(true),
  showInNav: z.boolean().optional().default(true),
  navOpensApp: z.boolean().optional().default(false),
  order: z.number().optional().default(0),
})

const productUpdateSchema = productBodySchema.partial().omit({ productId: true })

const listQuerySchema = z.object({
  surface: z.enum(['products', 'status', 'nav']).optional(),
  lifecycle: z.enum(['live', 'in-development']).optional(),
  section: z.string().optional(),
})

router.get('/', localeMiddleware, async (req, res) => {
  const query = validate(listQuerySchema, req.query)
  const filters: SQL[] = []
  if (query.surface === 'products') filters.push(eq(products.showOnProducts, true))
  if (query.surface === 'status') filters.push(eq(products.showOnStatus, true))
  if (query.surface === 'nav') filters.push(eq(products.showInNav, true))
  if (query.lifecycle) filters.push(eq(products.lifecycle, query.lifecycle))
  if (query.section) filters.push(eq(products.section, query.section))

  const rows = await db
    .select()
    .from(products)
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(asc(products.lifecycle), asc(products.section), asc(products.order), asc(products._id))

  res.json(await localizeMany(req, 'products', await populate(rows, PRODUCT_REFS)))
})

router.get('/:productId', localeMiddleware, async (req, res) => {
  const [row] = await db.select().from(products).where(eq(products.productId, String(req.params.productId))).limit(1)
  const doc = await populateOne(row, PRODUCT_REFS)
  if (!doc) return res.status(404).json({ error: 'Not found' })
  res.json(await localizeOne(req, 'products', doc))
})

router.post('/', requireAuth, adminOnly, async (req, res) => {
  const body = validate(productBodySchema, req.body)
  const [existing] = await db.select({ id: products._id }).from(products).where(eq(products.productId, body.productId)).limit(1)
  if (existing) {
    return res.status(409).json({ error: 'Product with this productId already exists' })
  }
  const [doc] = await db.insert(products).values(body).returning()
  res.status(201).json(doc)
})

router.put('/:productId', requireAuth, adminOnly, async (req, res) => {
  const patch = validate(productUpdateSchema, req.body)
  const [row] = await db
    .update(products)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(products.productId, String(req.params.productId)))
    .returning()
  const doc = await populateOne(row, PRODUCT_REFS)
  if (!doc) return res.status(404).json({ error: 'Not found' })
  res.json(doc)
})

router.delete('/:productId', requireAuth, adminOnly, async (req, res) => {
  const [row] = await db.delete(products).where(eq(products.productId, String(req.params.productId))).returning({ id: products._id })
  if (!row) return res.status(404).json({ error: 'Not found' })
  res.json({ ok: true, productId: req.params.productId })
})

export default router
