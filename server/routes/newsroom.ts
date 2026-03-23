import { Router } from 'express'
import { NewsroomPost } from '../models/NewsroomPost.js'
import { Translation } from '../models/Translation.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { localeMiddleware } from '../middleware/locale.js'
import { applyTranslation, applyTranslations } from '../utils/applyTranslation.js'

const router = Router()

router.get('/', localeMiddleware, async (req, res) => {
  const { category, tag, featured, limit = '20', page = '1' } = req.query
  const filter: any = {}
  if (category) filter.category = category
  if (tag) filter.tags = tag
  if (featured === 'true') filter.featured = true

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string)
  const [posts, total] = await Promise.all([
    NewsroomPost.find(filter).sort('-publishedAt').skip(skip).limit(parseInt(limit as string)),
    NewsroomPost.countDocuments(filter),
  ])

  let result = posts.map(p => p.toJSON())
  if (!req.isDefaultLocale) {
    const translations = await Translation.find({
      locale: req.locale,
      collection: 'newsroom',
      documentId: { $in: posts.map(p => p._id.toString()) },
    })
    result = applyTranslations(result, translations)
  }

  res.json({ posts: result, total, page: parseInt(page as string), pages: Math.ceil(total / parseInt(limit as string)) })
})

router.get('/:slug', localeMiddleware, async (req, res) => {
  const post = await NewsroomPost.findOne({ slug: req.params.slug })
  if (!post) return res.status(404).json({ error: 'Post not found' })
  if (req.isDefaultLocale) return res.json(post)

  const translation = await Translation.findOne({
    locale: req.locale,
    collection: 'newsroom',
    documentId: post._id.toString(),
  })
  res.json(applyTranslation(post.toJSON(), translation))
})

router.post('/', requireAuth, adminOnly, async (req, res) => {
  const post = await NewsroomPost.create({
    ...req.body,
    authorId: req.user!.id,
    authorUsername: req.user!.username,
  })
  res.status(201).json(post)
})

router.put('/:slug', requireAuth, adminOnly, async (req, res) => {
  const post = await NewsroomPost.findOneAndUpdate({ slug: req.params.slug }, req.body, { new: true })
  if (!post) return res.status(404).json({ error: 'Post not found' })
  res.json(post)
})

router.delete('/:slug', requireAuth, adminOnly, async (req, res) => {
  const post = await NewsroomPost.findOneAndDelete({ slug: req.params.slug })
  if (!post) return res.status(404).json({ error: 'Post not found' })
  res.json({ ok: true })
})

export default router
