import { Router } from 'express'
import { Translation } from '../models/Translation.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'

const router = Router()

// Valid collections that support translations
const TRANSLATABLE_COLLECTIONS = new Set([
  'navigation', 'footer', 'pricing', 'testimonials',
  'settings', 'pages', 'newsroom', 'jobs',
])

function validateCollection(collectionName: string) {
  return TRANSLATABLE_COLLECTIONS.has(collectionName)
}

function getLocale(req: import('express').Request): string | null {
  const locale = req.query.locale
  if (typeof locale === 'string' && locale) return locale
  return null
}

// Get all translations for a collection + locale
router.get('/:collection', async (req, res) => {
  const collectionName = req.params.collection
  const locale = getLocale(req)
  if (!locale) return res.status(400).json({ error: 'locale query parameter is required' })
  if (!validateCollection(collectionName)) return res.status(400).json({ error: 'Invalid collection' })

  const translations = await Translation.find({ locale, collectionName })
  res.json(translations)
})

// Get translation for a specific document
router.get('/:collection/:documentId', async (req, res) => {
  const collectionName = req.params.collection
  const { documentId } = req.params
  const locale = getLocale(req)
  if (!locale) return res.status(400).json({ error: 'locale query parameter is required' })
  if (!validateCollection(collectionName)) return res.status(400).json({ error: 'Invalid collection' })

  const translation = await Translation.findOne({ locale, collectionName, documentId })
  if (!translation) return res.status(404).json({ error: 'Translation not found' })
  res.json(translation)
})

// Admin: upsert translation for a specific document
router.put('/:collection/:documentId', requireAuth, adminOnly, async (req, res) => {
  const collectionName = req.params.collection as string
  const documentId = req.params.documentId as string
  const locale = getLocale(req)
  if (!locale) return res.status(400).json({ error: 'locale query parameter is required' })
  if (!validateCollection(collectionName)) return res.status(400).json({ error: 'Invalid collection' })

  const { fields } = req.body
  if (!fields || typeof fields !== 'object') return res.status(400).json({ error: 'fields object is required' })

  const translation = await Translation.findOneAndUpdate(
    { locale, collectionName, documentId },
    { locale, collectionName, documentId, fields },
    { upsert: true, new: true },
  )
  res.json(translation)
})

// Admin: delete translation
router.delete('/:collection/:documentId', requireAuth, adminOnly, async (req, res) => {
  const collectionName = req.params.collection as string
  const documentId = req.params.documentId as string
  const locale = getLocale(req)
  if (!locale) return res.status(400).json({ error: 'locale query parameter is required' })
  if (!validateCollection(collectionName)) return res.status(400).json({ error: 'Invalid collection' })

  const result = await Translation.findOneAndDelete({ locale, collectionName, documentId })
  if (!result) return res.status(404).json({ error: 'Translation not found' })
  res.json({ ok: true })
})

export default router
