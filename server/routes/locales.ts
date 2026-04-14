import { Router } from 'express'
import { z } from 'zod'
import { Locale } from '../models/Locale.js'
import { Translation } from '../models/Translation.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { invalidateLocaleCache } from '../middleware/locale.js'
import { validate } from '../utils/validate.js'

const router = Router()

const codeParamsSchema = z.object({ code: z.string().min(1) })

const createLocaleBodySchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  nativeName: z.string().optional(),
  isDefault: z.boolean().optional(),
  enabled: z.boolean().optional(),
  order: z.number().optional(),
}).passthrough()

const updateLocaleBodySchema = z.object({
  name: z.string().optional(),
  nativeName: z.string().optional(),
  isDefault: z.boolean().optional(),
  enabled: z.boolean().optional(),
  order: z.number().optional(),
}).passthrough()

// Public: list enabled locales
router.get('/', async (_req, res) => {
  const locales = await Locale.find({ enabled: true }).sort('order')
  res.json(locales)
})

// List all locales including disabled (used by admin locale switcher)
router.get('/all', async (_req, res) => {
  const locales = await Locale.find().sort('order')
  res.json(locales)
})

// Admin: create locale
router.post('/', requireAuth, adminOnly, async (req, res) => {
  const { code, name, nativeName, isDefault, enabled, order } = validate(createLocaleBodySchema, req.body)

  // If setting as default, unset previous default
  if (isDefault) {
    await Locale.updateMany({}, { isDefault: false })
  }

  const locale = await Locale.create({
    code,
    name,
    nativeName: nativeName || name,
    isDefault: !!isDefault,
    enabled: enabled !== false,
    order: order ?? 0,
  })
  invalidateLocaleCache()
  res.status(201).json(locale)
})

// Admin: update locale
router.put('/:code', requireAuth, adminOnly, async (req, res) => {
  const { code } = validate(codeParamsSchema, req.params)
  const { name, nativeName, isDefault, enabled, order } = validate(updateLocaleBodySchema, req.body)

  // If setting as default, unset previous default
  if (isDefault) {
    await Locale.updateMany({ code: { $ne: code } }, { isDefault: false })
  }

  const locale = await Locale.findOneAndUpdate(
    { code },
    {
      ...(name !== undefined && { name }),
      ...(nativeName !== undefined && { nativeName }),
      ...(isDefault !== undefined && { isDefault }),
      ...(enabled !== undefined && { enabled }),
      ...(order !== undefined && { order }),
    },
    { new: true },
  )
  if (!locale) return res.status(404).json({ error: 'Locale not found' })
  invalidateLocaleCache()
  res.json(locale)
})

// Admin: delete locale and all its translations
router.delete('/:code', requireAuth, adminOnly, async (req, res) => {
  const { code } = validate(codeParamsSchema, req.params)
  const locale = await Locale.findOne({ code })
  if (!locale) return res.status(404).json({ error: 'Locale not found' })
  if (locale.isDefault) return res.status(400).json({ error: 'Cannot delete the default locale' })

  await Translation.deleteMany({ locale: code })
  await locale.deleteOne()
  invalidateLocaleCache()
  res.json({ ok: true })
})

export default router
