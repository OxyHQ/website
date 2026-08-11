import { Router } from 'express'
import { db } from '../db/postgres.js'
import { heroContents, media } from '../db/schema/index.js'
import { populateOne } from '../db/refs.js'
import { upsertSingleton } from '../db/singleton.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { localeMiddleware } from '../middleware/locale.js'
import { localizeOne } from '../utils/localize.js'
import { validate } from '../utils/validate.js'
import { heroUpdateSchema, type HeroUpdate } from '../validation/hero.js'

const router = Router()

/** The three media fields, which may hold an id or a plain URL. */
const MEDIA_FIELDS = ['backgroundVideoWebm', 'backgroundVideoMp4', 'backgroundPoster'] as const

/**
 * A media field is either a Media `_id` or a static URL like
 * `/images/landing/hero-background.webm`. Only the first kind is looked up;
 * the second is handed back untouched, which is why these are not foreign keys.
 */
function isMediaId(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{24}$/i.test(value)
}

async function withMedia(hero: Record<string, unknown>): Promise<Record<string, unknown>> {
  const populated = { ...hero }
  for (const field of MEDIA_FIELDS) {
    const value = populated[field]
    if (!isMediaId(value)) continue
    const resolved = await populateOne({ ref: value }, { ref: media })
    populated[field] = resolved?.ref ?? value
  }
  return populated
}

/** The hero is a singleton: read the row, or hand back an empty one. */
async function readHero(): Promise<Record<string, unknown>> {
  const [row] = await db.select().from(heroContents).limit(1)
  if (row) return row
  const [created] = await db.insert(heroContents).values({}).returning()
  return created
}

function applyHeroUpdate(update: HeroUpdate): Record<string, unknown> {
  const next: Record<string, unknown> = {}
  if (update.title !== undefined) next.title = update.title
  if (update.backgroundVideoWebm !== undefined) next.backgroundVideoWebm = update.backgroundVideoWebm || null
  if (update.backgroundVideoMp4 !== undefined) next.backgroundVideoMp4 = update.backgroundVideoMp4 || null
  if (update.backgroundPoster !== undefined) next.backgroundPoster = update.backgroundPoster || null
  return next
}

router.get('/', localeMiddleware, async (req, res) => {
  const hero = await withMedia(await readHero())
  res.json(await localizeOne(req, 'hero', hero))
})

router.put('/', requireAuth, adminOnly, async (req, res) => {
  const body = validate(heroUpdateSchema, req.body)
  const updated = (await upsertSingleton(heroContents, applyHeroUpdate(body))) as Record<string, unknown> | undefined
  if (!updated) return res.status(500).json({ error: 'Failed to update hero content' })
  res.json(await withMedia(updated))
})

export default router
