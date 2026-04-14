import { Router } from 'express'
import { z } from 'zod'
import { Navigation } from '../models/Navigation.js'
import { Translation } from '../models/Translation.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { localeMiddleware } from '../middleware/locale.js'
import { applyTranslations } from '../utils/applyTranslation.js'
import { validate } from '../utils/validate.js'

const router = Router()

const navItemSchema = z.object({
  title: z.string(),
  description: z.string().optional().default(''),
  href: z.string(),
  icon: z.string().optional(),
  image: z.union([z.string(), z.null()]).optional().transform(v => (v && v.length > 0 ? v : null)),
  section: z.string().optional(),
  showGrid: z.boolean().optional(),
})

const navigationBodySchema = z.array(z.object({
  label: z.string(),
  order: z.number().optional().default(0),
  items: z.array(navItemSchema).default([]),
  sidePanel: z.union([
    z.object({
      heading: z.string().optional().default(''),
      links: z.array(z.object({ label: z.string(), href: z.string() })).default([]),
    }),
    z.null(),
  ]).optional(),
}))

router.get('/', localeMiddleware, async (req, res) => {
  const items = await Navigation.find().sort('order').populate('items.image')
  if (req.isDefaultLocale) return res.json(items)

  const translations = await Translation.find({
    locale: req.locale,
    collectionName: 'navigation',
    documentId: { $in: items.map(i => i._id.toString()) },
  })
  res.json(applyTranslations(items.map(i => i.toJSON()), translations))
})

router.put('/', requireAuth, adminOnly, async (req, res) => {
  const body = validate(navigationBodySchema, req.body)
  await Navigation.deleteMany({})
  const created = await Navigation.insertMany(body)
  const items = await Navigation.find({ _id: { $in: created.map(c => c._id) } })
    .sort('order')
    .populate('items.image')
  res.json(items)
})

export default router
