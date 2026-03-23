import { Router } from 'express'
import { NewsroomPost } from '../models/NewsroomPost.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'

const router = Router()

router.get('/', async (req, res) => {
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
  res.json({ posts, total, page: parseInt(page as string), pages: Math.ceil(total / parseInt(limit as string)) })
})

router.get('/:slug', async (req, res) => {
  const post = await NewsroomPost.findOne({ slug: req.params.slug })
  if (!post) return res.status(404).json({ error: 'Post not found' })
  res.json(post)
})

router.post('/', requireAuth, adminOnly, async (req, res) => {
  const post = await NewsroomPost.create({
    ...req.body,
    authorId: req.user!._id,
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
