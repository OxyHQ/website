import { Router } from 'express'
import { asc } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/postgres.js'
import { testimonials } from '../db/schema/index.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { localeMiddleware } from '../middleware/locale.js'
import { localizeMany } from '../utils/localize.js'
import { validate } from '../utils/validate.js'

const router = Router()

const testimonialsBodySchema = z.array(z.object({}).passthrough())

router.get('/', localeMiddleware, async (req, res) => {
  const items = await db.select().from(testimonials).orderBy(asc(testimonials.order))
  res.json(await localizeMany(req, 'testimonials', items))
})

router.put('/', requireAuth, adminOnly, async (req, res) => {
  const body = validate(testimonialsBodySchema, req.body)
  const items = await db.transaction(async (tx) => {
    await tx.delete(testimonials)
    if (body.length === 0) return []
    return tx.insert(testimonials).values(body as never).returning()
  })
  res.json(items)
})

export default router
