import { Router } from 'express'
import { SiteSettings } from '../models/SiteSettings.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'

const router = Router()

router.get('/', async (_req, res) => {
  const settings = await SiteSettings.findOne()
  res.json(settings ?? { siteTitle: 'Oxy', siteDescription: '', ogImage: '' })
})

router.put('/', requireAuth, adminOnly, async (req, res) => {
  const settings = await SiteSettings.findOneAndUpdate({}, req.body, { new: true, upsert: true })
  res.json(settings)
})

export default router
