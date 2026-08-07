import { Router } from 'express'
import { asc } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/postgres.js'
import { pricingPlans } from '../db/schema/index.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { localeMiddleware } from '../middleware/locale.js'
import { localizeMany } from '../utils/localize.js'
import { validate } from '../utils/validate.js'

const router = Router()

const pricingBodySchema = z.array(z.object({}).passthrough())

router.get('/', localeMiddleware, async (req, res) => {
  const plans = await db.select().from(pricingPlans).orderBy(asc(pricingPlans.order))
  res.json(await localizeMany(req, 'pricing', plans))
})

router.put('/', requireAuth, adminOnly, async (req, res) => {
  const body = validate(pricingBodySchema, req.body)
  // Replace wholesale, in one transaction: the admin sends the full list and a
  // half-applied replacement would leave the pricing page inconsistent.
  const plans = await db.transaction(async (tx) => {
    await tx.delete(pricingPlans)
    if (body.length === 0) return []
    return tx.insert(pricingPlans).values(body as never).returning()
  })
  res.json(plans)
})

export default router
