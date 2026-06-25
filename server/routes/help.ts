import { Router } from 'express'
import { z } from 'zod'
import { HelpArticle } from '../models/HelpArticle.js'
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
  const username = req.user?.username
  return Boolean(username && config.adminUsernames.includes(username))
}

router.get('/', optionalAuth, localeMiddleware, async (req, res) => {
  const { category, tag, featured, status, limit = '20', page = '1' } = validate(listQuerySchema, req.query)

  const filter: Record<string, unknown> = {}
  if (category) filter.category = category
  if (tag) filter.tags = tag
  if (featured === 'true') filter.featured = true

  if (status === 'draft') {
    if (!isAdminRequest(req)) return res.status(403).json({ error: 'Admin access required' })
    filter.status = 'draft'
  } else {
    filter.status = 'published'
  }

  const { pageNum, limitNum, skip } = parsePagination(page, limit)
  const [articles, total] = await Promise.all([
    HelpArticle.find(filter)
      .populate('coverImage')
      .populate('category')
      .sort({ order: 1, publishedAt: -1 })
      .skip(skip)
      .limit(limitNum),
    HelpArticle.countDocuments(filter),
  ])

  let result = articles.map(a => a.toJSON())
  if (!req.isDefaultLocale) {
    const translations = await Translation.find({
      locale: req.locale,
      collectionName: 'help',
      documentId: { $in: articles.map(a => a._id.toString()) },
    })
    result = applyTranslations(result, translations)
  }

  res.json({ articles: result, total, page: pageNum, pages: Math.ceil(total / limitNum) })
})

router.get('/:slug', optionalAuth, localeMiddleware, async (req, res) => {
  const { slug } = validate(slugParamsSchema, req.params)
  const { preview } = validate(detailQuerySchema, req.query)

  const article = await HelpArticle.findOne({ slug }).populate('coverImage').populate('category')
  if (!article) return res.status(404).json({ error: 'Help article not found' })
  if (article.status === 'draft' && (preview !== 'true' || !isAdminRequest(req))) {
    return res.status(404).json({ error: 'Help article not found' })
  }
  if (req.isDefaultLocale) return res.json(article)

  const translation = await Translation.findOne({
    locale: req.locale,
    collectionName: 'help',
    documentId: article._id.toString(),
  })
  res.json(applyTranslation(article.toJSON(), translation))
})

router.post('/', requireAuth, adminOnly, async (req, res) => {
  try {
    const body = validate(helpArticleBodySchema, req.body)
    const existing = await HelpArticle.findOne({ slug: body.slug })
    if (existing) return res.status(409).json({ error: 'Help article with this slug already exists' })
    const { publishedAt, ...rest } = body
    const article = await HelpArticle.create({
      ...rest,
      publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
    })
    const populated = await HelpArticle.findById(article._id).populate('coverImage').populate('category')
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
    const article = await HelpArticle.findOneAndUpdate({ slug }, patch, { new: true, runValidators: true })
      .populate('coverImage')
      .populate('category')
    if (!article) return res.status(404).json({ error: 'Help article not found' })
    res.json(article)
  } catch (err) {
    res.status(500).json({ error: `Failed to update help article: ${toErrorMessage(err)}` })
  }
})

router.delete('/:slug', requireAuth, adminOnly, async (req, res) => {
  const { slug } = validate(slugParamsSchema, req.params)
  try {
    const article = await HelpArticle.findOneAndDelete({ slug })
    if (!article) return res.status(404).json({ error: 'Help article not found' })
    res.json({ ok: true, slug })
  } catch (err) {
    res.status(500).json({ error: `Failed to delete help article: ${toErrorMessage(err)}` })
  }
})

export default router
