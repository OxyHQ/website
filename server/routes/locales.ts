import { Router, type Response } from 'express'
import { asc } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/postgres.js'
import { locales as localesTable } from '../db/schema/index.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { validate } from '../utils/validate.js'
import { getEnabledLocalesWithReadiness } from '../utils/localeReadiness.js'
import { createLocale, deleteLocale, LocaleError, updateLocale } from '../services/locales.js'
import { DOMAIN_ERROR_HTTP_STATUS } from '../utils/domainError.js'

const router = Router()

const codeParamsSchema = z.object({ code: z.string().min(1) })

const createLocaleBodySchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  nativeName: z.string().optional(),
  slug: z.string().min(1).optional(),
  isDefault: z.boolean().optional(),
  enabled: z.boolean().optional(),
  order: z.number().int().optional(),
}).passthrough()

const updateLocaleBodySchema = z.object({
  name: z.string().optional(),
  nativeName: z.string().optional(),
  slug: z.string().min(1).optional(),
  isDefault: z.boolean().optional(),
  enabled: z.boolean().optional(),
  order: z.number().int().optional(),
}).passthrough()

function sendLocaleError(res: Response, error: unknown): void {
  if (!(error instanceof LocaleError)) throw error
  res.status(DOMAIN_ERROR_HTTP_STATUS[error.kind]).json({ error: error.message })
}

// Public: list enabled locales, each annotated with translation readiness so
// the build and the sitemap can tell which locales have real content.
router.get('/', async (_req, res) => {
  res.json(await getEnabledLocalesWithReadiness())
})

// List all locales including disabled (used by admin locale switcher)
router.get('/all', async (_req, res) => {
  const rows = await db.select().from(localesTable).orderBy(asc(localesTable.order), asc(localesTable._id))
  res.json(rows)
})

// Admin: create locale. The default-locale invariant lives in services/locales.ts,
// shared with the MCP tools.
router.post('/', requireAuth, adminOnly, async (req, res) => {
  const { code, name, nativeName, slug, isDefault, enabled, order } = validate(createLocaleBodySchema, req.body)
  try {
    res.status(201).json(await createLocale({ code, name, nativeName, slug, isDefault, enabled, order }))
  } catch (error) {
    sendLocaleError(res, error)
  }
})

// Admin: update locale
router.put('/:code', requireAuth, adminOnly, async (req, res) => {
  const { code } = validate(codeParamsSchema, req.params)
  const { name, nativeName, slug, isDefault, enabled, order } = validate(updateLocaleBodySchema, req.body)
  try {
    res.json(await updateLocale(code, { name, nativeName, slug, isDefault, enabled, order }))
  } catch (error) {
    sendLocaleError(res, error)
  }
})

// Admin: delete locale and all its translations
router.delete('/:code', requireAuth, adminOnly, async (req, res) => {
  const { code } = validate(codeParamsSchema, req.params)
  try {
    await deleteLocale(code)
    res.json({ ok: true })
  } catch (error) {
    sendLocaleError(res, error)
  }
})

export default router
