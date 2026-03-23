import { Router } from 'express'
import { Navigation } from '../models/Navigation.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'

const router = Router()

router.get('/', async (_req, res) => {
  const items = await Navigation.find().sort('order')
  res.json(items)
})

router.put('/', requireAuth, adminOnly, async (req, res) => {
  await Navigation.deleteMany({})
  const items = await Navigation.insertMany(req.body)
  res.json(items)
})

export default router
