import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db/postgres.js'
import { footers } from '../db/schema/index.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { localeMiddleware } from '../middleware/locale.js'
import { localizeOne } from '../utils/localize.js'
import { validate } from '../utils/validate.js'
import { upsertSingleton } from '../db/singleton.js'

const router = Router()

const footerBodySchema = z.object({}).passthrough()

router.get('/', localeMiddleware, async (req, res) => {
  const [footer] = await db.select().from(footers).limit(1)
  if (!footer) return res.json({ columns: [], socialLinks: [], copyright: '' })
  res.json(await localizeOne(req, 'footer', footer))
})

router.put('/', requireAuth, adminOnly, async (req, res) => {
  const body = validate(footerBodySchema, req.body)
  res.json(await upsertSingleton(footers, body))
})

export default router
