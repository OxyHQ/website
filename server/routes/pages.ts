import { Router } from 'express'
import { Page } from '../models/Page.js'
import { Translation } from '../models/Translation.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { localeMiddleware } from '../middleware/locale.js'
import { applyTranslation } from '../utils/applyTranslation.js'

const router = Router()

router.get('/:slug', localeMiddleware, async (req, res) => {
  const page = await Page.findOne({ slug: req.params.slug })
  if (!page) return res.status(404).json({ error: 'Page not found' })
  if (req.isDefaultLocale) return res.json(page)

  const translation = await Translation.findOne({
    locale: req.locale,
    collectionName: 'pages',
    documentId: page._id.toString(),
  })
  res.json(applyTranslation(page.toJSON(), translation))
})

router.get('/:slug/prompt-phrases', localeMiddleware, async (req, res) => {
  const page = await Page.findOne({ slug: req.params.slug })
  if (!page) return res.json([])
  if (req.isDefaultLocale) return res.json(page.promptPhrases ?? [])

  const translation = await Translation.findOne({
    locale: req.locale,
    collectionName: 'pages',
    documentId: page._id.toString(),
  })
  const merged = applyTranslation(page.toJSON(), translation)
  res.json(merged.promptPhrases ?? [])
})

router.put('/:slug', requireAuth, adminOnly, async (req, res) => {
  const page = await Page.findOneAndUpdate(
    { slug: req.params.slug },
    req.body,
    { new: true, upsert: true, runValidators: true },
  )
  res.json(page)
})

export default router
