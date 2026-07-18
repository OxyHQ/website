import { Router } from 'express'
import { z } from 'zod'
import { SiteSettings } from '../models/SiteSettings.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { localeMiddleware } from '../middleware/locale.js'
import { localizeOne } from '../utils/localize.js'
import { validate } from '../utils/validate.js'

const router = Router()

const settingsBodySchema = z.object({}).passthrough()

router.get('/', localeMiddleware, async (req, res) => {
  const settings = await SiteSettings.findOne().populate('ogImage')
  if (!settings) return res.json({ siteTitle: 'Oxy', siteDescription: '', ogImage: '' })
  res.json(await localizeOne(req, 'settings', settings))
})

router.put('/', requireAuth, adminOnly, async (req, res) => {
  const body = validate(settingsBodySchema, req.body)
  const settings = await SiteSettings.findOneAndUpdate({}, body, { new: true, upsert: true })
  res.json(settings)
})

export default router
