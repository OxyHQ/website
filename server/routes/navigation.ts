import { Router } from 'express'
import { Navigation } from '../models/Navigation.js'
import { Translation } from '../models/Translation.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { localeMiddleware } from '../middleware/locale.js'
import { applyTranslations } from '../utils/applyTranslation.js'

const router = Router()

router.get('/', localeMiddleware, async (req, res) => {
  const items = await Navigation.find().sort('order')
  if (req.isDefaultLocale) return res.json(items)

  const translations = await Translation.find({
    locale: req.locale,
    collection: 'navigation',
    documentId: { $in: items.map(i => i._id.toString()) },
  })
  res.json(applyTranslations(items.map(i => i.toJSON()), translations))
})

router.put('/', requireAuth, adminOnly, async (req, res) => {
  await Navigation.deleteMany({})
  const items = await Navigation.insertMany(req.body)
  res.json(items)
})

export default router
