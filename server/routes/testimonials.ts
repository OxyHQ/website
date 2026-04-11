import { Router } from 'express'
import { Testimonial } from '../models/Testimonial.js'
import { Translation } from '../models/Translation.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { localeMiddleware } from '../middleware/locale.js'
import { applyTranslations } from '../utils/applyTranslation.js'

const router = Router()

router.get('/', localeMiddleware, async (req, res) => {
  const items = await Testimonial.find().sort('order')
  if (req.isDefaultLocale) return res.json(items)

  const translations = await Translation.find({
    locale: req.locale,
    collectionName: 'testimonials',
    documentId: { $in: items.map(i => i._id.toString()) },
  })
  res.json(applyTranslations(items.map(i => i.toJSON()), translations))
})

router.put('/', requireAuth, adminOnly, async (req, res) => {
  await Testimonial.deleteMany({})
  const items = await Testimonial.insertMany(req.body)
  res.json(items)
})

export default router
