import { Router } from 'express'
import { NewsroomPost } from '../models/NewsroomPost.js'
import { Media } from '../models/Media.js'
import { Translation } from '../models/Translation.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { localeMiddleware } from '../middleware/locale.js'
import { applyTranslation, applyTranslations } from '../utils/applyTranslation.js'
import { toErrorMessage } from '../utils/errorMessage.js'
import { parsePagination } from '../utils/parsePagination.js'

/** If a field looks like a MongoDB ObjectId, populate it from the Media collection */
async function resolveMedia(value: any): Promise<string> {
  if (!value) return ''
  if (typeof value === 'string' && /^[a-f0-9]{24}$/i.test(value)) {
    const media = await Media.findById(value)
    return media?.url || value
  }
  if (typeof value === 'object' && value.url) return value.url
  return String(value)
}

async function resolvePostMedia(post: any) {
  const obj = post.toJSON ? post.toJSON() : { ...post }
  obj.coverImage = await resolveMedia(obj.coverImage)
  obj.ogImage = await resolveMedia(obj.ogImage)
  return obj
}

const router = Router()

router.get('/', localeMiddleware, async (req, res) => {
  const { category, tag, featured, status, search, author, limit = '20', page = '1' } = req.query
  const filter: Record<string, unknown> = {}
  if (category) filter.categories = category
  if (tag) filter.tags = tag
  if (featured === 'true') filter.featured = true
  if (author) filter.oxyUserId = author

  // Default to published posts for public requests
  if (status) {
    filter.status = status
  } else {
    filter.status = 'published'
  }

  // Text search on title and excerpt
  if (search && typeof search === 'string') {
    const regex = { $regex: search, $options: 'i' }
    filter.$or = [{ title: regex }, { resume: regex }]
  }

  const { pageNum, limitNum, skip } = parsePagination(page, limit)
  const [posts, total] = await Promise.all([
    NewsroomPost.find(filter).sort('-publishedAt').skip(skip).limit(limitNum),
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

  const resolved = await Promise.all(result.map(resolvePostMedia))
  res.json({ posts: resolved, total, page: pageNum, pages: Math.ceil(total / limitNum) })
})

router.get('/:slug', localeMiddleware, async (req, res) => {
  const post = await NewsroomPost.findOne({ slug: req.params.slug })
  if (!post) return res.status(404).json({ error: 'Post not found' })
  // Hide drafts from public unless preview=true with auth
  if (post.status === 'draft' && req.query.preview !== 'true') {
    return res.status(404).json({ error: 'Post not found' })
  }
  if (req.isDefaultLocale) return res.json(await resolvePostMedia(post))

  const translation = await Translation.findOne({
    locale: req.locale,
    collection: 'newsroom',
    documentId: post._id.toString(),
  })
  res.json(await resolvePostMedia(applyTranslation(post.toJSON(), translation)))
})

router.post('/', requireAuth, adminOnly, async (req, res) => {
  const user = req.user
  if (!user) return res.status(401).json({ error: 'Authentication required' })

  try {
    const post = await NewsroomPost.create({
      ...req.body,
      oxyUserId: user.id,
    })
    res.status(201).json(post)
  } catch (err) {
    res.status(500).json({ error: `Failed to create post: ${toErrorMessage(err)}` })
  }
})

router.put('/:slug', requireAuth, adminOnly, async (req, res) => {
  try {
    const post = await NewsroomPost.findOneAndUpdate({ slug: req.params.slug }, req.body, { new: true })
    if (!post) return res.status(404).json({ error: 'Post not found' })
    res.json(post)
  } catch (err) {
    res.status(500).json({ error: `Failed to update post: ${toErrorMessage(err)}` })
  }
})

router.delete('/:slug', requireAuth, adminOnly, async (req, res) => {
  try {
    const post = await NewsroomPost.findOneAndDelete({ slug: req.params.slug })
    if (!post) return res.status(404).json({ error: 'Post not found' })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: `Failed to delete post: ${toErrorMessage(err)}` })
  }
})

export default router
