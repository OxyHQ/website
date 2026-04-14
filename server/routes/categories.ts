import { Router } from 'express'
import { z } from 'zod'
import { Category } from '../models/Category.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
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

router.get('/', async (req, res) => {
  const query = validate(listQuerySchema, req.query)
  const filter = query.scope ? { scope: query.scope } : {}
  const docs = await Category.find(filter).sort({ order: 1, label: 1 })
  res.json(docs)
})

router.get('/:slug', async (req, res) => {
  const doc = await Category.findOne({ slug: req.params.slug })
  if (!doc) return res.status(404).json({ error: 'Not found' })
  res.json(doc)
})

router.post('/', requireAuth, adminOnly, async (req, res) => {
  const body = validate(categoryBodySchema, req.body)
  const existing = await Category.findOne({ slug: body.slug })
  if (existing) return res.status(409).json({ error: 'Category with this slug already exists' })
  const doc = await Category.create(body)
  res.status(201).json(doc)
})

router.put('/:slug', requireAuth, adminOnly, async (req, res) => {
  const patch = validate(categoryUpdateSchema, req.body)
  const doc = await Category.findOneAndUpdate({ slug: req.params.slug }, patch, { new: true, runValidators: true })
  if (!doc) return res.status(404).json({ error: 'Not found' })
  res.json(doc)
})

router.delete('/:slug', requireAuth, adminOnly, async (req, res) => {
  const doc = await Category.findOneAndDelete({ slug: req.params.slug })
  if (!doc) return res.status(404).json({ error: 'Not found' })
  res.json({ ok: true, slug: req.params.slug })
})

export default router
