import { Router } from 'express'
import { z } from 'zod'
import { Job } from '../models/Job.js'
import { Translation } from '../models/Translation.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { localeMiddleware } from '../middleware/locale.js'
import { applyTranslation, applyTranslations } from '../utils/applyTranslation.js'
import { validate } from '../utils/validate.js'

const router = Router()

const slugParamsSchema = z.object({ slug: z.string().min(1) })
const idParamsSchema = z.object({ id: z.string().min(1) })
const jobBodySchema = z.object({}).passthrough()

// List active jobs (public)
router.get('/', localeMiddleware, async (req, res) => {
  const jobs = await Job.find({ active: true }).sort('order department')
  if (req.isDefaultLocale) return res.json(jobs)

  const translations = await Translation.find({
    locale: req.locale,
    collectionName: 'jobs',
    documentId: { $in: jobs.map(j => j._id.toString()) },
  })
  res.json(applyTranslations(jobs.map(j => j.toJSON()), translations))
})

// Get single job by slug (public)
router.get('/:slug', localeMiddleware, async (req, res) => {
  const { slug } = validate(slugParamsSchema, req.params)
  const job = await Job.findOne({ slug, active: true })
  if (!job) return res.status(404).json({ error: 'Job not found' })
  if (req.isDefaultLocale) return res.json(job)

  const translation = await Translation.findOne({
    locale: req.locale,
    collectionName: 'jobs',
    documentId: job._id.toString(),
  })
  res.json(applyTranslation(job.toJSON(), translation))
})

// Create job (admin)
router.post('/', requireAuth, adminOnly, async (req, res) => {
  const body = validate(jobBodySchema, req.body)
  try {
    const job = await Job.create(body)
    res.status(201).json(job)
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code?: number }).code === 11000) {
      return res.status(409).json({ error: 'A job with this slug already exists' })
    }
    throw err
  }
})

// Update job (admin)
router.put('/:id', requireAuth, adminOnly, async (req, res) => {
  const { id } = validate(idParamsSchema, req.params)
  const body = validate(jobBodySchema, req.body)
  const job = await Job.findByIdAndUpdate(id, body, { new: true })
  if (!job) return res.status(404).json({ error: 'Job not found' })
  res.json(job)
})

// Delete job (admin)
router.delete('/:id', requireAuth, adminOnly, async (req, res) => {
  const { id } = validate(idParamsSchema, req.params)
  const job = await Job.findByIdAndDelete(id)
  if (!job) return res.status(404).json({ error: 'Job not found' })
  res.json({ ok: true })
})

export default router
