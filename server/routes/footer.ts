import { Router } from 'express'
import { z } from 'zod'
import { Footer } from '../models/Footer.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { localeMiddleware } from '../middleware/locale.js'
import { localizeOne } from '../utils/localize.js'
import { validate } from '../utils/validate.js'

const router = Router()

const footerBodySchema = z.object({}).passthrough()

router.get('/', localeMiddleware, async (req, res) => {
  const footer = await Footer.findOne()
  if (!footer) return res.json({ columns: [], socialLinks: [], copyright: '' })
  res.json(await localizeOne(req, 'footer', footer))
})

router.put('/', requireAuth, adminOnly, async (req, res) => {
  const body = validate(footerBodySchema, req.body)
  const footer = await Footer.findOneAndUpdate({}, body, { new: true, upsert: true })
  res.json(footer)
})

export default router
