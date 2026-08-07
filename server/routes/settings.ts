import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db/postgres.js'
import { media, siteSettings } from '../db/schema/index.js'
import { populateOne } from '../db/refs.js'
import { upsertSingleton } from '../db/singleton.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { localeMiddleware } from '../middleware/locale.js'
import { localizeOne } from '../utils/localize.js'
import { validate } from '../utils/validate.js'

const router = Router()

const settingsBodySchema = z.object({}).passthrough()

router.get('/', localeMiddleware, async (req, res) => {
  const [row] = await db.select().from(siteSettings).limit(1)
  const settings = await populateOne(row, { ogImage: media })
  if (!settings) return res.json({ siteTitle: 'Oxy', siteDescription: '', ogImage: '' })
  res.json(await localizeOne(req, 'settings', settings))
})

router.put('/', requireAuth, adminOnly, async (req, res) => {
  const body = validate(settingsBodySchema, req.body)
  res.json(await upsertSingleton(siteSettings, body))
})

export default router
