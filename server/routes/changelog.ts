import { Router } from 'express'
import { ChangelogEntry } from '../models/ChangelogEntry.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'

const router = Router()

router.get('/', async (_req, res) => {
  const entries = await ChangelogEntry.find().sort('-date')
  res.json(entries)
})

router.post('/', requireAuth, adminOnly, async (req, res) => {
  const entry = await ChangelogEntry.create(req.body)
  res.status(201).json(entry)
})

router.put('/:id', requireAuth, adminOnly, async (req, res) => {
  const entry = await ChangelogEntry.findByIdAndUpdate(req.params.id, req.body, { new: true })
  if (!entry) return res.status(404).json({ error: 'Entry not found' })
  res.json(entry)
})

export default router
