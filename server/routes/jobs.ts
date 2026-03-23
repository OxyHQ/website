import { Router } from 'express'
import { Job } from '../models/Job.js'
import { Translation } from '../models/Translation.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { localeMiddleware } from '../middleware/locale.js'
import { applyTranslation, applyTranslations } from '../utils/applyTranslation.js'

const router = Router()

// List active jobs (public)
router.get('/', localeMiddleware, async (req, res) => {
  const jobs = await Job.find({ active: true }).sort('order department')
  if (req.isDefaultLocale) return res.json(jobs)

  const translations = await Translation.find({
    locale: req.locale,
    collection: 'jobs',
    documentId: { $in: jobs.map(j => j._id.toString()) },
  })
  res.json(applyTranslations(jobs.map(j => j.toJSON()), translations))
})

// Get single job by slug (public)
router.get('/:slug', localeMiddleware, async (req, res) => {
  const job = await Job.findOne({ slug: req.params.slug })
  if (!job) return res.status(404).json({ error: 'Job not found' })
  if (req.isDefaultLocale) return res.json(job)

  const translation = await Translation.findOne({
    locale: req.locale,
    collection: 'jobs',
    documentId: job._id.toString(),
  })
  res.json(applyTranslation(job.toJSON(), translation))
})

// Create job (admin)
router.post('/', requireAuth, adminOnly, async (req, res) => {
  try {
    const job = await Job.create(req.body)
    res.status(201).json(job)
  } catch (err: any) {
    if (err.code === 11000) return res.status(409).json({ error: 'A job with this slug already exists' })
    throw err
  }
})

// Update job (admin)
router.put('/:id', requireAuth, adminOnly, async (req, res) => {
  const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true })
  if (!job) return res.status(404).json({ error: 'Job not found' })
  res.json(job)
})

// Delete job (admin)
router.delete('/:id', requireAuth, adminOnly, async (req, res) => {
  const job = await Job.findByIdAndDelete(req.params.id)
  if (!job) return res.status(404).json({ error: 'Job not found' })
  res.json({ ok: true })
})

export default router
