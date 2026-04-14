import { Router } from 'express'
import { z } from 'zod'
import { Product } from '../models/Product.js'
import { Translation } from '../models/Translation.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { localeMiddleware } from '../middleware/locale.js'
import { applyTranslations } from '../utils/applyTranslation.js'
import { validate } from '../utils/validate.js'

const router = Router()

const productBodySchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  tagline: z.string().optional().default(''),
  description: z.string().optional().default(''),
  href: z.string().min(1),
  external: z.boolean().optional().default(false),
  cta: z.string().optional().default('Learn more'),
  brand: z.string().min(1),
  brandForeground: z.string().optional(),
  mark: z.string().min(1),
  category: z.enum(['live', 'in-development']).optional().default('live'),
  order: z.number().optional().default(0),
})

const productUpdateSchema = productBodySchema.partial().omit({ productId: true })

router.get('/', localeMiddleware, async (req, res) => {
  const docs = await Product.find().sort({ category: 1, order: 1 })
  if (req.isDefaultLocale) return res.json(docs)

  const translations = await Translation.find({
    locale: req.locale,
    collectionName: 'products',
    documentId: { $in: docs.map(d => d._id.toString()) },
  })
  res.json(applyTranslations(docs.map(d => d.toJSON()), translations))
})

router.get('/:productId', localeMiddleware, async (req, res) => {
  const doc = await Product.findOne({ productId: req.params.productId })
  if (!doc) return res.status(404).json({ error: 'Not found' })
  if (req.isDefaultLocale) return res.json(doc)
  const translations = await Translation.find({
    locale: req.locale,
    collectionName: 'products',
    documentId: doc._id.toString(),
  })
  res.json(applyTranslations([doc.toJSON()], translations)[0])
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
  if (!doc) return res.status(404).json({ error: 'Not found' })
  res.json(doc)
})

router.delete('/:productId', requireAuth, adminOnly, async (req, res) => {
  const doc = await Product.findOneAndDelete({ productId: req.params.productId })
  if (!doc) return res.status(404).json({ error: 'Not found' })
  res.json({ ok: true, productId: req.params.productId })
})

export default router
