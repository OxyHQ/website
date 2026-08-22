import { Router } from 'express'
import { and, asc, count, desc, eq, ilike, like, not, or, sql, type SQL } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/postgres.js'
import { media as mediaTable } from '../db/schema/index.js'
import { deleteFromSpaces } from '../services/s3.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { validate } from '../utils/validate.js'
import { parsePagination } from '../utils/parsePagination.js'

const router = Router()

// The media library grid pages larger than the default API page size.
const MAX_MEDIA_PAGE_SIZE = 100

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
  const { pageNum, limitNum, skip } = parsePagination(page, limit, MAX_MEDIA_PAGE_SIZE)

  const filters: SQL[] = []
  // The previous store ran this through a text index over filename and alt. Postgres
  // gets a case-insensitive substring match on the same two fields: the
  // library is a few thousand rows and the admin types partial filenames,
  // which a stemmed full-text index would match worse, not better.
  if (search) {
    const pattern = `%${search}%`
    const searchFilter = or(ilike(mediaTable.filename, pattern), ilike(mediaTable.alt, pattern))
    if (searchFilter) filters.push(searchFilter)
  }
  if (type === 'image') filters.push(like(mediaTable.mimeType, 'image/%'))
  else if (type === 'video') filters.push(like(mediaTable.mimeType, 'video/%'))
  else if (type === 'document') {
    filters.push(not(like(mediaTable.mimeType, 'image/%')))
    filters.push(not(like(mediaTable.mimeType, 'video/%')))
  }
  if (tag) filters.push(sql`${mediaTable.tags} @> ARRAY[${tag}]::text[]`)
  if (folder) filters.push(eq(mediaTable.folder, folder))

  const where = filters.length > 0 ? and(...filters) : undefined

  const [items, [totals]] = await Promise.all([
    db.select().from(mediaTable).where(where).orderBy(desc(mediaTable.createdAt), asc(mediaTable._id)).offset(skip).limit(limitNum),
    db.select({ value: count() }).from(mediaTable).where(where),
  ])
  const total = Number(totals?.value ?? 0)

  res.json({ items, total, page: pageNum, pages: Math.ceil(total / limitNum) })
})

// Get single media by ID (public — used for resolving media refs)
router.get('/:id', async (req, res) => {
  const { id } = validate(idParamsSchema, req.params)
  const [row] = await db.select().from(mediaTable).where(eq(mediaTable._id, id)).limit(1)
  if (!row) return res.status(404).json({ error: 'Media not found' })
  res.json(row)
})

// Update media metadata (admin)
router.patch('/:id', requireAuth, adminOnly, async (req, res) => {
  const { id } = validate(idParamsSchema, req.params)
  const { alt, tags, folder } = validate(updateBodySchema, req.body)
  const update: Record<string, unknown> = { updatedAt: new Date() }
  if (alt !== undefined) update.alt = alt
  if (tags !== undefined) update.tags = tags
  if (folder !== undefined) update.folder = folder

  const [row] = await db.update(mediaTable).set(update as never).where(eq(mediaTable._id, id)).returning()
  if (!row) return res.status(404).json({ error: 'Media not found' })
  res.json(row)
})

// Delete media (admin) — removes from S3 + DB
router.delete('/:id', requireAuth, adminOnly, async (req, res) => {
  const { id } = validate(idParamsSchema, req.params)
  const [row] = await db.select().from(mediaTable).where(eq(mediaTable._id, id)).limit(1)
  if (!row) return res.status(404).json({ error: 'Media not found' })

  // Delete original + thumbnails from S3
  const keysToDelete = [row.key]
  if (row.thumbnails?.sm) keysToDelete.push(extractKey(row.thumbnails.sm))
  if (row.thumbnails?.md) keysToDelete.push(extractKey(row.thumbnails.md))
  if (row.thumbnails?.lg) keysToDelete.push(extractKey(row.thumbnails.lg))

  await Promise.allSettled(keysToDelete.filter(Boolean).map(k => deleteFromSpaces(k)))
  await db.delete(mediaTable).where(eq(mediaTable._id, id))

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
