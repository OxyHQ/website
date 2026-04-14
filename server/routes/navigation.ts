import { Router } from 'express'
import { z } from 'zod'
import { Navigation } from '../models/Navigation.js'
import { Translation } from '../models/Translation.js'
import { Product, type IProduct } from '../models/Product.js'
import { Category } from '../models/Category.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { localeMiddleware } from '../middleware/locale.js'
import { applyTranslations } from '../utils/applyTranslation.js'
import { validate } from '../utils/validate.js'

const router = Router()

const navItemSchema = z.object({
  title: z.string(),
  description: z.string().optional().default(''),
  href: z.string(),
  icon: z.string().optional(),
  image: z.union([z.string(), z.null()]).optional().transform(v => (v && v.length > 0 ? v : null)),
  section: z.string().optional(),
  showGrid: z.boolean().optional(),
})

const navigationBodySchema = z.array(z.object({
  label: z.string(),
  kind: z.enum(['manual', 'apps']).optional().default('manual'),
  order: z.number().optional().default(0),
  items: z.array(navItemSchema).default([]),
  sidePanel: z.union([
    z.object({
      heading: z.string().optional().default(''),
      links: z.array(z.object({ label: z.string(), href: z.string() })).default([]),
    }),
    z.null(),
  ]).optional(),
}))

/**
 * Turn a Product from the CMS into a nav item with the same shape the
 * frontend already expects. landingUrl wins over href — the dropdown is a
 * browsing surface, not a deep link to the running service.
 */
function productToNavItem(product: IProduct, categoryLabel: string): Record<string, unknown> {
  const imageRef = (product as unknown as { logo?: unknown }).logo
  return {
    title: product.name,
    description: product.tagline || product.description || '',
    href: product.landingUrl || product.href,
    image: imageRef ?? null,
    section: categoryLabel,
    showGrid: true,
  }
}

async function resolveAppsDropdown(dropdown: Record<string, unknown>): Promise<Record<string, unknown>> {
  const products = await Product.find({ showInNav: true })
    .sort({ section: 1, order: 1 })
    .populate('logo')

  // Resolve category labels via slug → label. Anything that doesn't match
  // a Category row falls back to the raw section string.
  const categories = await Category.find({ scope: { $in: ['apps', 'generic'] } })
  const labelBySlug = new Map(categories.map((c) => [c.slug, c.label]))

  const generatedItems = products.map((p) =>
    productToNavItem(p, labelBySlug.get(p.section) || p.section || 'Apps'),
  )

  return { ...dropdown, items: generatedItems }
}

router.get('/', localeMiddleware, async (req, res) => {
  const docs = await Navigation.find().sort('order').populate('items.image')

  const hydrated = await Promise.all(
    docs.map(async (doc) => {
      const json = doc.toJSON() as unknown as Record<string, unknown>
      if (json.kind === 'apps') {
        return resolveAppsDropdown(json)
      }
      return json
    }),
  )

  if (req.isDefaultLocale) return res.json(hydrated)

  const translations = await Translation.find({
    locale: req.locale,
    collectionName: 'navigation',
    documentId: { $in: docs.map(i => i._id.toString()) },
  })
  res.json(applyTranslations(hydrated, translations))
})

router.put('/', requireAuth, adminOnly, async (req, res) => {
  const body = validate(navigationBodySchema, req.body)
  await Navigation.deleteMany({})
  const created = await Navigation.insertMany(body)
  const docs = await Navigation.find({ _id: { $in: created.map(c => c._id) } })
    .sort('order')
    .populate('items.image')
  res.json(docs)
})

export default router
