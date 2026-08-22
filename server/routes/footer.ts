import { Router } from 'express'
import { db } from '../db/postgres.js'
import { footers } from '../db/schema/index.js'
import { localeMiddleware } from '../middleware/locale.js'
import { localizeOne } from '../utils/localize.js'

const router = Router()

router.get('/', localeMiddleware, async (req, res) => {
  const [footer] = await db.select().from(footers).limit(1)
  if (!footer) return res.json({ columns: [], socialLinks: [], copyright: '' })
  res.json(await localizeOne(req, 'footer', footer))
})

export default router
