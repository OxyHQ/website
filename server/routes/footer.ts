import { Router } from 'express'
import { Footer } from '../models/Footer.js'
import { Translation } from '../models/Translation.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { localeMiddleware } from '../middleware/locale.js'
import { applyTranslation } from '../utils/applyTranslation.js'

const router = Router()

router.get('/', localeMiddleware, async (req, res) => {
  const footer = await Footer.findOne()
  const data = footer?.toJSON() ?? { columns: [], socialLinks: [], copyright: '' }
  if (req.isDefaultLocale || !footer) return res.json(data)

  const translation = await Translation.findOne({
    locale: req.locale,
    collection: 'footer',
    documentId: footer._id.toString(),
  })
  res.json(applyTranslation(data, translation))
})

router.put('/', requireAuth, adminOnly, async (req, res) => {
  const footer = await Footer.findOneAndUpdate({}, req.body, { new: true, upsert: true })
  res.json(footer)
})

export default router
