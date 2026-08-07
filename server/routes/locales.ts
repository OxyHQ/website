import { Router } from 'express'
import { asc, eq, ne } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/postgres.js'
import { locales as localesTable, translations } from '../db/schema/index.js'
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
  const rows = await db.select().from(localesTable).orderBy(asc(localesTable.order))
  res.json(rows)
})

// Admin: create locale
router.post('/', requireAuth, adminOnly, async (req, res) => {
  const { code, name, nativeName, isDefault, enabled, order } = validate(createLocaleBodySchema, req.body)

  const [locale] = await db
    .insert(localesTable)
    .values({
      code,
      name,
      nativeName: nativeName || name,
      isDefault: !!isDefault,
      enabled: enabled !== false,
      order: order ?? 0,
    })
    .returning()

  // Only demote the previous default once the new one exists, so a failed
  // create can never leave the site with zero default locales.
  if (isDefault) {
    await db.update(localesTable).set({ isDefault: false }).where(ne(localesTable.code, code))
  }
  invalidateLocaleCache()
  res.status(201).json(locale)
})

// Admin: update locale
router.put('/:code', requireAuth, adminOnly, async (req, res) => {
  const { code } = validate(codeParamsSchema, req.params)
  const { name, nativeName, isDefault, enabled, order } = validate(updateLocaleBodySchema, req.body)

  const [locale] = await db
    .update(localesTable)
    .set({
      ...(name !== undefined && { name }),
      ...(nativeName !== undefined && { nativeName }),
      ...(isDefault !== undefined && { isDefault }),
      ...(enabled !== undefined && { enabled }),
      ...(order !== undefined && { order }),
      updatedAt: new Date(),
    })
    .where(eq(localesTable.code, code))
    .returning()
  // An unknown code updates nothing, which is also how we learn it does not
  // exist — checked before any other locale's default flag is touched.
  if (!locale) return res.status(404).json({ error: 'Locale not found' })

  // Unset the previous default only after this locale has become the default.
  if (isDefault) {
    await db.update(localesTable).set({ isDefault: false }).where(ne(localesTable.code, code))
  }
  invalidateLocaleCache()
  res.json(locale)
})

// Admin: delete locale and all its translations
router.delete('/:code', requireAuth, adminOnly, async (req, res) => {
  const { code } = validate(codeParamsSchema, req.params)
  const [locale] = await db.select().from(localesTable).where(eq(localesTable.code, code)).limit(1)
  if (!locale) return res.status(404).json({ error: 'Locale not found' })
  if (locale.isDefault) return res.status(400).json({ error: 'Cannot delete the default locale' })

  // One transaction: a locale row without its translations, or the reverse,
  // would leave the admin listing a locale whose content is already gone.
  await db.transaction(async (tx) => {
    await tx.delete(translations).where(eq(translations.locale, code))
    await tx.delete(localesTable).where(eq(localesTable.code, code))
  })
  invalidateLocaleCache()
  res.json({ ok: true })
})

export default router
