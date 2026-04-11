import { Router } from 'express'
import { SiteSettings } from '../models/SiteSettings.js'
import { Translation } from '../models/Translation.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { localeMiddleware } from '../middleware/locale.js'
import { applyTranslation } from '../utils/applyTranslation.js'

const router = Router()

router.get('/', localeMiddleware, async (req, res) => {
  const settings = await SiteSettings.findOne()
  const data = settings?.toJSON() ?? { siteTitle: 'Oxy', siteDescription: '', ogImage: '' }
  if (req.isDefaultLocale || !settings) return res.json(data)

  const translation = await Translation.findOne({
    locale: req.locale,
    collectionName: 'settings',
    documentId: settings._id.toString(),
  })
  res.json(applyTranslation(data, translation))
})

router.put('/', requireAuth, adminOnly, async (req, res) => {
  const settings = await SiteSettings.findOneAndUpdate({}, req.body, { new: true, upsert: true })
  res.json(settings)
})

export default router
