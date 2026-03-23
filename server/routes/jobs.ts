import { Router } from 'express'
import { Job } from '../models/Job.js'
import { Translation } from '../models/Translation.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { localeMiddleware } from '../middleware/locale.js'
import { applyTranslations } from '../utils/applyTranslation.js'

const router = Router()

router.get('/', localeMiddleware, async (req, res) => {
  const jobs = await Job.find({ active: true }).sort('department')
  if (req.isDefaultLocale) return res.json(jobs)

  const translations = await Translation.find({
    locale: req.locale,
    collection: 'jobs',
    documentId: { $in: jobs.map(j => j._id.toString()) },
  })
  res.json(applyTranslations(jobs.map(j => j.toJSON()), translations))
})

router.post('/', requireAuth, adminOnly, async (req, res) => {
  const job = await Job.create(req.body)
  res.status(201).json(job)
})

router.put('/:id', requireAuth, adminOnly, async (req, res) => {
  const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true })
  if (!job) return res.status(404).json({ error: 'Job not found' })
  res.json(job)
})

export default router
