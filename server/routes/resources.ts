import { Router } from 'express'
import { z } from 'zod'
import { Resource } from '../models/Resource.js'
import { Translation } from '../models/Translation.js'
import { optionalAuth, requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { localeMiddleware } from '../middleware/locale.js'
import { applyTranslation, applyTranslations } from '../utils/applyTranslation.js'
import { toErrorMessage } from '../utils/errorMessage.js'
import { parsePagination } from '../utils/parsePagination.js'
import { validate } from '../utils/validate.js'
import { config } from '../config.js'

const router = Router()

function isAdminRequest(req: { user?: { username?: string | null } }): boolean {
  return req.user?.username != null && config.adminUsernames.includes(req.user.username)
}

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

  const filter: Record<string, unknown> = {}
  if (category) filter.category = category
  if (tag) filter.tags = tag
  if (type) filter.type = type
  if (featured === 'true') filter.featured = true

  filter.status = isAdminRequest(req) && status ? status : 'published'

  const { pageNum, limitNum, skip } = parsePagination(page, limit)
  const [resources, total] = await Promise.all([
    Resource.find(filter)
      .populate('coverImage')
      .populate('category')
      .sort({ order: 1, publishedAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Resource.countDocuments(filter),
  ])

  let result = resources.map(r => r.toJSON())
  if (!req.isDefaultLocale) {
    const translations = await Translation.find({
      locale: req.locale,
      collectionName: 'resources',
      documentId: { $in: resources.map(r => r._id.toString()) },
    })
    result = applyTranslations(result, translations)
  }

  res.json({ resources: result, total, page: pageNum, pages: Math.ceil(total / limitNum) })
})

router.get('/:slug', localeMiddleware, optionalAuth, async (req, res) => {
  const { slug } = validate(slugParamsSchema, req.params)
  const { preview } = validate(detailQuerySchema, req.query)

  const filter: Record<string, unknown> = { slug }
  if (!isAdminRequest(req) || preview !== 'true') filter.status = 'published'

  const resource = await Resource.findOne(filter).populate('coverImage').populate('category')
  if (!resource) return res.status(404).json({ error: 'Resource not found' })
  if (req.isDefaultLocale) return res.json(resource)

  const translation = await Translation.findOne({
    locale: req.locale,
    collectionName: 'resources',
    documentId: resource._id.toString(),
  })
  res.json(applyTranslation(resource.toJSON(), translation))
})

router.post('/', requireAuth, adminOnly, async (req, res) => {
  try {
    const body = validate(resourceBodySchema, req.body)
    const existing = await Resource.findOne({ slug: body.slug })
    if (existing) return res.status(409).json({ error: 'Resource with this slug already exists' })
    const { publishedAt, ...rest } = body
    const resource = await Resource.create({
      ...rest,
      publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
    })
    const populated = await Resource.findById(resource._id).populate('coverImage').populate('category')
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
    const resource = await Resource.findOneAndUpdate({ slug }, patch, { new: true, runValidators: true })
      .populate('coverImage')
      .populate('category')
    if (!resource) return res.status(404).json({ error: 'Resource not found' })
    res.json(resource)
  } catch (err) {
    res.status(500).json({ error: `Failed to update resource: ${toErrorMessage(err)}` })
  }
})

router.delete('/:slug', requireAuth, adminOnly, async (req, res) => {
  const { slug } = validate(slugParamsSchema, req.params)
  try {
    const resource = await Resource.findOneAndDelete({ slug })
    if (!resource) return res.status(404).json({ error: 'Resource not found' })
    res.json({ ok: true, slug })
  } catch (err) {
    res.status(500).json({ error: `Failed to delete resource: ${toErrorMessage(err)}` })
  }
})

export default router
