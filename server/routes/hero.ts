import { Router } from 'express'
import mongoose from 'mongoose'
import { HeroContent, getOrCreateHero, type MediaRef } from '../models/HeroContent.js'
import { Translation } from '../models/Translation.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { localeMiddleware } from '../middleware/locale.js'
import { applyTranslation } from '../utils/applyTranslation.js'
import { validate } from '../utils/validate.js'
import { heroUpdateSchema, type HeroUpdate } from '../validation/hero.js'

const router = Router()

/**
 * Coerce a media-ref-shaped input into the form Mongoose expects on the
 * `Mixed` field: a 24-character hex string is treated as an ObjectId so that
 * `populate()` finds the related Media document; anything else stays as-is
 * (e.g. a static URL like `/images/landing/hero-background.webm`).
 */
function normalizeMediaRef(value: unknown): MediaRef {
  if (value === null || value === undefined || value === '') return null
  if (typeof value !== 'string') return null
  if (mongoose.Types.ObjectId.isValid(value) && value.length === 24) {
    return new mongoose.Types.ObjectId(value)
  }
  return value
}

function applyHeroUpdate(update: HeroUpdate): Record<string, unknown> {
  const next: Record<string, unknown> = {}
  if (update.title !== undefined) next.title = update.title
  if (update.eyebrow !== undefined) next.eyebrow = update.eyebrow
  if (update.backgroundVideoWebm !== undefined) next.backgroundVideoWebm = normalizeMediaRef(update.backgroundVideoWebm)
  if (update.backgroundVideoMp4 !== undefined) next.backgroundVideoMp4 = normalizeMediaRef(update.backgroundVideoMp4)
  if (update.backgroundPoster !== undefined) next.backgroundPoster = normalizeMediaRef(update.backgroundPoster)
  if (update.carouselSlots !== undefined) next.carouselSlots = update.carouselSlots
  return next
}

router.get('/', localeMiddleware, async (req, res) => {
  const hero = await getOrCreateHero()
  const data = hero.toJSON()
  if (req.isDefaultLocale) return res.json(data)

  const translation = await Translation.findOne({
    locale: req.locale,
    collectionName: 'hero',
    documentId: hero._id.toString(),
  })
  res.json(applyTranslation(data, translation))
})

router.put('/', requireAuth, adminOnly, async (req, res) => {
  const body = validate(heroUpdateSchema, req.body)
  // Ensure the singleton exists so updates always have a target.
  await getOrCreateHero({ populate: false })
  const updated = await HeroContent.findOneAndUpdate(
    {},
    applyHeroUpdate(body),
    { new: true, upsert: true },
  ).populate('backgroundVideoWebm backgroundVideoMp4 backgroundPoster')
  if (!updated) return res.status(500).json({ error: 'Failed to update hero content' })
  res.json(updated)
})

export default router
