import { Router } from 'express'
import { z } from 'zod'
import { NewsroomPost } from '../models/NewsroomPost.js'
import { Product } from '../models/Product.js'
import { Translation } from '../models/Translation.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { localeMiddleware } from '../middleware/locale.js'
import { applyTranslation, applyTranslations } from '../utils/applyTranslation.js'
import { toErrorMessage } from '../utils/errorMessage.js'
import { parsePagination } from '../utils/parsePagination.js'
import { validate } from '../utils/validate.js'

const router = Router()

const NEWSROOM_POPULATE = [
  { path: 'coverImage' },
  { path: 'ogImage' },
  { path: 'products', select: 'productId name' },
] as const

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

router.get('/', localeMiddleware, async (req, res) => {
  const {
    category, tag, product: productId, featured, status, search, author,
    limit = '20', page = '1',
  } = validate(listQuerySchema, req.query)

  const filter: Record<string, unknown> = {}
  if (category) filter.categories = category
  if (tag) filter.tags = tag
  if (featured === 'true') filter.featured = true
  if (author) filter.oxyUserId = author

  if (productId) {
    const product = await Product.findOne({ productId }).select('_id')
    if (!product) {
      const { pageNum, limitNum } = parsePagination(page, limit)
      return res.json({ posts: [], total: 0, page: pageNum, pages: 0 })
    }
    filter.products = product._id
  }

  // Default to published posts for public requests
  if (status) {
    filter.status = status
  } else {
    filter.status = 'published'
  }

  // Text search on title and excerpt
  if (search) {
    const regex = { $regex: search, $options: 'i' }
    filter.$or = [{ title: regex }, { resume: regex }]
  }

  const { pageNum, limitNum, skip } = parsePagination(page, limit)
  const [posts, total] = await Promise.all([
    NewsroomPost.find(filter).populate([...NEWSROOM_POPULATE]).sort('-publishedAt').skip(skip).limit(limitNum),
    NewsroomPost.countDocuments(filter),
  ])

  let result = posts.map(p => p.toJSON())
  if (!req.isDefaultLocale) {
    const translations = await Translation.find({
      locale: req.locale,
      collectionName: 'newsroom',
      documentId: { $in: posts.map(p => p._id.toString()) },
    })
    result = applyTranslations(result, translations)
  }

  res.json({ posts: result, total, page: pageNum, pages: Math.ceil(total / limitNum) })
})

router.get('/:slug', localeMiddleware, async (req, res) => {
  const { slug } = validate(slugParamsSchema, req.params)
  const { preview } = validate(detailQuerySchema, req.query)

  const post = await NewsroomPost.findOne({ slug }).populate([...NEWSROOM_POPULATE])
  if (!post) return res.status(404).json({ error: 'Post not found' })
  // Hide drafts from public unless preview=true with auth
  if (post.status === 'draft' && preview !== 'true') {
    return res.status(404).json({ error: 'Post not found' })
  }
  if (req.isDefaultLocale) return res.json(post)

  const translation = await Translation.findOne({
    locale: req.locale,
    collectionName: 'newsroom',
    documentId: post._id.toString(),
  })
  res.json(applyTranslation(post.toJSON(), translation))
})

router.post('/', requireAuth, adminOnly, async (req, res) => {
  const user = req.user
  if (!user) return res.status(401).json({ error: 'Authentication required' })

  const body = validate(postBodySchema, req.body)

  try {
    const post = await NewsroomPost.create({
      ...body,
      oxyUserId: user.id,
    })
    res.status(201).json(post)
  } catch (err) {
    res.status(500).json({ error: `Failed to create post: ${toErrorMessage(err)}` })
  }
})

router.put('/:slug', requireAuth, adminOnly, async (req, res) => {
  const { slug } = validate(slugParamsSchema, req.params)
  const body = validate(postBodySchema, req.body)
  try {
    const post = await NewsroomPost.findOneAndUpdate({ slug }, body, { new: true })
    if (!post) return res.status(404).json({ error: 'Post not found' })
    res.json(post)
  } catch (err) {
    res.status(500).json({ error: `Failed to update post: ${toErrorMessage(err)}` })
  }
})

router.delete('/:slug', requireAuth, adminOnly, async (req, res) => {
  const { slug } = validate(slugParamsSchema, req.params)
  try {
    const post = await NewsroomPost.findOneAndDelete({ slug })
    if (!post) return res.status(404).json({ error: 'Post not found' })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: `Failed to delete post: ${toErrorMessage(err)}` })
  }
})

export default router
