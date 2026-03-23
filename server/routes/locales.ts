import { Router } from 'express'
import { Locale } from '../models/Locale.js'
import { Translation } from '../models/Translation.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { invalidateLocaleCache } from '../middleware/locale.js'

const router = Router()

// Public: list enabled locales
router.get('/', async (_req, res) => {
  const locales = await Locale.find({ enabled: true }).sort('order')
  res.json(locales)
})

// Admin: list all locales (including disabled)
router.get('/all', requireAuth, adminOnly, async (_req, res) => {
  const locales = await Locale.find().sort('order')
  res.json(locales)
})

// Admin: create locale
router.post('/', requireAuth, adminOnly, async (req, res) => {
  const { code, name, nativeName, isDefault, enabled, order } = req.body
  if (!code || !name) return res.status(400).json({ error: 'code and name are required' })

  // If setting as default, unset previous default
  if (isDefault) {
    await Locale.updateMany({}, { isDefault: false })
  }

  const locale = await Locale.create({ code, name, nativeName: nativeName || name, isDefault: !!isDefault, enabled: enabled !== false, order: order ?? 0 })
  invalidateLocaleCache()
  res.status(201).json(locale)
})

// Admin: update locale
router.put('/:code', requireAuth, adminOnly, async (req, res) => {
  const { name, nativeName, isDefault, enabled, order } = req.body

  // If setting as default, unset previous default
  if (isDefault) {
    await Locale.updateMany({ code: { $ne: req.params.code } }, { isDefault: false })
  }

  const locale = await Locale.findOneAndUpdate(
    { code: req.params.code },
    { ...(name !== undefined && { name }), ...(nativeName !== undefined && { nativeName }), ...(isDefault !== undefined && { isDefault }), ...(enabled !== undefined && { enabled }), ...(order !== undefined && { order }) },
    { new: true },
  )
  if (!locale) return res.status(404).json({ error: 'Locale not found' })
  invalidateLocaleCache()
  res.json(locale)
})

// Admin: delete locale and all its translations
router.delete('/:code', requireAuth, adminOnly, async (req, res) => {
  const locale = await Locale.findOne({ code: req.params.code })
  if (!locale) return res.status(404).json({ error: 'Locale not found' })
  if (locale.isDefault) return res.status(400).json({ error: 'Cannot delete the default locale' })

  await Translation.deleteMany({ locale: req.params.code })
  await locale.deleteOne()
  invalidateLocaleCache()
  res.json({ ok: true })
})

export default router
