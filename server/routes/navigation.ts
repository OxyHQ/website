import { Router } from 'express'
import { and, asc, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/postgres.js'
import { categories, media, navigationDropdowns, products, translations as translationsTable } from '../db/schema/index.js'
import { populate } from '../db/refs.js'
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
 * frontend already expects. By default the dropdown links to the local
 * landing page (oxy.so/<slug>) — admins opt into linking straight to the
 * running app via the navOpensApp toggle.
 */
function productToNavItem(product: Record<string, unknown>, categoryLabel: string): Record<string, unknown> {
  const imageRef = product.logo
  const href = product.navOpensApp
    ? (product.href as string)
    : ((product.landingUrl as string) || (product.href as string))
  return {
    title: product.name,
    description: (product.tagline as string) || (product.description as string) || '',
    href,
    image: imageRef ?? null,
    section: categoryLabel,
    showGrid: true,
  }
}

interface PopulatedCategory {
  _id?: unknown
  label?: string
  order?: number
}

async function resolveAppsDropdown(dropdown: Record<string, unknown>): Promise<Record<string, unknown>> {
  const rows = await db.select().from(products).where(eq(products.showInNav, true))
  const hydrated = await populate(rows as unknown as Record<string, unknown>[], { logo: media, category: categories })

  const withLabels = hydrated.map((product) => {
    const populated = product.category as PopulatedCategory | null
    const label = populated?.label ?? 'Other'
    const sortOrder = populated?.order ?? 99
    return { product, label, sortOrder }
  })

  // Stable sort: category order, then product order within the category.
  withLabels.sort((a, b) => (a.sortOrder - b.sortOrder) || ((a.product.order as number) - (b.product.order as number)))

  const generatedItems = withLabels.map(({ product, label }) => productToNavItem(product, label))
  return { ...dropdown, items: generatedItems }
}

/**
 * Nav items carry an optional `image` media ref inside the `items` JSON, which
 * no join can reach. One query resolves every image across every dropdown.
 */
async function populateItemImages(dropdowns: Record<string, unknown>[]): Promise<void> {
  const items = dropdowns.flatMap((dropdown) => (dropdown.items as Record<string, unknown>[] | null) ?? [])
  await populate(items, { image: media })
}

router.get('/', localeMiddleware, async (req, res) => {
  const docs = await db.select().from(navigationDropdowns).orderBy(asc(navigationDropdowns.order), asc(navigationDropdowns._id))
  await populateItemImages(docs as unknown as Record<string, unknown>[])

  const hydrated = await Promise.all(
    docs.map(async (doc) => {
      const json = doc as unknown as Record<string, unknown>
      if (json.kind === 'apps') {
        return resolveAppsDropdown(json)
      }
      return json
    }),
  )

  if (req.isDefaultLocale) return res.json(hydrated)

  const overlays = await db
    .select()
    .from(translationsTable)
    .where(
      and(
        eq(translationsTable.locale, req.locale as string),
        eq(translationsTable.collectionName, 'navigation'),
        inArray(translationsTable.documentId, docs.map((doc) => doc._id)),
      ),
    )
  res.json(applyTranslations(hydrated, overlays))
})

router.put('/', requireAuth, adminOnly, async (req, res) => {
  const body = validate(navigationBodySchema, req.body)
  // Replace wholesale in one transaction: the admin sends every dropdown, and
  // a half-applied replacement would leave the site with no navigation.
  const docs = await db.transaction(async (tx) => {
    await tx.delete(navigationDropdowns)
    if (body.length === 0) return []
    return tx.insert(navigationDropdowns).values(body as never).returning()
  })
  const sorted = [...docs].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  await populateItemImages(sorted as unknown as Record<string, unknown>[])
  res.json(sorted)
})

export default router
