import { Router } from 'express'
import { Page } from '../models/Page.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'

const router = Router()

router.get('/:slug', async (req, res) => {
  const page = await Page.findOne({ slug: req.params.slug })
  if (!page) return res.status(404).json({ error: 'Page not found' })
  res.json(page)
})

router.put('/:slug', requireAuth, adminOnly, async (req, res) => {
  const page = await Page.findOneAndUpdate(
    { slug: req.params.slug },
    req.body,
    { new: true, upsert: true, runValidators: true },
  )
  res.json(page)
})

export default router
