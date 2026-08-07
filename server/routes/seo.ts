import { Router } from 'express'
import { and, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/postgres.js'
import { seoEntries } from '../db/schema/index.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { validate } from '../utils/validate.js'

const router = Router()

type SeoBrand = 'oxy' | 'faircoin'

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

function groupSeoEntries(entries: Array<{ brand: string; path: string; title: string; description: string; ogImage: string }>): Record<SeoBrand, BrandSeo> {
  const out: Record<SeoBrand, BrandSeo> = { oxy: emptyBrand(), faircoin: emptyBrand() }
  for (const e of entries) {
    const brand = out[e.brand as SeoBrand]
    if (!brand) continue
    const meta: SeoMeta = { title: e.title, description: e.description, ogImage: e.ogImage }
    if (e.path === '*') brand.default = meta
    else brand.routes[e.path] = meta
  }
  return out
}

const seoPublicQuerySchema = z.object({
  brand: z.enum(['oxy', 'faircoin']),
  path: z.string().min(1),
})

/** GET /api/seo/all — the whole SEO table, grouped by brand. Admin only. */
router.get('/all', requireAuth, adminOnly, async (_req, res) => {
  const entries = await db.select().from(seoEntries)
  res.set('Cache-Control', 'private, no-store')
  res.json(groupSeoEntries(entries))
})

/**
 * GET /api/seo — public metadata for one brand/path only. Cacheable; the
 * client, prerender, and edge middleware request the route they are rendering
 * instead of enumerating the entire CMS SEO inventory.
 */
router.get('/', async (req, res) => {
  const { brand, path } = validate(seoPublicQuerySchema, req.query)
  const normalizedPath = path.length > 1 && path.endsWith('/') ? path.replace(/\/+$/, '') : path
  const entries = await db
    .select()
    .from(seoEntries)
    .where(and(eq(seoEntries.brand, brand), inArray(seoEntries.path, ['*', normalizedPath || '/'])))
  res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=600')
  res.json(groupSeoEntries(entries))
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
  const [entry] = await db
    .insert(seoEntries)
    .values(body)
    .onConflictDoUpdate({
      target: [seoEntries.brand, seoEntries.path],
      set: { title: body.title, description: body.description, ogImage: body.ogImage, updatedAt: new Date() },
    })
    .returning()
  res.json(entry)
})

const seoDeleteSchema = z.object({
  brand: z.enum(['oxy', 'faircoin']),
  path: z.string().min(1),
})

/** DELETE /api/seo — remove one (brand, path) entry. Admin only. */
router.delete('/', requireAuth, adminOnly, async (req, res) => {
  const { brand, path } = validate(seoDeleteSchema, req.query)
  await db.delete(seoEntries).where(and(eq(seoEntries.brand, brand), eq(seoEntries.path, path)))
  res.json({ ok: true })
})

export default router
