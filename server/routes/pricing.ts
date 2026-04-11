import { Router } from 'express'
import { PricingPlan } from '../models/PricingPlan.js'
import { Translation } from '../models/Translation.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { localeMiddleware } from '../middleware/locale.js'
import { applyTranslations } from '../utils/applyTranslation.js'

const router = Router()

router.get('/', localeMiddleware, async (req, res) => {
  const plans = await PricingPlan.find().sort('order')
  if (req.isDefaultLocale) return res.json(plans)

  const translations = await Translation.find({
    locale: req.locale,
    collectionName: 'pricing',
    documentId: { $in: plans.map(p => p._id.toString()) },
  })
  res.json(applyTranslations(plans.map(p => p.toJSON()), translations))
})

router.put('/', requireAuth, adminOnly, async (req, res) => {
  await PricingPlan.deleteMany({})
  const plans = await PricingPlan.insertMany(req.body)
  res.json(plans)
})

export default router
