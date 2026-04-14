import { Router } from 'express'
import { z } from 'zod'
import { Navigation } from '../models/Navigation.js'
import { Translation } from '../models/Translation.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { localeMiddleware } from '../middleware/locale.js'
import { applyTranslations } from '../utils/applyTranslation.js'
import { validate } from '../utils/validate.js'

const router = Router()

const navigationBodySchema = z.array(z.object({}).passthrough())

router.get('/', localeMiddleware, async (req, res) => {
  const items = await Navigation.find().sort('order')
  if (req.isDefaultLocale) return res.json(items)

  const translations = await Translation.find({
    locale: req.locale,
    collectionName: 'navigation',
    documentId: { $in: items.map(i => i._id.toString()) },
  })
  res.json(applyTranslations(items.map(i => i.toJSON()), translations))
})

router.put('/', requireAuth, adminOnly, async (req, res) => {
  const body = validate(navigationBodySchema, req.body)
  await Navigation.deleteMany({})
  const items = await Navigation.insertMany(body)
  res.json(items)
})

export default router
