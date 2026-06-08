import { Router } from 'express'
import { z } from 'zod'
import { Seo, type SeoBrand } from '../models/Seo.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { validate } from '../utils/validate.js'

const router = Router()

interface SeoMeta {
  title: string
  description: string
  ogImage: string
}
interface BrandSeo {
  default: SeoMeta | null
  routes: Record<string, SeoMeta>
}

const emptyBrand = (): BrandSeo => ({ default: null, routes: {} })

/**
 * GET /api/seo — the whole SEO table, grouped by brand:
 * `{ oxy: { default, routes }, faircoin: { default, routes } }`. Cacheable; the
 * client, prerender, and edge middleware each fetch this once and resolve a
 * route locally.
 */
router.get('/', async (_req, res) => {
  const entries = await Seo.find().lean()
  const out: Record<SeoBrand, BrandSeo> = { oxy: emptyBrand(), faircoin: emptyBrand() }
  for (const e of entries) {
    const brand = out[e.brand as SeoBrand] ?? (out[e.brand as SeoBrand] = emptyBrand())
    const meta: SeoMeta = { title: e.title, description: e.description, ogImage: e.ogImage }
    if (e.path === '*') brand.default = meta
    else brand.routes[e.path] = meta
  }
  res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=600')
  res.json(out)
})

const seoBodySchema = z.object({
  brand: z.enum(['oxy', 'faircoin']),
  path: z.string().min(1),
  title: z.string().default(''),
  description: z.string().default(''),
  ogImage: z.string().default(''),
})

/** PUT /api/seo — upsert one (brand, path) entry. Admin only. */
router.put('/', requireAuth, adminOnly, async (req, res) => {
  const body = validate(seoBodySchema, req.body)
  const entry = await Seo.findOneAndUpdate(
    { brand: body.brand, path: body.path },
    body,
    { new: true, upsert: true },
  )
  res.json(entry)
})

const seoDeleteSchema = z.object({
  brand: z.enum(['oxy', 'faircoin']),
  path: z.string().min(1),
})

/** DELETE /api/seo — remove one (brand, path) entry. Admin only. */
router.delete('/', requireAuth, adminOnly, async (req, res) => {
  const { brand, path } = validate(seoDeleteSchema, req.query)
  await Seo.deleteOne({ brand, path })
  res.json({ ok: true })
})

export default router
