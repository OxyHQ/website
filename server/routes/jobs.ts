import { Router } from 'express'
import { and, asc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/postgres.js'
import { jobs } from '../db/schema/index.js'
import { isUniqueViolation } from '../db/pgErrors.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { localeMiddleware } from '../middleware/locale.js'
import { localizeMany, localizeOne } from '../utils/localize.js'
import { validate } from '../utils/validate.js'

const router = Router()

const slugParamsSchema = z.object({ slug: z.string().min(1) })
const idParamsSchema = z.object({ id: z.string().min(1) })
const jobBodySchema = z.object({}).passthrough()

// List active jobs (public)
router.get('/', localeMiddleware, async (req, res) => {
  const rows = await db
    .select()
    .from(jobs)
    .where(eq(jobs.active, true))
    .orderBy(asc(jobs.order), asc(jobs.department))
  res.json(await localizeMany(req, 'jobs', rows))
})

// Get single job by slug (public)
router.get('/:slug', localeMiddleware, async (req, res) => {
  const { slug } = validate(slugParamsSchema, req.params)
  const [job] = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.slug, slug), eq(jobs.active, true)))
    .limit(1)
  if (!job) return res.status(404).json({ error: 'Job not found' })
  res.json(await localizeOne(req, 'jobs', job))
})

// Create job (admin)
router.post('/', requireAuth, adminOnly, async (req, res) => {
  const body = validate(jobBodySchema, req.body)
  try {
    const [job] = await db.insert(jobs).values(body as never).returning()
    res.status(201).json(job)
  } catch (err: unknown) {
    if (isUniqueViolation(err)) {
      return res.status(409).json({ error: 'A job with this slug already exists' })
    }
    throw err
  }
})

// Update job (admin)
router.put('/:id', requireAuth, adminOnly, async (req, res) => {
  const { id } = validate(idParamsSchema, req.params)
  const body = validate(jobBodySchema, req.body)
  const [job] = await db
    .update(jobs)
    .set({ ...body, updatedAt: new Date() } as never)
    .where(eq(jobs._id, id))
    .returning()
  if (!job) return res.status(404).json({ error: 'Job not found' })
  res.json(job)
})

// Delete job (admin)
router.delete('/:id', requireAuth, adminOnly, async (req, res) => {
  const { id } = validate(idParamsSchema, req.params)
  const [job] = await db.delete(jobs).where(eq(jobs._id, id)).returning({ id: jobs._id })
  if (!job) return res.status(404).json({ error: 'Job not found' })
  res.json({ ok: true })
})

export default router
