import { Router } from 'express'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/postgres.js'
import { pages } from '../db/schema/index.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { localeMiddleware } from '../middleware/locale.js'
import { localizeOne } from '../utils/localize.js'
import { validate } from '../utils/validate.js'

const router = Router()

const slugParamsSchema = z.object({ slug: z.string().min(1) })
const pageBodySchema = z.object({}).passthrough()

async function findBySlug(slug: string) {
  const [page] = await db.select().from(pages).where(eq(pages.slug, slug)).limit(1)
  return page ?? null
}

router.get('/:slug', localeMiddleware, async (req, res) => {
  const { slug } = validate(slugParamsSchema, req.params)
  const page = await findBySlug(slug)
  if (!page) return res.status(404).json({ error: 'Page not found' })
  res.json(await localizeOne(req, 'pages', page))
})

router.get('/:slug/prompt-phrases', localeMiddleware, async (req, res) => {
  const { slug } = validate(slugParamsSchema, req.params)
  const page = await findBySlug(slug)
  if (!page) return res.json([])
  const merged = await localizeOne(req, 'pages', page)
  res.json(merged.promptPhrases ?? [])
})

router.put('/:slug', requireAuth, adminOnly, async (req, res) => {
  const { slug } = validate(slugParamsSchema, req.params)
  const body = validate(pageBodySchema, req.body)
  const [page] = await db
    .insert(pages)
    .values({ ...body, slug } as never)
    .onConflictDoUpdate({ target: pages.slug, set: { ...body, slug, updatedAt: new Date() } as never })
    .returning()
  res.json(page)
})

export default router
