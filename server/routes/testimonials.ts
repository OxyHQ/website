import { Router } from 'express'
import { Testimonial } from '../models/Testimonial.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'

const router = Router()

router.get('/', async (_req, res) => {
  const items = await Testimonial.find().sort('order')
  res.json(items)
})

router.put('/', requireAuth, adminOnly, async (req, res) => {
  await Testimonial.deleteMany({})
  const items = await Testimonial.insertMany(req.body)
  res.json(items)
})

export default router
