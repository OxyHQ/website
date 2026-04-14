import { Router } from 'express'
import { z } from 'zod'
import { Media } from '../models/Media.js'
import { deleteFromSpaces } from '../services/s3.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { validate } from '../utils/validate.js'

const router = Router()

const listQuerySchema = z.object({
  search: z.string().optional(),
  type: z.enum(['image', 'video', 'document']).optional(),
  tag: z.string().optional(),
  folder: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
}).passthrough()

const idParamsSchema = z.object({ id: z.string().min(1) })

const updateBodySchema = z.object({
  alt: z.string().optional(),
  tags: z.array(z.string()).optional(),
  folder: z.string().optional(),
}).passthrough()

// List media (admin) — supports search, type filter, pagination
router.get('/', requireAuth, adminOnly, async (req, res) => {
  const { search, type, tag, folder, page = '1', limit = '40' } = validate(listQuerySchema, req.query)
  const pageNum = Math.max(1, parseInt(page, 10))
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)))

  const filter: Record<string, unknown> = {}
  if (search) filter.$text = { $search: search }
  if (type === 'image') filter.mimeType = { $regex: /^image\// }
  else if (type === 'video') filter.mimeType = { $regex: /^video\// }
  else if (type === 'document') filter.mimeType = { $nin: [/^image\//, /^video\//] }
  if (tag) filter.tags = tag
  if (folder) filter.folder = folder

  const [items, total] = await Promise.all([
    Media.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
    Media.countDocuments(filter),
  ])

  res.json({ items, total, page: pageNum, pages: Math.ceil(total / limitNum) })
})

// Get single media by ID (public — used for resolving media refs)
router.get('/:id', async (req, res) => {
  const { id } = validate(idParamsSchema, req.params)
  const media = await Media.findById(id)
  if (!media) return res.status(404).json({ error: 'Media not found' })
  res.json(media)
})

// Update media metadata (admin)
router.patch('/:id', requireAuth, adminOnly, async (req, res) => {
  const { id } = validate(idParamsSchema, req.params)
  const { alt, tags, folder } = validate(updateBodySchema, req.body)
  const update: Record<string, unknown> = {}
  if (alt !== undefined) update.alt = alt
  if (tags !== undefined) update.tags = tags
  if (folder !== undefined) update.folder = folder

  const media = await Media.findByIdAndUpdate(id, update, { new: true })
  if (!media) return res.status(404).json({ error: 'Media not found' })
  res.json(media)
})

// Delete media (admin) — removes from S3 + DB
router.delete('/:id', requireAuth, adminOnly, async (req, res) => {
  const { id } = validate(idParamsSchema, req.params)
  const media = await Media.findById(id)
  if (!media) return res.status(404).json({ error: 'Media not found' })

  // Delete original + thumbnails from S3
  const keysToDelete = [media.key]
  if (media.thumbnails?.sm) keysToDelete.push(extractKey(media.thumbnails.sm))
  if (media.thumbnails?.md) keysToDelete.push(extractKey(media.thumbnails.md))
  if (media.thumbnails?.lg) keysToDelete.push(extractKey(media.thumbnails.lg))

  await Promise.allSettled(keysToDelete.filter(Boolean).map(k => deleteFromSpaces(k)))
  await media.deleteOne()

  res.json({ ok: true })
})

/** Extract S3 key from a CDN URL */
function extractKey(url: string): string {
  try {
    const u = new URL(url)
    return u.pathname.slice(1) // remove leading /
  } catch {
    return ''
  }
}

export default router
