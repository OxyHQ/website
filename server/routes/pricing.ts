import { Router } from 'express'
import { z } from 'zod'
import { PricingPlan } from '../models/PricingPlan.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { localeMiddleware } from '../middleware/locale.js'
import { localizeMany } from '../utils/localize.js'
import { validate } from '../utils/validate.js'

const router = Router()

const pricingBodySchema = z.array(z.object({}).passthrough())

router.get('/', localeMiddleware, async (req, res) => {
  const plans = await PricingPlan.find().sort('order')
  res.json(await localizeMany(req, 'pricing', plans))
})

router.put('/', requireAuth, adminOnly, async (req, res) => {
  const body = validate(pricingBodySchema, req.body)
  await PricingPlan.deleteMany({})
  const plans = await PricingPlan.insertMany(body)
  res.json(plans)
})

export default router
