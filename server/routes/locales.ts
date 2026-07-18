import { Router } from 'express'
import { z } from 'zod'
import { Locale } from '../models/Locale.js'
import { Translation } from '../models/Translation.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { invalidateLocaleCache } from '../middleware/locale.js'
import { validate } from '../utils/validate.js'
import { getEnabledLocalesWithReadiness } from '../utils/localeReadiness.js'

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

// Public: list enabled locales, each annotated with translation readiness so
// the build and the sitemap can tell which locales have real content.
router.get('/', async (_req, res) => {
  res.json(await getEnabledLocalesWithReadiness())
})

// List all locales including disabled (used by admin locale switcher)
router.get('/all', async (_req, res) => {
  const locales = await Locale.find().sort('order')
  res.json(locales)
})

// Admin: create locale
router.post('/', requireAuth, adminOnly, async (req, res) => {
  const { code, name, nativeName, isDefault, enabled, order } = validate(createLocaleBodySchema, req.body)

  const locale = await Locale.create({
    code,
    name,
    nativeName: nativeName || name,
    isDefault: !!isDefault,
    enabled: enabled !== false,
    order: order ?? 0,
  })

  // Only demote the previous default once the new one exists, so a failed
  // create can never leave the site with zero default locales.
  if (isDefault) {
    await Locale.updateMany({ code: { $ne: code } }, { isDefault: false })
  }
  invalidateLocaleCache()
  res.status(201).json(locale)
})

// Admin: update locale
router.put('/:code', requireAuth, adminOnly, async (req, res) => {
  const { code } = validate(codeParamsSchema, req.params)
  const { name, nativeName, isDefault, enabled, order } = validate(updateLocaleBodySchema, req.body)

  // Confirm the target exists before touching any other locale's default flag,
  // so an unknown code can never leave the site with zero default locales.
  const existing = await Locale.findOne({ code })
  if (!existing) return res.status(404).json({ error: 'Locale not found' })

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

  // Unset the previous default only after this locale has become the default.
  if (isDefault) {
    await Locale.updateMany({ code: { $ne: code } }, { isDefault: false })
  }
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
