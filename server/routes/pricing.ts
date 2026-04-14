import { Router } from 'express'
import { z } from 'zod'
import { PricingPlan } from '../models/PricingPlan.js'
import { Translation } from '../models/Translation.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { localeMiddleware } from '../middleware/locale.js'
import { applyTranslations } from '../utils/applyTranslation.js'
import { validate } from '../utils/validate.js'

const router = Router()

const pricingBodySchema = z.array(z.object({}).passthrough())

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
  const body = validate(pricingBodySchema, req.body)
  await PricingPlan.deleteMany({})
  const plans = await PricingPlan.insertMany(body)
  res.json(plans)
})

export default router
