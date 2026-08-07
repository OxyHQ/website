import { Router } from 'express'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/postgres.js'
import { translations } from '../db/schema/index.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { validate } from '../utils/validate.js'
import { TRANSLATABLE_COLLECTIONS } from '../constants/translations.js'

const router = Router()

const collectionParamsSchema = z.object({
  collection: z.enum(TRANSLATABLE_COLLECTIONS),
})

const collectionAndDocParamsSchema = z.object({
  collection: z.enum(TRANSLATABLE_COLLECTIONS),
  documentId: z.string().min(1),
})

const localeQuerySchema = z.object({
  locale: z.string().min(1, 'locale query parameter is required'),
}).passthrough()

const upsertBodySchema = z.object({
  fields: z.record(z.string(), z.unknown()),
}).passthrough()

// Get all translations for a collection + locale
router.get('/:collection', requireAuth, adminOnly, async (req, res) => {
  const { collection: collectionName } = validate(collectionParamsSchema, req.params)
  const { locale } = validate(localeQuerySchema, req.query)

  const rows = await db
    .select()
    .from(translations)
    .where(and(eq(translations.locale, locale), eq(translations.collectionName, collectionName)))
  res.json(rows)
})

// Get translation for a specific document
router.get('/:collection/:documentId', requireAuth, adminOnly, async (req, res) => {
  const { collection: collectionName, documentId } = validate(collectionAndDocParamsSchema, req.params)
  const { locale } = validate(localeQuerySchema, req.query)

  const [translation] = await db
    .select()
    .from(translations)
    .where(
      and(
        eq(translations.locale, locale),
        eq(translations.collectionName, collectionName),
        eq(translations.documentId, documentId),
      ),
    )
    .limit(1)
  if (!translation) return res.status(404).json({ error: 'Translation not found' })
  res.json(translation)
})

// Admin: upsert translation for a specific document
router.put('/:collection/:documentId', requireAuth, adminOnly, async (req, res) => {
  const { collection: collectionName, documentId } = validate(collectionAndDocParamsSchema, req.params)
  const { locale } = validate(localeQuerySchema, req.query)
  const { fields } = validate(upsertBodySchema, req.body)

  const [translation] = await db
    .insert(translations)
    .values({ locale, collectionName, documentId, fields })
    .onConflictDoUpdate({
      target: [translations.locale, translations.collectionName, translations.documentId],
      set: { fields, updatedAt: new Date() },
    })
    .returning()
  res.json(translation)
})

// Admin: delete translation
router.delete('/:collection/:documentId', requireAuth, adminOnly, async (req, res) => {
  const { collection: collectionName, documentId } = validate(collectionAndDocParamsSchema, req.params)
  const { locale } = validate(localeQuerySchema, req.query)

  const [removed] = await db
    .delete(translations)
    .where(
      and(
        eq(translations.locale, locale),
        eq(translations.collectionName, collectionName),
        eq(translations.documentId, documentId),
      ),
    )
    .returning({ id: translations._id })
  if (!removed) return res.status(404).json({ error: 'Translation not found' })
  res.json({ ok: true })
})

export default router
