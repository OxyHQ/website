import { Router } from 'express'
import { z } from 'zod'
import { Product } from '../models/Product.js'
import { Translation } from '../models/Translation.js'
import { optionalAuth, requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { config } from '../config.js'
import { localeMiddleware } from '../middleware/locale.js'
import { applyTranslations } from '../utils/applyTranslation.js'
import { validate } from '../utils/validate.js'

const router = Router()


type ProductJson = Record<string, unknown> & { healthUrl?: unknown }

function canViewStatusProbeTargets(req: { user?: { username?: string } }): boolean {
  const username = req.user?.username
  return Boolean(username && config.adminUsernames.includes(username))
}

function redactStatusProbeTarget<T extends ProductJson>(product: T): Omit<T, 'healthUrl'> {
  const { healthUrl: _healthUrl, ...publicProduct } = product
  void _healthUrl
  return publicProduct
}

function productJson(doc: { toJSON: () => ProductJson }): ProductJson {
  return doc.toJSON()
}

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

router.get('/', optionalAuth, localeMiddleware, async (req, res) => {
  const query = validate(listQuerySchema, req.query)
  const mongoQuery: Record<string, unknown> = {}
  if (query.surface === 'products') mongoQuery.showOnProducts = true
  if (query.surface === 'status') mongoQuery.showOnStatus = true
  if (query.surface === 'nav') mongoQuery.showInNav = true
  if (query.lifecycle) mongoQuery.lifecycle = query.lifecycle
  if (query.section) mongoQuery.section = query.section

  const docs = await Product.find(mongoQuery)
    .sort({ lifecycle: 1, section: 1, order: 1 })
    .populate('logo')
    .populate('category')

  const includeHealthUrl = canViewStatusProbeTargets(req)
  const defaultLocaleDocs = docs.map(productJson)
  if (req.isDefaultLocale) {
    return res.json(includeHealthUrl ? defaultLocaleDocs : defaultLocaleDocs.map(redactStatusProbeTarget))
  }

  const translations = await Translation.find({
    locale: req.locale,
    collectionName: 'products',
    documentId: { $in: docs.map(d => d._id.toString()) },
  })
  const translatedDocs = applyTranslations(defaultLocaleDocs, translations)
  res.json(includeHealthUrl ? translatedDocs : translatedDocs.map(redactStatusProbeTarget))
})

router.get('/:productId', optionalAuth, localeMiddleware, async (req, res) => {
  const doc = await Product.findOne({ productId: req.params.productId })
    .populate('logo')
    .populate('category')
  if (!doc) return res.status(404).json({ error: 'Not found' })
  const includeHealthUrl = canViewStatusProbeTargets(req)
  const defaultLocaleDoc = productJson(doc)
  if (req.isDefaultLocale) return res.json(includeHealthUrl ? defaultLocaleDoc : redactStatusProbeTarget(defaultLocaleDoc))
  const translations = await Translation.find({
    locale: req.locale,
    collectionName: 'products',
    documentId: doc._id.toString(),
  })
  const translatedDoc = applyTranslations([defaultLocaleDoc], translations)[0]
  res.json(includeHealthUrl ? translatedDoc : redactStatusProbeTarget(translatedDoc))
})

router.post('/', requireAuth, adminOnly, async (req, res) => {
  const body = validate(productBodySchema, req.body)
  const existing = await Product.findOne({ productId: body.productId })
  if (existing) {
    return res.status(409).json({ error: 'Product with this productId already exists' })
  }
  const doc = await Product.create(body)
  res.status(201).json(doc)
})

router.put('/:productId', requireAuth, adminOnly, async (req, res) => {
  const patch = validate(productUpdateSchema, req.body)
  const doc = await Product.findOneAndUpdate(
    { productId: req.params.productId },
    patch,
    { new: true, runValidators: true },
  )
    .populate('logo')
    .populate('category')
  if (!doc) return res.status(404).json({ error: 'Not found' })
  res.json(doc)
})

router.delete('/:productId', requireAuth, adminOnly, async (req, res) => {
  const doc = await Product.findOneAndDelete({ productId: req.params.productId })
  if (!doc) return res.status(404).json({ error: 'Not found' })
  res.json({ ok: true, productId: req.params.productId })
})

export default router
