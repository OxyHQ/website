import { Router } from 'express'
import { PricingPlan } from '../models/PricingPlan.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'

const router = Router()

router.get('/', async (_req, res) => {
  const plans = await PricingPlan.find().sort('order')
  res.json(plans)
})

router.put('/', requireAuth, adminOnly, async (req, res) => {
  await PricingPlan.deleteMany({})
  const plans = await PricingPlan.insertMany(req.body)
  res.json(plans)
})

export default router
