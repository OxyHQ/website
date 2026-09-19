import { and, asc, count, eq, sql, type SQL } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../db/postgres.js'
import { populate, populateOne } from '../../db/refs.js'
import { isUniqueViolation } from '../../db/pgErrors.js'
import { categories, courses, helpArticles, media, newsroomPosts, products, resources } from '../../db/schema/index.js'
import { overlayMany, overlayOne } from '../localized.js'
import type { ToolRegistrar } from '../registry.js'
import { conflict, invalid, notFound, ok } from '../results.js'
import {
  deletedOutput, dryRunInput, expectedUpdatedAtInput, hexColorInput, itemsOutput, linkInput, objectIdInput, optionalLinkInput, readLocaleInput,
  recordOutput, slugInput, slugLookup, text,
} from '../schemas.js'
import { auditLog, deleteRecord, updateRecord } from '../writes.js'

/* Categories and the product inventory behind /technologies, /status and the
   navbar. A product's `category` (a category row) is the source of truth for
   grouping; `section` is the legacy free-text label, kept in step when a
   category is set without one. */

const SCOPE = z.enum(['apps', 'nav', 'generic'])
const LIFECYCLE = z.enum(['live', 'in-development'])
const PRODUCT_REFS = { logo: media, category: categories }
const productIdInput = z.string().min(1).max(60).regex(/^[a-z0-9][a-z0-9-]*$/, 'Lower-case letters, digits and dashes, e.g. "mention"')

/** A category given by _id or slug → its row, or null to clear. */
async function resolveCategory(value: string | undefined): Promise<{ id: string; slug: string } | null | undefined> {
  if (value === undefined) return undefined
  if (value === '') return null
  const [row] = await db
    .select({ id: categories._id, slug: categories.slug })
    .from(categories)
    .where(/^[0-9a-f]{24}$/i.test(value) ? eq(categories._id, value) : eq(categories.slug, value))
    .limit(1)
  if (!row) throw invalid(`No category "${value}"`)
  return row
}

const productFields = {
  tagline: text(200).optional().describe('Line above the title on the product card'),
  description: text(2000).optional().describe('Card body copy'),
  landingUrl: optionalLinkInput.optional().describe('Local landing page (e.g. "/inbox"); /technologies and the navbar link here instead of href'),
  healthUrl: optionalLinkInput.optional().describe('URL probed by /status; defaults to href'),
  external: z.boolean().optional().describe('Off-site destination (new tab)'),
  cta: text(60).optional().describe('CTA label, e.g. "Visit Mention"'),
  brandForeground: z.union([z.literal(''), hexColorInput]).optional().describe('Icon mark text colour; defaults to white'),
  logo: z.union([z.literal(''), objectIdInput]).optional().describe('Media _id for the logo; empty string clears it'),
  category: text(120).optional().describe('Category _id or slug; empty string clears it. The source of truth for grouping.'),
  section: text(120).optional().describe('Legacy grouping label. Set from the category slug when a category is given without it.'),
  lifecycle: LIFECYCLE.optional().describe('"live" or "in-development"'),
  showOnProducts: z.boolean().optional().describe('Shown on /technologies'),
  showOnStatus: z.boolean().optional().describe('Probed on /status'),
  showInNav: z.boolean().optional().describe('In the ecosystem navbar dropdown'),
  navOpensApp: z.boolean().optional().describe('Navbar links straight to href even when landingUrl is set'),
  order: z.number().int().optional().describe('Order within the section'),
}

async function normalizeProduct(fields: Record<string, unknown>): Promise<Record<string, unknown>> {
  const next: Record<string, unknown> = { ...fields }
  for (const key of ['landingUrl', 'healthUrl', 'brandForeground', 'logo'] as const) {
    if (fields[key] !== undefined) next[key] = fields[key] || null
  }
  const category = await resolveCategory(fields.category as string | undefined)
  if (category !== undefined) {
    next.category = category?.id ?? null
    if (category && fields.section === undefined) next.section = category.slug
  }
  return next
}

