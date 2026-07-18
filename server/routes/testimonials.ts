import { Router } from 'express'
import { z } from 'zod'
import { Testimonial } from '../models/Testimonial.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { localeMiddleware } from '../middleware/locale.js'
import { localizeMany } from '../utils/localize.js'
import { validate } from '../utils/validate.js'

const router = Router()

const testimonialsBodySchema = z.array(z.object({}).passthrough())

router.get('/', localeMiddleware, async (req, res) => {
  const items = await Testimonial.find().sort('order')
  res.json(await localizeMany(req, 'testimonials', items))
})

router.put('/', requireAuth, adminOnly, async (req, res) => {
  const body = validate(testimonialsBodySchema, req.body)
  await Testimonial.deleteMany({})
  const items = await Testimonial.insertMany(body)
  res.json(items)
})

export default router
