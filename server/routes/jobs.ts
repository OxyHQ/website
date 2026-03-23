import { Router } from 'express'
import { Job } from '../models/Job.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'

const router = Router()

router.get('/', async (_req, res) => {
  const jobs = await Job.find({ active: true }).sort('department')
  res.json(jobs)
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
