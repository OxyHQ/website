import { Router } from 'express'
import { Footer } from '../models/Footer.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'

const router = Router()

router.get('/', async (_req, res) => {
  const footer = await Footer.findOne()
  res.json(footer ?? { columns: [], socialLinks: [], copyright: '' })
})

router.put('/', requireAuth, adminOnly, async (req, res) => {
  const footer = await Footer.findOneAndUpdate({}, req.body, { new: true, upsert: true })
  res.json(footer)
})

export default router