export function registerProductTools(server: ToolRegistrar): void {
  server.tool('list_categories', 'List categories in display order, optionally one scope.', {
    scope: SCOPE.optional().describe('"apps" (products/status), "nav" (navbar headings) or "generic"'),
    locale: readLocaleInput,
  }, async ({ scope, locale }) => {
    const rows = await db.select().from(categories).where(scope ? eq(categories.scope, scope) : undefined).orderBy(asc(categories.order), asc(categories.label), asc(categories._id))
    return ok(await overlayMany('categories', rows, locale))
  }, { output: 'items', outputSchema: itemsOutput, localized: true })

  server.tool('get_category', 'Get a category by slug.', {
    slug: slugLookup,
    locale: readLocaleInput,
  }, async ({ slug, locale }) => {
    const [row] = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1)
    if (!row) throw notFound('Category')
    return ok(await overlayOne('categories', row, locale))
  }, { outputSchema: recordOutput, localized: true })

  server.tool('create_category', 'Create a category: a reusable grouping label for products, navbar dropdowns and Academy content.', {
    slug: slugInput.describe('Stable id, e.g. "social-communication"'),
    label: text(120).min(1).describe('Label shown on the site'),
    description: text(2000).optional(),
    scope: SCOPE.optional().describe('Where it may be used. Defaults to "generic".'),
    order: z.number().int().optional(),
  }, async (input, context) => {
    try {
      const [row] = await db.insert(categories).values(input).returning()
      auditLog(context, 'create_category', { id: row._id, slug: row.slug })
      return ok(row)
    } catch (error) {
      if (isUniqueViolation(error)) throw conflict(`Category "${input.slug}" already exists`)
      throw error
    }
  }, { outputSchema: recordOutput })

  server.tool('update_category', 'Update a category by slug. Only the fields you pass change; the slug is permanent.', {
    slug: slugLookup,
    label: text(120).min(1).optional(),
    description: text(2000).optional(),
    scope: SCOPE.optional(),
    order: z.number().int().optional(),
    expectedUpdatedAt: expectedUpdatedAtInput,
  }, async ({ slug, expectedUpdatedAt, ...patch }, context) => {
    const row = await updateRecord({ table: categories, where: eq(categories.slug, slug), label: 'Category', patch, expectedUpdatedAt })
    auditLog(context, 'update_category', { id: row._id, slug })
    return ok(row)
  }, { outputSchema: recordOutput })

  server.tool('delete_category', 'Permanently delete a category. Products and Academy content pointing at it lose their category. dryRun: true counts what points at it.', {
    slug: slugLookup,
    dryRun: dryRunInput,
    expectedUpdatedAt: expectedUpdatedAtInput,
  }, async ({ slug, dryRun, expectedUpdatedAt }, context) => {
    const result = await deleteRecord({
      table: categories,
      where: eq(categories.slug, slug),
      label: 'Category',
      dryRun,
      expectedUpdatedAt,
      describe: (row) => ({ _id: row._id, slug: row.slug, label: row.label, scope: row.scope }),
      impact: async (row) => {
        const id = String(row._id)
        const tally = async (table: typeof products | typeof courses | typeof resources | typeof helpArticles) =>
          Number((await db.select({ value: count() }).from(table).where(eq(table.category, id)))[0]?.value ?? 0)
        return { products: await tally(products), courses: await tally(courses), resources: await tally(resources), helpArticles: await tally(helpArticles) }
      },
    })
    if (result.deleted) auditLog(context, 'delete_category', { id: result.target._id, slug })
    return ok(result.deleted ? { deleted: true, slug, category: result.target } : result)
  }, { outputSchema: deletedOutput })

  server.tool('list_products', 'List products, logo and category resolved, filtered by lifecycle, section or surface. `category` is an admin filter.', {
    lifecycle: LIFECYCLE.optional(),
    section: text(120).optional().describe('Legacy section label'),
    surface: z.enum(['products', 'status', 'nav']).optional().describe('Products shown on that surface'),
    category: text(120).optional().describe('Admins only: category _id or slug'),
    locale: readLocaleInput,
  }, async ({ lifecycle, section, surface, category, locale }) => {
    const filters: SQL[] = []
    if (lifecycle) filters.push(eq(products.lifecycle, lifecycle))
    if (section) filters.push(eq(products.section, section))
    if (surface === 'products') filters.push(eq(products.showOnProducts, true))
    if (surface === 'status') filters.push(eq(products.showOnStatus, true))
    if (surface === 'nav') filters.push(eq(products.showInNav, true))
    if (category) {
      const resolved = await resolveCategory(category)
      if (resolved) filters.push(eq(products.category, resolved.id))
    }
    const rows = await db.select().from(products).where(filters.length > 0 ? and(...filters) : undefined).orderBy(asc(products.lifecycle), asc(products.section), asc(products.order), asc(products._id))
    return ok(await overlayMany('products', await populate(rows, PRODUCT_REFS), locale))
  }, { output: 'items', outputSchema: itemsOutput, localized: true })

  server.tool('get_product', 'Get a product by productId, logo and category resolved.', {
    productId: text(60).min(1).describe('e.g. "mention"'),
    locale: readLocaleInput,
  }, async ({ productId, locale }) => {
    const [row] = await db.select().from(products).where(eq(products.productId, productId)).limit(1)
    if (!row) throw notFound('Product')
    return ok(await overlayOne('products', (await populateOne(row, PRODUCT_REFS)) as Record<string, unknown>, locale))
  }, { outputSchema: recordOutput, localized: true })

  server.tool('create_product', 'Create a product. By default it appears on /technologies, /status and the navbar.', {
    productId: productIdInput.describe('Stable id, e.g. "alia"'),
    name: text(120).min(1),
    href: linkInput.describe('Canonical destination: the running app or an external URL'),
    brand: hexColorInput.describe('Accent colour, e.g. "#7c3aed"'),
    mark: text(2).min(1).describe('Letter shown in the brand square when there is no logo'),
    ...productFields,
  }, async (input, context) => {
    try {
      const [row] = await db.insert(products).values((await normalizeProduct(input)) as never).returning()
      auditLog(context, 'create_product', { id: row._id, productId: row.productId })
      return ok(await populateOne(row, PRODUCT_REFS))
    } catch (error) {
      if (isUniqueViolation(error)) throw conflict(`Product "${input.productId}" already exists`)
      throw error
    }
  }, { outputSchema: recordOutput })

  server.tool('update_product', 'Update a product by productId. Only the fields you pass change.', {
    productId: text(60).min(1),
    name: text(120).min(1).optional(),
    href: linkInput.optional(),
    brand: hexColorInput.optional(),
    mark: text(2).min(1).optional(),
    ...productFields,
    expectedUpdatedAt: expectedUpdatedAtInput,
  }, async ({ productId, expectedUpdatedAt, ...fields }, context) => {
    const row = await updateRecord({ table: products, where: eq(products.productId, productId), label: 'Product', patch: await normalizeProduct(fields), expectedUpdatedAt })
    auditLog(context, 'update_product', { id: row._id, productId })
    return ok(await populateOne(row, PRODUCT_REFS))
  }, { outputSchema: recordOutput })

  server.tool('delete_product', 'Permanently delete a product. Newsroom posts that mention it stop listing it. dryRun: true shows it and how many posts mention it. To take a product off the site, turn its surfaces off instead.', {
    productId: text(60).min(1),
    dryRun: dryRunInput,
    expectedUpdatedAt: expectedUpdatedAtInput,
  }, async ({ productId, dryRun, expectedUpdatedAt }, context) => {
    const result = await deleteRecord({
      table: products,
      where: eq(products.productId, productId),
      label: 'Product',
      dryRun,
      expectedUpdatedAt,
      describe: (row) => ({ _id: row._id, productId: row.productId, name: row.name }),
      impact: async (row) => {
        const [n] = await db.select({ value: count() }).from(newsroomPosts).where(sql`${newsroomPosts.products} @> ARRAY[${String(row._id)}]::text[]`)
        return { newsroomPostsMentioning: Number(n?.value ?? 0) }
      },
    })
    if (result.deleted) auditLog(context, 'delete_product', { id: result.target._id, productId })
    return ok(result.deleted ? { deleted: true, productId, product: result.target } : result)
  }, { outputSchema: deletedOutput })
}
