import { Router } from 'express'
import { z } from 'zod'
import { Translation } from '../models/Translation.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { validate } from '../utils/validate.js'

const router = Router()

// Valid collections that support translations
const TRANSLATABLE_COLLECTIONS = [
  'navigation', 'footer', 'pricing', 'testimonials',
  'settings', 'pages', 'newsroom', 'jobs',
] as const

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
router.get('/:collection', async (req, res) => {
  const { collection: collectionName } = validate(collectionParamsSchema, req.params)
  const { locale } = validate(localeQuerySchema, req.query)

  const translations = await Translation.find({ locale, collectionName })
  res.json(translations)
})

// Get translation for a specific document
router.get('/:collection/:documentId', async (req, res) => {
  const { collection: collectionName, documentId } = validate(collectionAndDocParamsSchema, req.params)
  const { locale } = validate(localeQuerySchema, req.query)

  const translation = await Translation.findOne({ locale, collectionName, documentId })
  if (!translation) return res.status(404).json({ error: 'Translation not found' })
  res.json(translation)
})

// Admin: upsert translation for a specific document
router.put('/:collection/:documentId', requireAuth, adminOnly, async (req, res) => {
  const { collection: collectionName, documentId } = validate(collectionAndDocParamsSchema, req.params)
  const { locale } = validate(localeQuerySchema, req.query)
  const { fields } = validate(upsertBodySchema, req.body)

  const translation = await Translation.findOneAndUpdate(
    { locale, collectionName, documentId },
    { locale, collectionName, documentId, fields },
    { upsert: true, new: true },
  )
  res.json(translation)
})

// Admin: delete translation
router.delete('/:collection/:documentId', requireAuth, adminOnly, async (req, res) => {
  const { collection: collectionName, documentId } = validate(collectionAndDocParamsSchema, req.params)
  const { locale } = validate(localeQuerySchema, req.query)

  const result = await Translation.findOneAndDelete({ locale, collectionName, documentId })
  if (!result) return res.status(404).json({ error: 'Translation not found' })
  res.json({ ok: true })
})

export default router
