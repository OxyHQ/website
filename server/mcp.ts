import express from 'express'
import { and, asc, count, desc, eq, ilike, like, not, or, sql, type SQL } from 'drizzle-orm'
import { z } from 'zod'
import { OxyServices } from '@oxy.so/core'
import { appCapabilityCatalogSchema, type AppCapabilityCatalog, type CatalogTool } from '@oxy.so/contracts'
import {
  createCatalogMcpHttpService,
  type CatalogMcpAuthorizationDecision,
  type CatalogInvocationContext,
  type CatalogToolHandlers,
  type CatalogToolResult,
} from '@oxy.so/mcp'
import { config } from './config.js'
import { effectsFor, MCP_TOOL_ACCESS, PublicReadRefused, type McpToolAccess } from './mcpAccess.js'
import { conflict, errorOf, invalid, notFound, ok, toolError, type ToolResult } from './mcp/results.js'
import { idempotencyKeyInput, withIdempotency } from './mcp/idempotency.js'

// Models
import type { PgTable } from 'drizzle-orm/pg-core'
import { db } from './db/postgres.js'
import { populate, populateOne } from './db/refs.js'
import { upsertSingleton } from './db/singleton.js'
import {
  categories,
  changelogEntries,
  courses,
  helpArticles,
  footers,
  heroContents,
  jobs,
  locales,
  media,
  navigationDropdowns,
  newsroomPosts,
  pages,
  pricingPlans,
  products,
  referrals,
  resources,
  siteSettings,
  teamMembers,
  testimonials as testimonialsTable,
  trackedRepos,
  translations,
} from './db/schema/index.js'
import { syncAllRepos, syncSingleRepo } from './services/githubSync.js'
import { deleteFromSpaces, keyFromPublicUrl, uploadToSpaces } from './services/s3.js'
import { downloadRemote } from './services/remoteDownload.js'
import { deleteMedia, ingestImage, MEDIA_FOLDER_PATTERN, type MediaRow } from './services/media.js'
import { createLocale, deleteLocale, updateLocale } from './services/locales.js'
import { insertWithSlug, slugBase, SLUG_PATTERN, MAX_SLUG_LENGTH } from './services/slugs.js'
import { HERO_MEDIA_FIELDS, readHero, withHeroMedia } from './services/hero.js'
import { heroUpdateRawShape, heroUpdateSchema, type HeroUpdate } from './validation/hero.js'
import { TRANSLATABLE_COLLECTIONS } from './constants/translations.js'
import { isNewsroomThemePreset, newsroomThemeForSlug } from './constants/newsroomThemes.js'

// ── Tool registration ───────────────────────────────────────────────────────

type ToolShape = Record<string, z.ZodType>

/**
 * Who is acting and on which request. `actorId` is the connection's active Oxy
 * account as Oxy reported it on introspection — never a value from the tool
 * input — so it is what audit fields record. Editorial fields such as a post's
 * author stay separate and may name someone else.
 */
export interface ToolContext {
  actorId: string
  signal?: AbortSignal
  requestId?: string | number
}

interface ToolDefinition {
  name: string
  description: string
  shape: ToolShape
  handler: (args: Record<string, unknown>, context: ToolContext) => Promise<ToolResult>
}

/**
 * The surface `registerTools` writes against. A tool is declared once here and
 * compiled into both the Oxy capability catalog and the MCP handler table.
 */
interface ToolRegistrar {
  tool<Shape extends ToolShape>(
    name: string,
    description: string,
    shape: Shape,
    handler: (args: z.infer<z.ZodObject<Shape>>, context: ToolContext) => Promise<ToolResult>,
  ): void
}

/**
 * Maintenance-only tools, absent from the catalog unless switched on for a
 * deploy. They still need an access policy, which the boot check accepts for
 * a disabled tool.
 */
export const OPTIONAL_TOOLS: ReadonlySet<string> = new Set(['debug_upload_test'])

function diagnosticsEnabled(): boolean {
  return process.env.MCP_ENABLE_DIAGNOSTICS === 'true'
}

function collectTools(): ToolDefinition[] {
  const definitions: ToolDefinition[] = []
  registerTools({
    tool(name, description, shape, handler) {
      if (definitions.some((definition) => definition.name === name)) {
        throw new Error(`Duplicate MCP tool: ${name}`)
      }
      if (OPTIONAL_TOOLS.has(name) && !diagnosticsEnabled()) return
      // Every write accepts an idempotency key: that is what the catalog's
      // `idempotency: 'supported'` promises (see mcp/idempotency.ts).
      const writes = MCP_TOOL_ACCESS[name]?.kind === 'write'
      definitions.push({
        name,
        description,
        shape: writes ? { ...shape, idempotencyKey: idempotencyKeyInput.optional() } : shape,
        handler: handler as ToolDefinition['handler'],
      })
    },
  })
  return definitions
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** A slug a caller may pass explicitly: lower-case words joined by single dashes. */
const slugInput = z.string().min(1).max(MAX_SLUG_LENGTH).regex(SLUG_PATTERN, 'Use lower-case letters, digits and single dashes')

/** Media folder under `oxy-website/`: one lower-case segment. */
const folderInput = z.string().regex(MEDIA_FOLDER_PATTERN, 'One lower-case segment of letters, digits and dashes, e.g. "newsroom"')

/** Source URL for a download; `safeFetch` still validates every hop. */
const sourceUrlInput = z.string().url().max(2048).refine((value) => /^https?:\/\//i.test(value), 'Must be an http(s) URL')

function filenameFromUrl(url: string): string | undefined {
  try {
    return new URL(url).pathname.split('/').pop() || undefined
  } catch {
    return undefined
  }
}

/** The media fields tools hand back after an upload, without internal storage keys. */
function mediaSummary(row: MediaRow): Record<string, unknown> {
  return row as unknown as Record<string, unknown>
}

function registerTools(server: ToolRegistrar) {

// ── Diagnostics ─────────────────────────────────────────────────────────────

server.tool('debug_upload_test', 'Maintenance only (enabled with MCP_ENABLE_DIAGNOSTICS). Downloads a URL, stores it under a diagnostics prefix, writes and removes a media row, and deletes the stored object again, reporting which step failed.', {
  url: sourceUrlInput.describe('URL to test downloading'),
}, async ({ url }, context) => {
  const steps: { step: string; ok: boolean }[] = []
  let storedKey: string | null = null
  let mediaId: string | null = null
  try {
    const { buffer } = await downloadRemote(url, { signal: context.signal })
    steps.push({ step: `download (${buffer.length} bytes)`, ok: true })
    const cdnUrl = await uploadToSpaces(buffer, 'debug-test.bin', 'application/octet-stream', 'oxy-website/debug')
    storedKey = keyFromPublicUrl(cdnUrl)
    steps.push({ step: 'storage upload', ok: true })
    const [row] = await db.insert(media).values({
      url: cdnUrl, thumbnails: { sm: '', md: '', lg: '' },
      filename: 'debug-test.bin', key: storedKey ?? '',
      mimeType: 'application/octet-stream', size: buffer.length,
      alt: '', tags: ['debug'], folder: 'debug', uploadedBy: context.actorId,
    }).returning({ id: media._id })
    mediaId = row.id
    steps.push({ step: 'media insert', ok: true })
    return ok({ success: true, steps })
  } catch (e) {
    const failure = toolError(e)
    steps.push({ step: 'failed', ok: false })
    return { ...failure, structuredContent: { ...failure.structuredContent, steps } }
  } finally {
    // Cleanup runs whatever happened above, and its own failure is logged, not
    // swallowed into a success.
    if (mediaId) await db.delete(media).where(eq(media._id, mediaId)).catch((e) => console.error('[mcp] debug_upload_test: media cleanup failed', e))
    if (storedKey) await deleteFromSpaces(storedKey).catch((e) => console.error('[mcp] debug_upload_test: storage cleanup failed', e))
  }
})

/** `Model.create(values)` became one insert that hands the row back. */
async function insertOne(table: PgTable, values: Record<string, unknown>): Promise<Record<string, unknown>> {
  const [row] = await db.insert(table).values(values as never).returning()
  if (!row) throw new Error('Insert returned no row')
  return row as Record<string, unknown>
}

// ── Pages ───────────────────────────────────────────────────────────────────

server.tool('list_pages', 'List all page slugs', {}, async () => {
  try {
    const rows = await db.select({ _id: pages._id, slug: pages.slug, title: pages.title }).from(pages).orderBy(asc(pages.slug), asc(pages._id))
    return ok(rows)
  } catch (e) { return toolError(e) }
})

server.tool('get_page', 'Get a page by slug', { slug: z.string() }, async ({ slug }) => {
  try {
    const [page] = await db.select().from(pages).where(eq(pages.slug, slug)).limit(1)
    if (!page) return toolError(notFound('Page'))
    return ok(page)
  } catch (e) { return toolError(e) }
})

const sectionSchema = z.object({
  type: z.string(),
  heading: z.string().optional(),
  subheading: z.string().optional(),
  content: z.string().optional(),
  items: z.array(z.any()).optional(),
  order: z.number().optional(),
})

server.tool('upsert_page', 'Create or update a page', {
  slug: z.string(),
  title: z.string(),
  description: z.string().optional(),
  sections: z.array(sectionSchema).optional(),
  promptPhrases: z.array(z.string()).optional(),
}, async (params) => {
  try {
    const [page] = await db
      .insert(pages)
      .values(params as never)
      .onConflictDoUpdate({ target: pages.slug, set: { ...params, updatedAt: new Date() } as never })
      .returning()
    return ok(page)
  } catch (e) { return toolError(e) }
})

// ── Navigation ──────────────────────────────────────────────────────────────

server.tool('get_navigation', 'Get all navigation dropdowns', {}, async () => {
  try {
    const nav = await db.select().from(navigationDropdowns).orderBy(asc(navigationDropdowns.order), asc(navigationDropdowns._id))
    return ok(nav)
  } catch (e) { return toolError(e) }
})

// ── Footer ──────────────────────────────────────────────────────────────────

server.tool('get_footer', 'Get the legacy footer snapshot', {}, async () => {
  try {
    const [footer] = await db.select().from(footers).limit(1)
    return ok(footer ?? { columns: [], socialLinks: [], copyright: '' })
  } catch (e) { return toolError(e) }
})

// The live footer is code-owned. The legacy read-only snapshot remains useful
// for audit and recovery, but there is intentionally no update tool.

// ── Hero ────────────────────────────────────────────────────────────────────

server.tool('get_hero', 'Get the homepage hero singleton: title and background video/poster. Before the hero has ever been edited this returns the shipped defaults with `_id: null`; reading never creates the row.', {}, async () => {
  try {
    return ok(await withHeroMedia(await readHero()))
  } catch (e) { return toolError(e) }
})

server.tool('update_hero', 'Update the homepage hero. Pass any subset of: title (supports newlines), background video/poster (Media _id or static URL like "/images/landing/hero-panel.webm"). Only provided fields are changed.', heroUpdateRawShape, async (params: HeroUpdate) => {
  try {
    // Re-validate via the same schema the REST route uses so the MCP and the
    // HTTP path stay in lockstep on shape, defaults, and rejections.
    const body = heroUpdateSchema.parse(params)

    const update: Record<string, unknown> = {}
    if (body.title !== undefined) update.title = body.title
    // A media field holds either a Media `_id` or a static URL; both are
    // stored as given and resolved on read.
    for (const field of HERO_MEDIA_FIELDS) {
      const value = body[field]
      if (value === undefined) continue
      update[field] = value || null
    }

    const hero = (await upsertSingleton(heroContents, update)) as Record<string, unknown> | undefined
    if (!hero) throw new Error('Hero upsert returned no row')
    // Selective populate: the media fields may hold static URLs, not ids.
    return ok(await withHeroMedia(hero))
  } catch (e) { return toolError(e) }
})

// ── Newsroom ────────────────────────────────────────────────────────────────

/** The media refs every post response carries inline. */
const POST_REFS = { coverImage: media, ogImage: media }

/** Courses, resources and help articles all carry these two inline. */
const CONTENT_REFS = { coverImage: media, category: categories }

server.tool('list_posts', 'List newsroom posts with optional filtering by category, tag, featured status, and publication status. Returns paginated results sorted by publishedAt descending.', {
  category: z.string().optional().describe('Filter by category. Posts whose categories array contains this value. Common: Company, Research, Product, Safety, Engineering, Security'),
  tag: z.string().optional().describe('Filter by tag'),
  featured: z.boolean().optional().describe('Filter to only featured posts'),
  status: z.enum(['draft', 'published']).optional().describe('Filter by publication status. Omit to return all posts.'),
  search: z.string().optional().describe('Search posts by title or resume text'),
  limit: z.number().optional().describe('Results per page (default 20)'),
  page: z.number().optional().describe('Page number (default 1)'),
}, async (params) => {
  try {
    const filters: SQL[] = []
    if (params.category) filters.push(sql`${newsroomPosts.categories} @> ARRAY[${params.category}]::text[]`)
    if (params.tag) filters.push(sql`${newsroomPosts.tags} @> ARRAY[${params.tag}]::text[]`)
    if (params.featured) filters.push(eq(newsroomPosts.featured, true))
    if (params.status) filters.push(eq(newsroomPosts.status, params.status))

    if (params.search) {
      const pattern = `%${params.search}%`
      const searchFilter = or(ilike(newsroomPosts.title, pattern), ilike(newsroomPosts.resume, pattern))
      if (searchFilter) filters.push(searchFilter)
    }
    const where = filters.length > 0 ? and(...filters) : undefined

    const limit = params.limit ?? 20
    const page = params.page ?? 1
    const skip = (page - 1) * limit

    const [rows, [totals]] = await Promise.all([
      db.select().from(newsroomPosts).where(where).orderBy(desc(newsroomPosts.publishedAt), asc(newsroomPosts._id)).offset(skip).limit(limit),
      db.select({ value: count() }).from(newsroomPosts).where(where),
    ])
    const total = Number(totals?.value ?? 0)
    const posts = await populate(rows, POST_REFS)
    return ok({ posts, total, page, pages: Math.ceil(total / limit) })
  } catch (e) { return toolError(e) }
})

server.tool('get_post', 'Get a single newsroom post by its URL slug. Returns full post content including markdown body.', {
  slug: z.string().describe('The URL slug of the post'),
}, async ({ slug }) => {
  try {
    const [row] = await db.select().from(newsroomPosts).where(eq(newsroomPosts.slug, slug)).limit(1)
    const post = await populateOne(row, POST_REFS)
    if (!post) return toolError(notFound('Post'))
    return ok(post)
  } catch (e) { return toolError(e) }
})

server.tool('create_post', 'Create a new newsroom post. If slug is omitted it is generated from the title (a numeric suffix is added if taken). An explicit slug that is already taken is refused with a conflict rather than changed. `oxyUserId` sets the editorial author; it defaults to the acting account, which is also what the change is attributed to.', {
  title: z.string().min(1).describe('Post headline'),
  slug: slugInput.optional().describe('URL slug. Generated from the title if omitted. An explicit slug must be unused.'),
  resume: z.string().optional().describe('Short summary for cards/listings (1-2 sentences)'),
  description: z.string().optional().describe('Longer description of the post'),
  content: z.string().optional().describe('Full post body in Markdown'),
  coverImage: z.string().describe('Media document ID for the cover/hero image (required)'),
  imageAlt: z.string().optional().describe('Alt text for the cover image'),
  tags: z.array(z.string()).optional().describe('Tags for categorization, e.g. ["ai", "product-update"]'),
  categories: z.array(z.string()).optional().describe('Post categories. Common: Company, Research, Product, Safety, Engineering, Security'),
  featured: z.boolean().optional().describe('Whether this post appears in the featured/hero section'),
  colorPrimary: z.string().optional().describe('Primary color for post theming (hex or CSS color)'),
  colorSecondary: z.string().optional().describe('Secondary color for post theming (hex or CSS color)'),
  themePreset: z.string().refine(isNewsroomThemePreset, 'Must be a Bloom newsroom recipe').optional(),
  dark: z.boolean().optional().describe('Whether the post uses dark mode styling'),
  status: z.enum(['draft', 'published']).optional().describe('Publication status. Defaults to published.'),
  oxyUserId: z.string().optional().describe('Oxy user ID of the author'),
  metaTitle: z.string().optional().describe('SEO title override. Falls back to post title if not set.'),
  ogImage: z.string().optional().describe('Media document ID for the Open Graph image. Falls back to coverImage if not set.'),
  publishedAt: z.string().optional().describe('Publication date as ISO string (e.g. "2026-03-20"). Defaults to now.'),
}, async (params, context) => {
  try {
    const post = await insertWithSlug({ explicit: params.slug, base: slugBase(params.title, 'post') }, async (slug) => {
      const [row] = await db
        .insert(newsroomPosts)
        .values({
          ...params,
          slug,
          coverImage: params.coverImage || null,
          ogImage: params.ogImage || null,
          themePreset: isNewsroomThemePreset(params.themePreset) ? params.themePreset : newsroomThemeForSlug(slug),
          publishedAt: params.publishedAt ? new Date(params.publishedAt) : new Date(),
          oxyUserId: params.oxyUserId || context.actorId,
        } as never)
        .returning()
      return row
    })
    auditLog(context, 'create_post', { id: post._id, slug: post.slug })
    return ok(await populateOne(post, POST_REFS))
  } catch (e) { return toolError(e) }
})

server.tool('update_post', 'Update an existing newsroom post by slug. Only the fields you provide will be changed; omitted fields remain unchanged.', {
  slug: z.string().describe('Current slug of the post to update'),
  newSlug: z.string().optional().describe('New slug to replace the current one. Must be unique.'),
  title: z.string().optional().describe('Post headline'),
  resume: z.string().optional().describe('Short summary for cards/listings (1-2 sentences)'),
  description: z.string().optional().describe('Longer description of the post'),
  content: z.string().optional().describe('Full post body in Markdown'),
  coverImage: z.string().optional().describe('Media document ID for the cover/hero image'),
  imageAlt: z.string().optional().describe('Alt text for the cover image'),
  tags: z.array(z.string()).optional().describe('Tags for categorization'),
  categories: z.array(z.string()).optional().describe('Post categories'),
  featured: z.boolean().optional().describe('Whether this post appears in the featured/hero section'),
  colorPrimary: z.string().optional().describe('Primary color for post theming (hex or CSS color)'),
  colorSecondary: z.string().optional().describe('Secondary color for post theming (hex or CSS color)'),
  themePreset: z.string().refine(isNewsroomThemePreset, 'Must be a Bloom newsroom recipe').optional(),
  dark: z.boolean().optional().describe('Whether the post uses dark mode styling'),
  status: z.enum(['draft', 'published']).optional().describe('Publication status'),
  oxyUserId: z.string().optional().describe('Oxy user ID of the author'),
  metaTitle: z.string().optional().describe('SEO title override'),
  ogImage: z.string().optional().describe('Media document ID for the Open Graph image'),
  publishedAt: z.string().optional().describe('Publication date as ISO string'),
}, async ({ slug, newSlug, ...updates }) => {
  try {
    const patch: Record<string, unknown> = { ...updates, updatedAt: new Date() }
    if (updates.publishedAt) patch.publishedAt = new Date(updates.publishedAt)
    if (newSlug) patch.slug = newSlug
    // Media fields are ids stored as text; no cast needed.
    const [row] = await db
      .update(newsroomPosts)
      .set(patch as never)
      .where(eq(newsroomPosts.slug, slug))
      .returning()
    const post = await populateOne(row, POST_REFS)
    if (!post) return toolError(notFound('Post'))
    return ok(post)
  } catch (e) { return toolError(e) }
})

server.tool('delete_post', 'Permanently delete a newsroom post by slug. This action cannot be undone.', {
  slug: z.string().describe('The URL slug of the post to delete'),
}, async ({ slug }) => {
  try {
    const [post] = await db.delete(newsroomPosts).where(eq(newsroomPosts.slug, slug)).returning({ id: newsroomPosts._id })
    if (!post) return toolError(notFound('Post'))
    return ok({ deleted: true, slug })
  } catch (e) { return toolError(e) }
})

server.tool('search_posts', 'Search newsroom posts by title or resume text. Returns posts matching the search query.', {
  query: z.string().describe('Search text to match against post titles and resumes'),
  limit: z.number().optional().describe('Maximum results to return (default 10)'),
}, async (params) => {
  try {
    // `ilike` binds the query as a parameter, so the escaping the regex
    // version needed has no equivalent here.
    const pattern = `%${params.query}%`
    const posts = await db
      .select()
      .from(newsroomPosts)
      .where(or(ilike(newsroomPosts.title, pattern), ilike(newsroomPosts.resume, pattern)))
      .orderBy(desc(newsroomPosts.publishedAt), asc(newsroomPosts._id))
      .limit(params.limit ?? 10)
    return ok(posts)
  } catch (e) { return toolError(e) }
})

// ── Pricing ─────────────────────────────────────────────────────────────────

server.tool('get_pricing', 'Get all pricing plans', {}, async () => {
  try {
    const plans = await db.select().from(pricingPlans).orderBy(asc(pricingPlans.order), asc(pricingPlans._id))
    return ok(plans)
  } catch (e) { return toolError(e) }
})

/** A button destination: a site path or an absolute http(s) URL. Empty means no link. */
const ctaHrefInput = z
  .string()
  .max(2048)
  .refine((value) => value === '' || value.startsWith('/') || /^https?:\/\//i.test(value), 'Use a path starting with "/" or an http(s) URL')

const objectIdInput = z.string().regex(/^[0-9a-f]{24}$/i, 'Must be a 24-character hex _id')

const pricingPlanFields = {
  name: z.string().min(1).max(120),
  price: z.object({ monthly: z.number().min(0), annual: z.number().min(0) }),
  description: z.string().max(2000).optional(),
  features: z.array(z.string().max(300)).max(50).optional(),
  cta: z.string().max(80).optional(),
  ctaHref: ctaHrefInput.optional().describe('Where the plan button goes: "/contact/sales" or "https://…"'),
  highlighted: z.boolean().optional(),
  order: z.number().int().optional(),
}

const pricingPlanSchema = z.object({
  _id: objectIdInput.optional().describe('Keep an existing plan\'s _id (as returned by get_pricing) so its translations stay attached. Omit for a new plan.'),
  ...pricingPlanFields,
})

/**
 * Wholesale replacement, for when the list itself changes. Every field the
 * table has is in the schema — a field the contract omitted was silently reset
 * to its default on every replace, which is how plan buttons lost their links.
 */
server.tool('replace_pricing', 'Replace ALL pricing plans with this list, in one transaction. Pass each existing plan back with its _id and every field you want to keep (get_pricing first): a field you omit takes its default. To change one plan, use update_pricing_plan instead. An empty list deletes every plan and requires confirmEmpty: true.', {
  plans: z.array(pricingPlanSchema).max(20),
  confirmEmpty: z.boolean().optional().describe('Required, and must be true, to replace the plans with an empty list'),
}, async ({ plans, confirmEmpty }, context) => {
  try {
    if (plans.length === 0 && confirmEmpty !== true) {
      throw invalid('An empty list would delete every pricing plan; pass confirmEmpty: true if that is intended')
    }
    const ids = plans.map((plan) => plan._id).filter(Boolean)
    if (new Set(ids).size !== ids.length) throw invalid('The same _id appears more than once')
    const result = await db.transaction(async (tx) => {
      await tx.delete(pricingPlans)
      if (plans.length === 0) return []
      return tx.insert(pricingPlans).values(plans as never).returning()
    })
    auditLog(context, 'replace_pricing', { count: result.length })
    return ok({ plans: result })
  } catch (e) { return toolError(e) }
})

server.tool('update_pricing_plan', 'Change fields of one pricing plan by _id. Only the fields you pass change; everything else, including ctaHref, is kept.', {
  id: objectIdInput.describe('The plan _id from get_pricing'),
  name: pricingPlanFields.name.optional(),
  price: pricingPlanFields.price.optional(),
  description: pricingPlanFields.description,
  features: pricingPlanFields.features,
  cta: pricingPlanFields.cta,
  ctaHref: pricingPlanFields.ctaHref,
  highlighted: pricingPlanFields.highlighted,
  order: pricingPlanFields.order,
}, async ({ id, ...patch }, context) => {
  try {
    const set = Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined))
    if (Object.keys(set).length === 0) throw invalid('Pass at least one field to change')
    const [plan] = await db.update(pricingPlans).set({ ...set, updatedAt: new Date() } as never).where(eq(pricingPlans._id, id)).returning()
    if (!plan) throw notFound('Pricing plan')
    auditLog(context, 'update_pricing_plan', { id })
    return ok(plan)
  } catch (e) { return toolError(e) }
})

// ── Testimonials ────────────────────────────────────────────────────────────

server.tool('get_testimonials', 'Get all testimonials', {}, async () => {
  try {
    const rows = await db.select().from(testimonialsTable).orderBy(asc(testimonialsTable.order), asc(testimonialsTable._id))
    return ok(rows)
  } catch (e) { return toolError(e) }
})

const testimonialSchema = z.object({
  _id: objectIdInput.optional().describe('Keep an existing testimonial\'s _id so its translations stay attached'),
  quote: z.string(),
  author: z.string(),
  role: z.string().optional(),
  company: z.string().optional(),
  avatar: z.string().optional(),
  order: z.number().optional(),
})

server.tool('replace_testimonials', 'Replace ALL testimonials with this list, in one transaction. Pass existing ones back with their _id. An empty list deletes every testimonial and requires confirmEmpty: true.', {
  testimonials: z.array(testimonialSchema).max(100),
  confirmEmpty: z.boolean().optional().describe('Required, and must be true, to replace with an empty list'),
}, async ({ testimonials, confirmEmpty }, context) => {
  try {
    if (testimonials.length === 0 && confirmEmpty !== true) {
      throw invalid('An empty list would delete every testimonial; pass confirmEmpty: true if that is intended')
    }
    const result = await db.transaction(async (tx) => {
      await tx.delete(testimonialsTable)
      if (testimonials.length === 0) return []
      return tx.insert(testimonialsTable).values(testimonials as never).returning()
    })
    auditLog(context, 'replace_testimonials', { count: result.length })
    return ok({ testimonials: result })
  } catch (e) { return toolError(e) }
})

// ── Changelog ───────────────────────────────────────────────────────────────

server.tool('list_changelog', 'List changelog entries with optional repo filter, search, and pagination. Returns entries sorted by date descending.', {
  repo: z.string().optional().describe('Filter by repo, e.g. "owner/name" or just "name"'),
  search: z.string().optional().describe('Search entries by title or content text'),
  limit: z.number().optional().describe('Results per page (default 20)'),
  page: z.number().optional().describe('Page number (default 1)'),
}, async (params) => {
  try {
    const page = params.page ?? 1
    const limit = params.limit ?? 20
    const filters: SQL[] = []
    if (params.repo) {
      const parts = params.repo.split('/')
      if (parts.length === 2) {
        filters.push(eq(changelogEntries.repoOwner, parts[0]))
        filters.push(eq(changelogEntries.repoName, parts[1]))
      } else {
        filters.push(eq(changelogEntries.repoName, params.repo))
      }
    }
    if (params.search) {
      const pattern = `%${params.search}%`
      const searchFilter = or(ilike(changelogEntries.title, pattern), ilike(changelogEntries.content, pattern))
      if (searchFilter) filters.push(searchFilter)
    }
    const where = filters.length > 0 ? and(...filters) : undefined
    const [entries, [totals]] = await Promise.all([
      db.select().from(changelogEntries).where(where).orderBy(desc(changelogEntries.date), asc(changelogEntries._id)).offset((page - 1) * limit).limit(limit),
      db.select({ value: count() }).from(changelogEntries).where(where),
    ])
    const total = Number(totals?.value ?? 0)
    return ok({ entries, total, page, pages: Math.ceil(total / limit) })
  } catch (e) { return toolError(e) }
})

server.tool('create_changelog_entry', 'Create a new manual changelog entry.', {
  title: z.string().describe('Entry title/headline'),
  content: z.string().optional().describe('Full entry body in Markdown'),
  tags: z.array(z.string()).optional().describe('Tags like ["Feature", "Enhancement", "Fix", "Design"]'),
  date: z.string().describe('Entry date as ISO string, e.g. "2026-03-20"'),
  items: z.array(z.string()).optional().describe('Bullet-point items for the entry'),
  media: z.string().optional().describe('Media document ID for an image or video to display with the entry'),
}, async (params) => {
  try {
    const entry = await insertOne(changelogEntries, { ...params, date: new Date(params.date) })
    return ok(entry)
  } catch (e) { return toolError(e) }
})

server.tool('update_changelog_entry', 'Update a changelog entry by ID. Only provided fields are changed.', {
  id: z.string().describe('The _id of the changelog entry'),
  title: z.string().optional().describe('Entry title'),
  content: z.string().optional().describe('Entry body in Markdown'),
  tags: z.array(z.string()).optional().describe('Tags for the entry'),
  date: z.string().optional().describe('Entry date as ISO string'),
  items: z.array(z.string()).optional().describe('Bullet-point items'),
  media: z.string().optional().describe('Media document ID for an image or video'),
}, async ({ id, ...updates }) => {
  try {
    const patch: Record<string, unknown> = { ...updates }
    if (updates.date) patch.date = new Date(updates.date)
    const entry = (await db.update(changelogEntries).set({ ...patch, updatedAt: new Date() } as never).where(eq(changelogEntries._id, id)).returning())[0]
    if (!entry) return toolError(notFound('Changelog entry'))
    return ok(entry)
  } catch (e) { return toolError(e) }
})

server.tool('delete_changelog_entry', 'Permanently delete a changelog entry by ID.', {
  id: z.string().describe('The _id of the changelog entry to delete'),
}, async ({ id }) => {
  try {
    const entry = (await db.delete(changelogEntries).where(eq(changelogEntries._id, id)).returning({ id: changelogEntries._id }))[0]
    if (!entry) return toolError(notFound('Changelog entry'))
    return ok({ deleted: true, id })
  } catch (e) { return toolError(e) }
})

// ── Tracked Repos (GitHub Sync) ─────────────────────────────────────────────

server.tool('list_tracked_repos', 'List GitHub repos tracked for automatic changelog sync. Shows sync status and configuration.', {}, async () => {
  try {
    const repos = await db.select().from(trackedRepos).orderBy(asc(trackedRepos.displayName), asc(trackedRepos._id))
    return ok(repos)
  } catch (e) { return toolError(e) }
})

server.tool('add_tracked_repo', 'Add a GitHub repo to track. New releases will be automatically synced as changelog entries, and the repo can additionally be put on the public feature board.', {
  owner: z.string().describe('GitHub repo owner, e.g. "OxyHQ"'),
  repo: z.string().describe('GitHub repo name, e.g. "Oxy"'),
  displayName: z.string().optional().describe('Display name shown in the changelog and as the app name on the feature board. Defaults to "owner/repo".'),
  defaultTags: z.array(z.object({ label: z.string(), color: z.string() })).optional().describe('Default tags applied to synced entries'),
  active: z.boolean().optional().describe('Whether changelog release sync is active. Defaults to true.'),
  featureBoard: z.boolean().optional().describe('List this repo\'s feature-request issues on the public feature board. Defaults to false.'),
  acceptsProposals: z.boolean().optional().describe('Let signed-in visitors open a feature-request issue here from the website. Requires featureBoard. Defaults to false.'),
}, async (params) => {
  try {
    const tracked = await insertOne(trackedRepos, {
      ...params,
      displayName: params.displayName || `${params.owner}/${params.repo}`,
      defaultTags: params.defaultTags || [],
      active: params.active !== false,
      featureBoard: params.featureBoard === true,
      acceptsProposals: params.acceptsProposals === true,
    })
    return ok(tracked)
  } catch (e) { return toolError(e) }
})

server.tool('update_tracked_repo', 'Update a tracked GitHub repo: its display name, its changelog sync switch, and whether it appears on the feature board or accepts proposals from the website.', {
  id: z.string().describe('The _id of the tracked repo'),
  displayName: z.string().optional(),
  active: z.boolean().optional().describe('Whether changelog release sync is active'),
  featureBoard: z.boolean().optional().describe('List this repo on the public feature board'),
  acceptsProposals: z.boolean().optional().describe('Accept feature proposals submitted from the website'),
}, async ({ id, ...fields }) => {
  try {
    const update: Record<string, unknown> = {}
    if (fields.displayName !== undefined) update.displayName = fields.displayName
    if (fields.active !== undefined) update.active = fields.active
    if (fields.featureBoard !== undefined) update.featureBoard = fields.featureBoard
    if (fields.acceptsProposals !== undefined) update.acceptsProposals = fields.acceptsProposals
    if (update.featureBoard === false) update.acceptsProposals = false

    const tracked = (await db.update(trackedRepos).set({ ...update, updatedAt: new Date() } as never).where(eq(trackedRepos._id, id)).returning())[0]
    if (!tracked) return toolError(notFound('Tracked repo'))
    return ok(tracked)
  } catch (e) { return toolError(e) }
})

server.tool('remove_tracked_repo', 'Remove a tracked GitHub repo. Does not delete existing changelog entries from that repo.', {
  id: z.string().describe('The _id of the tracked repo to remove'),
}, async ({ id }) => {
  try {
    const tracked = (await db.delete(trackedRepos).where(eq(trackedRepos._id, id)).returning({ id: trackedRepos._id }))[0]
    if (!tracked) return toolError(notFound('Tracked repo'))
    return ok({ deleted: true, id })
  } catch (e) { return toolError(e) }
})

server.tool('sync_repo', 'Manually trigger a sync for a single tracked repo. Fetches new GitHub releases and creates changelog entries.', {
  id: z.string().describe('The _id of the tracked repo to sync'),
}, async ({ id }) => {
  try {
    const count = await syncSingleRepo(id)
    return ok({ synced: count })
  } catch (e) { return toolError(e) }
})

server.tool('sync_all_repos', 'Manually trigger a sync for all active tracked repos.', {}, async () => {
  try {
    await syncAllRepos()
    return ok({ ok: true, message: 'Sync complete' })
  } catch (e) { return toolError(e) }
})

// ── Jobs ────────────────────────────────────────────────────────────────────

const descriptionBlockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('paragraph'), text: z.string() }),
  z.object({ type: z.literal('heading'), text: z.string() }),
  z.object({ type: z.literal('list'), items: z.array(z.string()) }),
])

server.tool('list_jobs', 'List job listings on the careers page. By default returns only active jobs.', {
  active: z.boolean().optional().describe('Filter by active status. Defaults to true (only active). Set false to include inactive.'),
}, async (params) => {
  try {
    const where = params.active !== false ? eq(jobs.active, true) : undefined
    const rows = await db.select().from(jobs).where(where).orderBy(asc(jobs.order), asc(jobs.department), asc(jobs._id))
    return ok(rows)
  } catch (e) { return toolError(e) }
})

server.tool('get_job', 'Get a single job listing by its URL slug.', {
  slug: z.string().describe('The URL slug of the job listing'),
}, async ({ slug }) => {
  try {
    const job = (await db.select().from(jobs).where(eq(jobs.slug, slug)).limit(1))[0]
    if (!job) return toolError(notFound('Job'))
    return ok(job)
  } catch (e) { return toolError(e) }
})

server.tool('create_job', 'Create a new job listing. If slug is omitted it is generated from title + location (a numeric suffix is added if taken); an explicit slug that is already taken is refused.', {
  title: z.string().min(1).describe('Job title, e.g. "Senior Frontend Engineer"'),
  department: z.string().min(1).describe('Department, e.g. "Engineering", "Design", "Sales"'),
  slug: slugInput.optional().describe('URL slug. Generated from title + location if omitted.'),
  subtitle: z.string().optional().describe('Short tagline for the role'),
  location: z.string().optional().describe('Job location, e.g. "Remote", "New York", "London"'),
  type: z.string().optional().describe('Employment type, e.g. "Full-time", "Part-time", "Contract"'),
  compensation: z.string().optional().describe('Compensation range, e.g. "$80K – $120K · Offers Equity"'),
  validThrough: z.string().optional().describe('Actual application deadline as an ISO date. Omit for evergreen roles.'),
  address: z.object({
    streetAddress: z.string().optional(),
    addressLocality: z.string().optional(),
    addressRegion: z.string().optional(),
    postalCode: z.string().optional(),
    addressCountry: z.string().length(2).optional(),
  }).optional().describe('Physical job address fields for JobPosting metadata'),
  description: z.array(descriptionBlockSchema).optional().describe('Job description as content blocks (paragraph, heading, or list)'),
  active: z.boolean().optional().describe('Whether the job is visible on the careers page. Defaults to true.'),
  order: z.number().optional().describe('Display order (lower = first). Defaults to 0.'),
}, async (params, context) => {
  try {
    const base = slugBase([params.title, params.location].filter(Boolean).join(' '), 'job')
    const job = await insertWithSlug({ explicit: params.slug, base }, (slug) => insertOne(jobs, { ...params, slug }))
    auditLog(context, 'create_job', { id: job._id, slug: job.slug })
    return ok(job)
  } catch (e) { return toolError(e) }
})

server.tool('update_job', 'Update an existing job listing by slug. Only provided fields are changed.', {
  slug: z.string().describe('Current slug of the job to update'),
  title: z.string().optional().describe('Job title'),
  department: z.string().optional().describe('Department'),
  subtitle: z.string().optional().describe('Short tagline for the role'),
  location: z.string().optional().describe('Job location'),
  type: z.string().optional().describe('Employment type'),
  compensation: z.string().optional().describe('Compensation range'),
  validThrough: z.string().optional().describe('Actual application deadline as an ISO date'),
  address: z.object({
    streetAddress: z.string().optional(),
    addressLocality: z.string().optional(),
    addressRegion: z.string().optional(),
    postalCode: z.string().optional(),
    addressCountry: z.string().length(2).optional(),
  }).optional().describe('Physical job address fields'),
  description: z.array(descriptionBlockSchema).optional().describe('Job description as content blocks'),
  active: z.boolean().optional().describe('Whether the job is visible'),
  order: z.number().optional().describe('Display order'),
}, async ({ slug, ...updates }) => {
  try {
    const job = (await db.update(jobs).set({ ...updates, updatedAt: new Date() } as never).where(eq(jobs.slug, slug)).returning())[0]
    if (!job) return toolError(notFound('Job'))
    return ok(job)
  } catch (e) { return toolError(e) }
})

server.tool('delete_job', 'Permanently delete a job listing by slug.', {
  slug: z.string().describe('The URL slug of the job to delete'),
}, async ({ slug }) => {
  try {
    const job = (await db.delete(jobs).where(eq(jobs.slug, slug)).returning({ id: jobs._id }))[0]
    if (!job) return toolError(notFound('Job'))
    return ok({ deleted: true, slug })
  } catch (e) { return toolError(e) }
})

// ── Team Members ────────────────────────────────────────────────────────────

server.tool('list_team_members', 'List team members. Returns active members by default.', {
  active: z.boolean().optional().describe('Filter by active status. Defaults to true.'),
}, async (params) => {
  try {
    const where = params.active !== false ? eq(teamMembers.active, true) : undefined
    const rows = await db.select().from(teamMembers).where(where).orderBy(asc(teamMembers.order), asc(teamMembers.name), asc(teamMembers._id))
    const members = await populate(rows, { avatar: media })
    return ok(members)
  } catch (e) { return toolError(e) }
})

server.tool('get_team_member', 'Get a team member by slug.', {
  slug: z.string().describe('The URL slug of the team member'),
}, async ({ slug }) => {
  try {
    const [row] = await db.select().from(teamMembers).where(eq(teamMembers.slug, slug)).limit(1)
    const member = await populateOne(row, { avatar: media })
    if (!member) return toolError(notFound('Team member'))
    return ok(member)
  } catch (e) { return toolError(e) }
})

server.tool('create_team_member', 'Create a new team member. If slug is omitted it is generated from the name (a numeric suffix is added if taken); an explicit slug that is already taken is refused.', {
  name: z.string().min(1).describe('Full name'),
  slug: slugInput.optional().describe('URL slug. Generated from the name if omitted.'),
  role: z.string().describe('Job title/role'),
  department: z.string().optional().describe('Department, e.g. "Engineering", "Design"'),
  bio: z.string().optional().describe('Short biography'),
  avatar: z.string().optional().describe('Media document ID for the avatar image'),
  order: z.number().optional().describe('Display order (lower = first)'),
  active: z.boolean().optional().describe('Whether this member is shown. Defaults to true.'),
  socials: z.object({
    linkedin: z.string().optional(),
    twitter: z.string().optional(),
    github: z.string().optional(),
    website: z.string().optional(),
  }).optional().describe('Social media links'),
}, async (params, context) => {
  try {
    const member = await insertWithSlug({ explicit: params.slug, base: slugBase(params.name, 'member') }, (slug) => insertOne(teamMembers, { ...params, slug }))
    auditLog(context, 'create_team_member', { id: member._id, slug: member.slug })
    return ok(member)
  } catch (e) { return toolError(e) }
})

server.tool('update_team_member', 'Update a team member by slug.', {
  slug: z.string().describe('Current slug of the member to update'),
  name: z.string().optional(),
  role: z.string().optional(),
  department: z.string().optional(),
  bio: z.string().optional(),
  avatar: z.string().optional().describe('Media document ID'),
  order: z.number().optional(),
  active: z.boolean().optional(),
  socials: z.object({
    linkedin: z.string().optional(),
    twitter: z.string().optional(),
    github: z.string().optional(),
    website: z.string().optional(),
  }).optional(),
}, async ({ slug, ...updates }) => {
  try {
    const member = (await db.update(teamMembers).set({ ...updates, updatedAt: new Date() } as never).where(eq(teamMembers.slug, slug)).returning())[0]
    if (!member) return toolError(notFound('Team member'))
    return ok(member)
  } catch (e) { return toolError(e) }
})

server.tool('delete_team_member', 'Delete a team member by slug.', {
  slug: z.string().describe('The slug of the team member to delete'),
}, async ({ slug }) => {
  try {
    const member = (await db.delete(teamMembers).where(eq(teamMembers.slug, slug)).returning({ id: teamMembers._id }))[0]
    if (!member) return toolError(notFound('Team member'))
    return ok({ deleted: true, slug })
  } catch (e) { return toolError(e) }
})

// ── Media ───────────────────────────────────────────────────────────────────

server.tool('list_media', 'List media files with optional search and type filter. Returns paginated results.', {
  search: z.string().optional().describe('Search by filename or alt text'),
  type: z.enum(['image', 'video', 'document']).optional().describe('Filter by MIME type category'),
  tag: z.string().optional().describe('Filter by tag'),
  folder: z.string().optional().describe('Filter by folder'),
  limit: z.number().optional().describe('Results per page (default 20)'),
  page: z.number().optional().describe('Page number (default 1)'),
}, async (params) => {
  try {
    const filters: SQL[] = []
    // Substring match on filename and alt text, the two fields the old `$text`
    // index covered.
    if (params.search) {
      const pattern = `%${params.search}%`
      const searchFilter = or(ilike(media.filename, pattern), ilike(media.alt, pattern))
      if (searchFilter) filters.push(searchFilter)
    }
    if (params.type === 'image') filters.push(like(media.mimeType, 'image/%'))
    else if (params.type === 'video') filters.push(like(media.mimeType, 'video/%'))
    else if (params.type === 'document') {
      filters.push(not(like(media.mimeType, 'image/%')))
      filters.push(not(like(media.mimeType, 'video/%')))
    }
    if (params.tag) filters.push(sql`${media.tags} @> ARRAY[${params.tag}]::text[]`)
    if (params.folder) filters.push(eq(media.folder, params.folder))
    const where = filters.length > 0 ? and(...filters) : undefined

    const limit = params.limit ?? 20
    const page = params.page ?? 1
    const [items, [totals]] = await Promise.all([
      db.select().from(media).where(where).orderBy(desc(media.createdAt), asc(media._id)).offset((page - 1) * limit).limit(limit),
      db.select({ value: count() }).from(media).where(where),
    ])
    const total = Number(totals?.value ?? 0)
    return ok({ items, total, page, pages: Math.ceil(total / limit) })
  } catch (e) { return toolError(e) }
})

server.tool('get_media', 'Get a single media item by ID.', {
  id: z.string().describe('The _id of the media item'),
}, async ({ id }) => {
  try {
    const [row] = await db.select().from(media).where(eq(media._id, id)).limit(1)
    if (!row) return toolError(notFound('Media'))
    return ok(row)
  } catch (e) { return toolError(e) }
})

server.tool('update_media', 'Update media metadata (alt text, tags, folder).', {
  id: z.string().describe('The _id of the media item'),
  alt: z.string().optional().describe('Alt text for the image'),
  tags: z.array(z.string()).optional().describe('Tags for organization'),
  folder: z.string().optional().describe('Logical folder name'),
}, async ({ id, ...updates }) => {
  try {
    const [row] = await db.update(media).set({ ...updates, updatedAt: new Date() } as never).where(eq(media._id, id)).returning()
    if (!row) return toolError(notFound('Media'))
    return ok(row)
  } catch (e) { return toolError(e) }
})

server.tool('delete_media', 'Delete a media item and the stored objects only it owns. A media item still referenced (a post cover, a product logo, the hero…) is refused with the list of references unless force is true, which clears those references. A storage delete that fails is queued and retried; the result says whether storage cleanup is complete or pending. An object another media item shares is kept.', {
  id: objectIdInput.describe('The _id of the media item to delete'),
  force: z.boolean().optional().describe('Delete even if referenced, clearing the references'),
}, async ({ id, force }, context) => {
  try {
    const result = await deleteMedia(id, { force: force === true })
    auditLog(context, 'delete_media', { id, force: force === true, storage: result.storage.status })
    return ok(result)
  } catch (e) { return toolError(e) }
})

// ── Settings ────────────────────────────────────────────────────────────────

server.tool('get_settings', 'Get site settings', {}, async () => {
  try {
    const [settings] = await db.select().from(siteSettings).limit(1)
    return ok(settings ?? { siteTitle: 'Oxy', siteDescription: '', ogImage: '', banner: null })
  } catch (e) { return toolError(e) }
})

server.tool('update_settings', 'Update site settings', {
  siteTitle: z.string().optional(),
  siteDescription: z.string().optional(),
  ogImage: z.string().optional(),
  banner: z.object({
    text: z.string(),
    href: z.string().optional(),
    visible: z.boolean().optional(),
  }).optional(),
}, async (params) => {
  try {
    const settings = await upsertSingleton(siteSettings, params)
    return ok(settings)
  } catch (e) { return toolError(e) }
})

// ── Locales ─────────────────────────────────────────────────────────────────

server.tool('list_locales', 'List all locales (both enabled and disabled). Locales control which languages the site supports.', {}, async () => {
  try {
    const rows = await db.select().from(locales).orderBy(asc(locales.order), asc(locales._id))
    return ok(rows)
  } catch (e) { return toolError(e) }
})

server.tool('create_locale', 'Create a new locale for the site. Translations can then be added for this locale. Setting isDefault moves the default here atomically; if the create fails, the previous default is untouched.', {
  code: z.string().min(2).max(35).regex(/^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/, 'A BCP-47 code such as "es" or "pt-BR"').describe('BCP-47 language code, e.g. "es", "pt-BR"'),
  slug: slugInput.optional().describe('URL slug for this locale. Defaults to the code in lower case (e.g. "pt-br").'),
  name: z.string().min(1).max(80).describe('English name of the language, e.g. "Spanish"'),
  nativeName: z.string().min(1).max(80).optional().describe('Name in the native language, e.g. "Español". Defaults to name.'),
  isDefault: z.boolean().optional().describe('Make this the default locale. Exactly one enabled locale is always the default.'),
  enabled: z.boolean().optional().describe('Whether this locale is active on the site. Defaults to true.'),
  order: z.number().int().optional().describe('Display order in locale switcher (lower = first)'),
}, async (params, context) => {
  try {
    const locale = await createLocale(params)
    auditLog(context, 'create_locale', { code: locale.code, isDefault: locale.isDefault })
    return ok(locale)
  } catch (e) { return toolError(e) }
})

server.tool('update_locale', 'Update a locale by its code. Only provided fields are changed. Setting isDefault: true moves the default here atomically; the current default cannot be unset or disabled directly — make another locale the default instead.', {
  code: z.string().min(1).describe('The locale code to update, e.g. "es"'),
  slug: slugInput.optional().describe('URL slug for this locale'),
  name: z.string().min(1).max(80).optional().describe('English name'),
  nativeName: z.string().min(1).max(80).optional().describe('Native name'),
  isDefault: z.boolean().optional().describe('Set as default locale'),
  enabled: z.boolean().optional().describe('Enable or disable this locale'),
  order: z.number().int().optional().describe('Display order'),
}, async ({ code, ...updates }, context) => {
  try {
    const locale = await updateLocale(code, updates)
    auditLog(context, 'update_locale', { code, isDefault: locale.isDefault })
    return ok(locale)
  } catch (e) { return toolError(e) }
})

server.tool('delete_locale', 'Delete a locale and all its translations, in one transaction. The default locale cannot be deleted.', {
  code: z.string().min(1).describe('The locale code to delete, e.g. "es"'),
}, async ({ code }, context) => {
  try {
    const result = await deleteLocale(code)
    auditLog(context, 'delete_locale', result)
    return ok({ deleted: true, ...result })
  } catch (e) { return toolError(e) }
})

// ── Translations ────────────────────────────────────────────────────────────

server.tool('list_translation_collections', 'List all collections that support translations.', {}, async () => {
  return ok(TRANSLATABLE_COLLECTIONS)
})

server.tool('get_translations', 'Get all translations for a collection in a specific locale. Returns an array of translated documents.', {
  collection: z.enum(TRANSLATABLE_COLLECTIONS).describe('Collection to query'),
  locale: z.string().describe('Locale code, e.g. "es", "fr", "ja"'),
}, async ({ collection, locale }) => {
  try {
    const rows = await db
      .select()
      .from(translations)
      .where(and(eq(translations.collectionName, collection), eq(translations.locale, locale)))
    return ok(rows)
  } catch (e) { return toolError(e) }
})

server.tool('get_translation', 'Get the translation for a specific document in a collection.', {
  collection: z.enum(TRANSLATABLE_COLLECTIONS).describe('Collection name'),
  documentId: z.string().describe('The _id of the original document being translated'),
  locale: z.string().describe('Locale code, e.g. "es"'),
}, async ({ collection, documentId, locale }) => {
  try {
    const [translation] = await db
      .select()
      .from(translations)
      .where(
        and(
          eq(translations.collectionName, collection),
          eq(translations.documentId, documentId),
          eq(translations.locale, locale),
        ),
      )
      .limit(1)
    if (!translation) return toolError(notFound('Translation'))
    return ok(translation)
  } catch (e) { return toolError(e) }
})

server.tool('upsert_translation', 'Create or update a translation. The fields object contains key-value overrides that replace the original document fields for the given locale.', {
  collection: z.enum(TRANSLATABLE_COLLECTIONS).describe('Collection name'),
  documentId: z.string().describe('The _id of the original document being translated'),
  locale: z.string().describe('Locale code, e.g. "es"'),
  fields: z.record(z.string(), z.any()).describe('Key-value field overrides. e.g. { "title": "Hola", "excerpt": "Resumen..." }. Only include fields that differ from the original.'),
}, async ({ collection, documentId, locale, fields }) => {
  try {
    const [translation] = await db
      .insert(translations)
      .values({ collectionName: collection, documentId, locale, fields })
      .onConflictDoUpdate({
        target: [translations.locale, translations.collectionName, translations.documentId],
        set: { fields, updatedAt: new Date() },
      })
      .returning()
    return ok(translation)
  } catch (e) { return toolError(e) }
})

server.tool('delete_translation', 'Delete a translation for a specific document and locale.', {
  collection: z.enum(TRANSLATABLE_COLLECTIONS).describe('Collection name'),
  documentId: z.string().describe('The _id of the document'),
  locale: z.string().describe('Locale code'),
}, async ({ collection, documentId, locale }) => {
  try {
    const [translation] = await db
      .delete(translations)
      .where(
        and(
          eq(translations.collectionName, collection),
          eq(translations.documentId, documentId),
          eq(translations.locale, locale),
        ),
      )
      .returning({ id: translations._id })
    if (!translation) return toolError(notFound('Translation'))
    return ok({ deleted: true })
  } catch (e) { return toolError(e) }
})

// ── Upload ──────────────────────────────────────────────────────────────────

/** Most items one bulk call processes; larger batches are split by the caller and resumed. */
const MAX_BULK_ITEMS = 20
/** Wall-clock budget for one bulk call; items not started in time come back as `skipped`. */
const BULK_TIME_BUDGET_MS = 4 * 60 * 1000

server.tool('upload_image', 'Download an image from a URL and add it to the media library. The bytes must be a JPEG, PNG, GIF, WebP or AVIF (checked from the file itself, not the declared type; SVG is refused), at most 25 MiB and 40 megapixels. Identical bytes already in the same folder under the same name are reused instead of uploaded again (`reused: true`). `warnings` reports thumbnails that could not be generated.', {
  url: sourceUrlInput.describe('Source URL of the image to download'),
  filename: z.string().max(120).optional().describe('Desired filename; the extension is set from the detected type. Derived from the URL if omitted.'),
  folder: folderInput.optional().describe('Folder within the library, e.g. "newsroom". Defaults to "images".'),
  alt: z.string().max(500).optional().describe('Alt text for the image'),
  tags: z.array(z.string().max(60)).max(20).optional().describe('Tags for organization'),
}, async (params, context) => {
  try {
    const { buffer } = await downloadRemote(params.url, { signal: context.signal })
    const result = await ingestImage({
      buffer,
      filename: params.filename ?? filenameFromUrl(params.url),
      folder: params.folder ?? 'images',
      alt: params.alt,
      tags: params.tags,
      uploadedBy: context.actorId,
    })
    auditLog(context, 'upload_image', { mediaId: result.media._id, reused: result.reused })
    return ok({ ...mediaSummary(result.media), reused: result.reused, warnings: result.warnings })
  } catch (e) { return toolError(e) }
})

server.tool('upload_and_set_post_cover', 'Download an image, add it to the media library and set it as a newsroom post\'s coverImage, in one step. The post is checked before anything is downloaded; the media row and the post update commit together, and if the post disappears meanwhile nothing is left behind.', {
  postSlug: z.string().min(1).describe('Slug of the post to update'),
  imageUrl: sourceUrlInput.describe('Source URL of the image to download'),
  filename: z.string().max(120).optional().describe('Desired filename. Derived from the URL if omitted.'),
  alt: z.string().max(500).optional().describe('Alt text for the image'),
}, async (params, context) => {
  try {
    const [target] = await db.select({ id: newsroomPosts._id }).from(newsroomPosts).where(eq(newsroomPosts.slug, params.postSlug)).limit(1)
    if (!target) throw notFound('Post', { slug: params.postSlug })

    const { buffer } = await downloadRemote(params.imageUrl, { signal: context.signal })
    const result = await ingestImage(
      { buffer, filename: params.filename ?? filenameFromUrl(params.imageUrl) ?? 'cover', folder: 'newsroom', alt: params.alt, tags: ['newsroom'], uploadedBy: context.actorId },
      async (tx, mediaRow) => {
        const [row] = await tx
          .update(newsroomPosts)
          .set({ coverImage: mediaRow._id, imageAlt: params.alt || '', updatedAt: new Date() })
          .where(eq(newsroomPosts._id, target.id))
          .returning()
        if (!row) throw notFound('Post', { slug: params.postSlug })
        return row
      },
    )
    auditLog(context, 'upload_and_set_post_cover', { postId: target.id, mediaId: result.media._id, reused: result.reused })
    const post = await populateOne(result.attached, POST_REFS)
    return ok({ media: result.media, post, reused: result.reused, warnings: result.warnings })
  } catch (e) { return toolError(e) }
})

server.tool('upload_and_set_team_avatar', 'Download an image, add it to the media library and set it as a team member\'s avatar, in one step. The member is checked before anything is downloaded; the media row and the member update commit together.', {
  memberSlug: z.string().min(1).describe('Slug of the team member to update'),
  imageUrl: sourceUrlInput.describe('Source URL of the image to download'),
  filename: z.string().max(120).optional(),
  alt: z.string().max(500).optional(),
}, async (params, context) => {
  try {
    const [target] = await db.select({ id: teamMembers._id }).from(teamMembers).where(eq(teamMembers.slug, params.memberSlug)).limit(1)
    if (!target) throw notFound('Team member', { slug: params.memberSlug })

    const { buffer } = await downloadRemote(params.imageUrl, { signal: context.signal })
    const result = await ingestImage(
      { buffer, filename: params.filename ?? filenameFromUrl(params.imageUrl) ?? 'avatar', folder: 'team', alt: params.alt, tags: ['team'], uploadedBy: context.actorId },
      async (tx, mediaRow) => {
        const [row] = await tx
          .update(teamMembers)
          .set({ avatar: mediaRow._id, updatedAt: new Date() })
          .where(eq(teamMembers._id, target.id))
          .returning()
        if (!row) throw notFound('Team member', { slug: params.memberSlug })
        return row
      },
    )
    auditLog(context, 'upload_and_set_team_avatar', { memberId: target.id, mediaId: result.media._id, reused: result.reused })
    const member = await populateOne(result.attached, { avatar: media })
    return ok({ media: result.media, member, reused: result.reused, warnings: result.warnings })
  } catch (e) { return toolError(e) }
})

type BulkItemStatus = 'ok' | 'unchanged' | 'error' | 'skipped'

interface BulkItemResult {
  slug: string
  status: BulkItemStatus
  mediaId?: string
  reused?: boolean
  warnings?: string[]
  error?: { code: string; message: string }
}

server.tool('bulk_upload_post_covers', `Set cover images for up to ${MAX_BULK_ITEMS} newsroom posts in one call, one post at a time. Every item gets its own status: "ok" (cover set), "unchanged" (the post already had exactly this image), "error" (with a code and message) or "skipped" (not started: the call ran out of time or was cancelled). Re-running the same list is safe: finished items come back "unchanged" and are not uploaded again.`, {
  posts: z.array(z.object({
    slug: z.string().min(1).describe('Post slug'),
    imageUrl: sourceUrlInput.describe('Source URL of the cover image'),
    alt: z.string().max(500).optional().describe('Alt text'),
  })).min(1).max(MAX_BULK_ITEMS).describe('Posts with their cover image URLs'),
}, async ({ posts }, context) => {
  try {
    const slugs = posts.map((p) => p.slug)
    if (new Set(slugs).size !== slugs.length) throw invalid('Each post slug may appear only once')

    const found = await db
      .select({ id: newsroomPosts._id, slug: newsroomPosts.slug, coverImage: newsroomPosts.coverImage })
      .from(newsroomPosts)
      .where(or(...slugs.map((slug) => eq(newsroomPosts.slug, slug))))
    const bySlug = new Map(found.map((row) => [row.slug, row]))
    const startedAt = Date.now()

    const results: BulkItemResult[] = []
    for (const item of posts) {
      if (context.signal?.aborted || Date.now() - startedAt > BULK_TIME_BUDGET_MS) {
        results.push({ slug: item.slug, status: 'skipped' })
        continue
      }
      const target = bySlug.get(item.slug)
      if (!target) {
        results.push({ slug: item.slug, status: 'error', error: { code: 'not_found', message: 'Post not found' } })
        continue
      }
      try {
        const { buffer } = await downloadRemote(item.imageUrl, { signal: context.signal })
        const result = await ingestImage(
          { buffer, filename: filenameFromUrl(item.imageUrl) ?? 'cover', folder: 'newsroom', alt: item.alt, tags: ['newsroom'], uploadedBy: context.actorId },
          async (tx, mediaRow) => {
            const [row] = await tx
              .update(newsroomPosts)
              .set({ coverImage: mediaRow._id, imageAlt: item.alt || '', updatedAt: new Date() })
              .where(eq(newsroomPosts._id, target.id))
              .returning({ id: newsroomPosts._id })
            if (!row) throw notFound('Post', { slug: item.slug })
            return row
          },
        )
        const unchanged = result.reused && target.coverImage === result.media._id
        results.push({ slug: item.slug, status: unchanged ? 'unchanged' : 'ok', mediaId: result.media._id, reused: result.reused, warnings: result.warnings })
      } catch (e) {
        const { error } = toolError(e).structuredContent as { error: { code: string; message: string } }
        results.push({ slug: item.slug, status: 'error', error: { code: error.code, message: error.message } })
      }
    }

    const summary = Object.fromEntries((['ok', 'unchanged', 'error', 'skipped'] as const).map((status) => [status, results.filter((r) => r.status === status).length]))
    auditLog(context, 'bulk_upload_post_covers', summary)
    const complete = summary.error === 0 && summary.skipped === 0
    return ok({ complete, summary, results })
  } catch (e) { return toolError(e) }
})

server.tool('get_post_with_media', 'Get a newsroom post with its cover image and OG image fully resolved to URLs.', {
  slug: z.string().describe('Post slug'),
}, async ({ slug }) => {
  try {
    const [row] = await db.select().from(newsroomPosts).where(eq(newsroomPosts.slug, slug)).limit(1)
    const post = await populateOne(row, POST_REFS)
    if (!post) return toolError(notFound('Post'))
    return ok(post)
  } catch (e) { return toolError(e) }
})

// ── Categories ────────────────────────────────────────────────────────────

const categoryRawShape = {
  slug: z.string().describe('URL-safe stable id (e.g. "social-communication"). Lower-case, dashes only.'),
  label: z.string().describe('Human label shown on /technologies, /status, navbar, etc.'),
  description: z.string().optional().describe('Optional long description'),
  scope: z.enum(['apps', 'nav', 'generic']).optional().describe('Where this category is allowed to be used. "apps" for product/status grouping, "nav" for navbar dropdown headings, "generic" for shared use.'),
  order: z.number().optional().describe('Sort order within the scope. Lower comes first.'),
}

server.tool('list_categories', 'List all categories. Optionally filter by scope.', {
  scope: z.enum(['apps', 'nav', 'generic']).optional().describe('Filter to one scope'),
}, async ({ scope }) => {
  try {
    const rows = await db
      .select()
      .from(categories)
      .where(scope ? eq(categories.scope, scope) : undefined)
      .orderBy(asc(categories.order), asc(categories.label), asc(categories._id))
    return ok(rows)
  } catch (e) { return toolError(e) }
})

server.tool('get_category', 'Get a single category by slug.', {
  slug: z.string().describe('Category slug'),
}, async ({ slug }) => {
  try {
    const doc = (await db.select().from(categories).where(eq(categories.slug, slug)).limit(1))[0]
    if (!doc) return toolError(notFound('Category'))
    return ok(doc)
  } catch (e) { return toolError(e) }
})

server.tool('create_category', 'Create a new category. Categories are reusable grouping labels referenced by products, navbar dropdowns, etc.', categoryRawShape, async (input) => {
  try {
    const [existing] = await db.select({ id: categories._id }).from(categories).where(eq(categories.slug, input.slug)).limit(1)
    if (existing) return toolError(conflict(`Category "${input.slug}" already exists`))
    const doc = await insertOne(categories, input)
    return ok(doc)
  } catch (e) { return toolError(e) }
})

server.tool('update_category', 'Update an existing category. Only the fields you provide are changed. The slug cannot be changed after creation.', {
  slug: z.string().describe('Slug of the category to update'),
  label: z.string().optional(),
  description: z.string().optional(),
  scope: z.enum(['apps', 'nav', 'generic']).optional(),
  order: z.number().optional(),
}, async ({ slug, ...patch }) => {
  try {
    const doc = (await db.update(categories).set({ ...patch, updatedAt: new Date() } as never).where(eq(categories.slug, slug)).returning())[0]
    if (!doc) return toolError(notFound('Category'))
    return ok(doc)
  } catch (e) { return toolError(e) }
})

server.tool('delete_category', 'Permanently delete a category. Products or nav items still pointing at it will need to be re-assigned.', {
  slug: z.string().describe('Slug of the category to delete'),
}, async ({ slug }) => {
  try {
    const doc = (await db.delete(categories).where(eq(categories.slug, slug)).returning({ id: categories._id }))[0]
    if (!doc) return toolError(notFound('Category'))
    return ok({ deleted: true, slug })
  } catch (e) { return toolError(e) }
})

// ── Products ──────────────────────────────────────────────────────────────

const productRawShape = {
  productId: z.string().describe('Stable URL-safe id (e.g. "alia", "mention"). Used as the primary lookup key.'),
  name: z.string().describe('Display name'),
  tagline: z.string().optional().describe('Single-line tag shown above the title on each product card'),
  description: z.string().optional().describe('Short body copy shown inside the card'),
  href: z.string().describe('Canonical destination — the running app / external URL. Starts with "http" for external, "/" for internal.'),
  landingUrl: z.string().optional().describe('Optional local landing page on oxy.so (e.g. "/inbox"). When set, /technologies and the navbar link here instead of href.'),
  healthUrl: z.string().optional().describe('Optional URL to probe for /status health checks. Defaults to `href` when unset.'),
  external: z.boolean().optional().describe('True for off-site destinations (opens in a new tab, shows up-right arrow)'),
  cta: z.string().optional().describe('CTA label (e.g. "Explore Alia", "Visit Mention")'),
  brand: z.string().describe('Hex brand color for the card accent strip + icon mark (e.g. "#7c3aed")'),
  brandForeground: z.string().optional().describe('Optional hex color for the icon mark text. Defaults to white.'),
  mark: z.string().describe('Single letter used inside the brand square when no logo is set'),
  logo: z.string().optional().describe('Media document id for the app logo. Takes precedence over `mark`.'),
  section: z.string().optional().describe('Grouping label used on /technologies and /status (e.g. "Social & Communication").'),
  lifecycle: z.enum(['live', 'in-development']).optional().describe('"live" for the shipped grid, "in-development" for the new/upcoming section'),
  showOnProducts: z.boolean().optional().describe('Show this product on the /technologies page.'),
  showOnStatus: z.boolean().optional().describe('Include in /status health probes.'),
  showInNav: z.boolean().optional().describe('Expose in the ecosystem navbar dropdown.'),
  navOpensApp: z.boolean().optional().describe('When true, the navbar dropdown links straight to `href` (the running app) even if a landingUrl is set. Default false.'),
  order: z.number().optional().describe('Sort order inside the section. Lower comes first.'),
}

server.tool('list_products', 'List every product. Supports filtering by lifecycle, section, or which surface the product opts into.', {
  lifecycle: z.enum(['live', 'in-development']).optional().describe('Filter by lifecycle bucket'),
  section: z.string().optional().describe('Filter by section label'),
  surface: z.enum(['products', 'status', 'nav']).optional().describe('Filter to products that opt into the given surface'),
}, async ({ lifecycle, section, surface }) => {
  try {
    const filters: SQL[] = []
    if (lifecycle) filters.push(eq(products.lifecycle, lifecycle))
    if (section) filters.push(eq(products.section, section))
    if (surface === 'products') filters.push(eq(products.showOnProducts, true))
    if (surface === 'status') filters.push(eq(products.showOnStatus, true))
    if (surface === 'nav') filters.push(eq(products.showInNav, true))
    const rows = await db
      .select()
      .from(products)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(asc(products.lifecycle), asc(products.section), asc(products.order), asc(products._id))
    return ok(await populate(rows, { logo: media }))
  } catch (e) { return toolError(e) }
})

server.tool('get_product', 'Get a single product by its productId.', {
  productId: z.string().describe('Stable product id (e.g. "alia", "mention")'),
}, async ({ productId }) => {
  try {
    const [row] = await db.select().from(products).where(eq(products.productId, productId)).limit(1)
    const product = await populateOne(row, { logo: media })
    if (!product) return toolError(notFound('Product'))
    return ok(product)
  } catch (e) { return toolError(e) }
})

server.tool('create_product', 'Create a new product. By default it appears on /technologies, /status, and the ecosystem navbar dropdown.', productRawShape, async (input) => {
  try {
    const [existing] = await db.select({ id: products._id }).from(products).where(eq(products.productId, input.productId)).limit(1)
    if (existing) return toolError(conflict(`Product "${input.productId}" already exists`))
    const product = await insertOne(products, input)
    return ok(product)
  } catch (e) { return toolError(e) }
})

server.tool('update_product', 'Update an existing product. Only the fields you provide are changed.', {
  productId: z.string().describe('Stable product id to update'),
  name: z.string().optional(),
  tagline: z.string().optional(),
  description: z.string().optional(),
  href: z.string().optional(),
  landingUrl: z.string().optional(),
  healthUrl: z.string().optional(),
  external: z.boolean().optional(),
  cta: z.string().optional(),
  brand: z.string().optional(),
  brandForeground: z.string().optional(),
  mark: z.string().optional(),
  logo: z.string().optional().describe('Media document id. Pass empty string to clear.'),
  section: z.string().optional(),
  lifecycle: z.enum(['live', 'in-development']).optional(),
  showOnProducts: z.boolean().optional(),
  showOnStatus: z.boolean().optional(),
  showInNav: z.boolean().optional(),
  navOpensApp: z.boolean().optional(),
  order: z.number().optional(),
}, async ({ productId, ...patch }) => {
  try {
    const normalized: Record<string, unknown> = { ...patch }
    if (patch.logo !== undefined) normalized.logo = patch.logo && patch.logo.length > 0 ? patch.logo : null
    const [row] = await db
      .update(products)
      .set({ ...normalized, updatedAt: new Date() } as never)
      .where(eq(products.productId, productId))
      .returning()
    const product = await populateOne(row, { logo: media })
    if (!product) return toolError(notFound('Product'))
    return ok(product)
  } catch (e) { return toolError(e) }
})

server.tool('delete_product', 'Permanently delete a product. This action cannot be undone.', {
  productId: z.string().describe('Stable product id to delete'),
}, async ({ productId }) => {
  try {
    const doc = (await db.delete(products).where(eq(products.productId, productId)).returning({ id: products._id }))[0]
    if (!doc) return toolError(notFound('Product'))
    return ok({ deleted: true, productId })
  } catch (e) { return toolError(e) }
})

// ── Academy: Courses ────────────────────────────────────────────────────────

const lessonRawShape = {
  title: z.string().describe('Lesson title'),
  slug: z.string().describe('URL-safe lesson slug, unique within the course'),
  content: z.string().optional().describe('Lesson body in Markdown'),
  order: z.number().optional().describe('Lesson order within the course (lower = first)'),
  videoUrl: z.string().optional().describe('Optional video URL for the lesson'),
  durationMinutes: z.number().optional().describe('Estimated lesson duration in minutes'),
}

server.tool('list_courses', 'List Academy courses with optional filtering by category, tag, featured status, and publication status. Returns paginated results sorted by order asc then publishedAt desc.', {
  category: z.string().optional().describe('Filter by Category _id (generic scope)'),
  tag: z.string().optional().describe('Filter by tag'),
  featured: z.boolean().optional().describe('Filter to only featured courses'),
  status: z.enum(['draft', 'published']).optional().describe('Filter by publication status'),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional().describe('Filter by difficulty level'),
  limit: z.number().optional().describe('Results per page (default 20)'),
  page: z.number().optional().describe('Page number (default 1)'),
}, async (params) => {
  try {
    const filters: SQL[] = []
    if (params.category) filters.push(eq(courses.category, params.category))
    if (params.tag) filters.push(sql`${courses.tags} @> ARRAY[${params.tag}]::text[]`)
    if (params.featured) filters.push(eq(courses.featured, true))
    if (params.status) filters.push(eq(courses.status, params.status))
    if (params.level) filters.push(eq(courses.level, params.level))
    const where = filters.length > 0 ? and(...filters) : undefined

    const limit = params.limit ?? 20
    const page = params.page ?? 1
    const skip = (page - 1) * limit

    const [rows, [totals]] = await Promise.all([
      db.select().from(courses).where(where).orderBy(asc(courses.order), desc(courses.publishedAt), asc(courses._id)).offset(skip).limit(limit),
      db.select({ value: count() }).from(courses).where(where),
    ])
    const total = Number(totals?.value ?? 0)
    const items = await populate(rows, CONTENT_REFS)
    return ok({ courses: items, total, page, pages: Math.ceil(total / limit) })
  } catch (e) { return toolError(e) }
})

server.tool('get_course', 'Get a single Academy course by its URL slug, including its lessons and populated cover image / category.', {
  slug: z.string().describe('The URL slug of the course'),
}, async ({ slug }) => {
  try {
    const [courseRow] = await db.select().from(courses).where(eq(courses.slug, slug)).limit(1)
    const course = await populateOne(courseRow, CONTENT_REFS)
    if (!course) return toolError(notFound('Course'))
    return ok(course)
  } catch (e) { return toolError(e) }
})

server.tool('create_course', 'Create a new Academy course. If slug is omitted it is generated from the title (a numeric suffix is added if taken); an explicit slug that is already taken is refused.', {
  title: z.string().describe('Course title'),
  slug: slugInput.optional().describe('URL slug. Generated from the title if omitted.'),
  summary: z.string().optional().describe('Short summary shown on cards (1-2 sentences)'),
  description: z.string().optional().describe('Longer description shown on the detail page (Markdown)'),
  coverImage: z.string().optional().describe('Media document ID for the cover image'),
  category: z.string().optional().describe('Category _id (generic scope)'),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional().describe('Difficulty level'),
  durationMinutes: z.number().optional().describe('Total estimated duration in minutes'),
  lessons: z.array(z.object(lessonRawShape)).optional().describe('Embedded lessons list'),
  tags: z.array(z.string()).optional().describe('Tags for filtering'),
  featured: z.boolean().optional().describe('Surface on the Academy featured grid'),
  status: z.enum(['draft', 'published']).optional().describe('Publication status. Defaults to published.'),
  publishedAt: z.string().optional().describe('Publication date as ISO string'),
  order: z.number().optional().describe('Display order (lower = first)'),
}, async (params, context) => {
  try {
    const { publishedAt, coverImage, category, slug: explicitSlug, ...rest } = params
    // `.returning()` is what hands the row back: without it the insert
    // resolves to a driver result, and the tool answered success with null.
    const courseCreated = await insertWithSlug({ explicit: explicitSlug, base: slugBase(params.title, 'course') }, async (slug) => {
      const [row] = await db.insert(courses).values({
        ...rest,
        slug,
        coverImage: coverImage && coverImage.length > 0 ? coverImage : null,
        category: category && category.length > 0 ? category : null,
        publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
      }).returning()
      if (!row) throw new Error('Insert returned no row')
      return row
    })
    auditLog(context, 'create_course', { id: courseCreated._id, slug: courseCreated.slug })
    return ok(await populateOne(courseCreated, CONTENT_REFS))
  } catch (e) { return toolError(e) }
})

server.tool('update_course', 'Update an existing Academy course by slug. Only provided fields are changed.', {
  slug: z.string().describe('Current slug of the course to update'),
  newSlug: z.string().optional().describe('New slug to replace the current one. Must be unique.'),
  title: z.string().optional(),
  summary: z.string().optional(),
  description: z.string().optional(),
  coverImage: z.string().optional().describe('Media document ID. Pass empty string to clear.'),
  category: z.string().optional().describe('Category _id. Pass empty string to clear.'),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  durationMinutes: z.number().optional(),
  lessons: z.array(z.object(lessonRawShape)).optional(),
  tags: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  status: z.enum(['draft', 'published']).optional(),
  publishedAt: z.string().optional(),
  order: z.number().optional(),
}, async ({ slug, newSlug, ...updates }) => {
  try {
    const patch: Record<string, unknown> = { ...updates }
    if (newSlug) patch.slug = newSlug
    if (updates.publishedAt) patch.publishedAt = new Date(updates.publishedAt)
    if (updates.coverImage !== undefined) {
      patch.coverImage = updates.coverImage && updates.coverImage.length > 0
        ? updates.coverImage
        : null
    }
    if (updates.category !== undefined) {
      patch.category = updates.category && updates.category.length > 0
        ? updates.category
        : null
    }
    const [courseUpdated] = await db.update(courses).set({ ...patch, updatedAt: new Date() } as never).where(eq(courses.slug, slug)).returning()
    const course = await populateOne(courseUpdated, CONTENT_REFS)
    if (!course) return toolError(notFound('Course'))
    return ok(course)
  } catch (e) { return toolError(e) }
})

server.tool('delete_course', 'Permanently delete an Academy course by slug. Cannot be undone.', {
  slug: z.string().describe('The URL slug of the course to delete'),
}, async ({ slug }) => {
  try {
    const [course] = await db.delete(courses).where(eq(courses.slug, slug)).returning({ id: courses._id })
    if (!course) return toolError(notFound('Course'))
    return ok({ deleted: true, slug })
  } catch (e) { return toolError(e) }
})

// ── Academy: Resources ──────────────────────────────────────────────────────

server.tool('list_resources', 'List Academy resources (guides, papers, videos, tools, templates, links). Returns paginated results sorted by order asc then publishedAt desc.', {
  category: z.string().optional().describe('Filter by Category _id (generic scope)'),
  tag: z.string().optional().describe('Filter by tag'),
  type: z.enum(['guide', 'paper', 'video', 'tool', 'template', 'link']).optional().describe('Filter by resource type'),
  featured: z.boolean().optional().describe('Filter to only featured resources'),
  status: z.enum(['draft', 'published']).optional().describe('Filter by publication status'),
  limit: z.number().optional().describe('Results per page (default 20)'),
  page: z.number().optional().describe('Page number (default 1)'),
}, async (params) => {
  try {
    const filters: SQL[] = []
    if (params.category) filters.push(eq(resources.category, params.category))
    if (params.tag) filters.push(sql`${resources.tags} @> ARRAY[${params.tag}]::text[]`)
    if (params.type) filters.push(eq(resources.type, params.type))
    if (params.featured) filters.push(eq(resources.featured, true))
    if (params.status) filters.push(eq(resources.status, params.status))
    const where = filters.length > 0 ? and(...filters) : undefined

    const limit = params.limit ?? 20
    const page = params.page ?? 1
    const skip = (page - 1) * limit

    const [rows, [totals]] = await Promise.all([
      db.select().from(resources).where(where).orderBy(asc(resources.order), desc(resources.publishedAt), asc(resources._id)).offset(skip).limit(limit),
      db.select({ value: count() }).from(resources).where(where),
    ])
    const total = Number(totals?.value ?? 0)
    const items = await populate(rows, CONTENT_REFS)
    return ok({ resources: items, total, page, pages: Math.ceil(total / limit) })
  } catch (e) { return toolError(e) }
})

server.tool('get_resource', 'Get a single Academy resource by its URL slug.', {
  slug: z.string().describe('The URL slug of the resource'),
}, async ({ slug }) => {
  try {
    const [resourceRow] = await db.select().from(resources).where(eq(resources.slug, slug)).limit(1)
    const resource = await populateOne(resourceRow, CONTENT_REFS)
    if (!resource) return toolError(notFound('Resource'))
    return ok(resource)
  } catch (e) { return toolError(e) }
})

server.tool('create_resource', 'Create a new Academy resource. If slug is omitted it is generated from the title (a numeric suffix is added if taken); an explicit slug that is already taken is refused.', {
  title: z.string().describe('Resource title'),
  slug: slugInput.optional().describe('URL slug. Generated from the title if omitted.'),
  summary: z.string().optional().describe('Short summary shown on cards'),
  type: z.enum(['guide', 'paper', 'video', 'tool', 'template', 'link']).optional().describe('Resource type. Defaults to "guide".'),
  coverImage: z.string().optional().describe('Media document ID for the cover image'),
  category: z.string().optional().describe('Category _id (generic scope)'),
  href: z.string().describe('Canonical URL — local path like "/academy/...", or full external URL'),
  external: z.boolean().optional().describe('True for off-site destinations'),
  tags: z.array(z.string()).optional().describe('Tags for filtering'),
  featured: z.boolean().optional().describe('Surface on the Academy featured grid'),
  status: z.enum(['draft', 'published']).optional().describe('Publication status. Defaults to published.'),
  publishedAt: z.string().optional().describe('Publication date as ISO string'),
  order: z.number().optional().describe('Display order (lower = first)'),
}, async (params, context) => {
  try {
    const { publishedAt, coverImage, category, slug: explicitSlug, ...rest } = params
    // `.returning()` is what hands the row back: without it the insert
    // resolves to a driver result, and the tool answered success with null.
    const resourceCreated = await insertWithSlug({ explicit: explicitSlug, base: slugBase(params.title, 'resource') }, async (slug) => {
      const [row] = await db.insert(resources).values({
        ...rest,
        slug,
        coverImage: coverImage && coverImage.length > 0 ? coverImage : null,
        category: category && category.length > 0 ? category : null,
        publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
      }).returning()
      if (!row) throw new Error('Insert returned no row')
      return row
    })
    auditLog(context, 'create_resource', { id: resourceCreated._id, slug: resourceCreated.slug })
    return ok(await populateOne(resourceCreated, CONTENT_REFS))
  } catch (e) { return toolError(e) }
})

server.tool('update_resource', 'Update an existing Academy resource by slug. Only provided fields are changed.', {
  slug: z.string().describe('Current slug of the resource to update'),
  newSlug: z.string().optional().describe('New slug to replace the current one. Must be unique.'),
  title: z.string().optional(),
  summary: z.string().optional(),
  type: z.enum(['guide', 'paper', 'video', 'tool', 'template', 'link']).optional(),
  coverImage: z.string().optional().describe('Media document ID. Pass empty string to clear.'),
  category: z.string().optional().describe('Category _id. Pass empty string to clear.'),
  href: z.string().optional(),
  external: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  status: z.enum(['draft', 'published']).optional(),
  publishedAt: z.string().optional(),
  order: z.number().optional(),
}, async ({ slug, newSlug, ...updates }) => {
  try {
    const patch: Record<string, unknown> = { ...updates }
    if (newSlug) patch.slug = newSlug
    if (updates.publishedAt) patch.publishedAt = new Date(updates.publishedAt)
    if (updates.coverImage !== undefined) {
      patch.coverImage = updates.coverImage && updates.coverImage.length > 0
        ? updates.coverImage
        : null
    }
    if (updates.category !== undefined) {
      patch.category = updates.category && updates.category.length > 0
        ? updates.category
        : null
    }
    const [resourceUpdated] = await db.update(resources).set({ ...patch, updatedAt: new Date() } as never).where(eq(resources.slug, slug)).returning()
    const resource = await populateOne(resourceUpdated, CONTENT_REFS)
    if (!resource) return toolError(notFound('Resource'))
    return ok(resource)
  } catch (e) { return toolError(e) }
})

server.tool('delete_resource', 'Permanently delete an Academy resource by slug. Cannot be undone.', {
  slug: z.string().describe('The URL slug of the resource to delete'),
}, async ({ slug }) => {
  try {
    const [resource] = await db.delete(resources).where(eq(resources.slug, slug)).returning({ id: resources._id })
    if (!resource) return toolError(notFound('Resource'))
    return ok({ deleted: true, slug })
  } catch (e) { return toolError(e) }
})

// ── Help Center: Articles ──────────────────────────────────────────────────

server.tool('list_help_articles', 'List Help Center articles with optional filtering by category, tag, featured status, and publication status. Returns paginated results sorted by order asc then publishedAt desc.', {
  category: z.string().optional().describe('Filter by Category _id (generic scope)'),
  tag: z.string().optional().describe('Filter by tag'),
  featured: z.boolean().optional().describe('Filter to only featured articles'),
  status: z.enum(['draft', 'published']).optional().describe('Filter by publication status'),
  limit: z.number().optional().describe('Results per page (default 20)'),
  page: z.number().optional().describe('Page number (default 1)'),
}, async (params) => {
  try {
    const filters: SQL[] = []
    if (params.category) filters.push(eq(helpArticles.category, params.category))
    if (params.tag) filters.push(sql`${helpArticles.tags} @> ARRAY[${params.tag}]::text[]`)
    if (params.featured) filters.push(eq(helpArticles.featured, true))
    if (params.status) filters.push(eq(helpArticles.status, params.status))
    const where = filters.length > 0 ? and(...filters) : undefined

    const limit = params.limit ?? 20
    const page = params.page ?? 1
    const skip = (page - 1) * limit

    const [rows, [totals]] = await Promise.all([
      db.select().from(helpArticles).where(where).orderBy(asc(helpArticles.order), desc(helpArticles.publishedAt), asc(helpArticles._id)).offset(skip).limit(limit),
      db.select({ value: count() }).from(helpArticles).where(where),
    ])
    const total = Number(totals?.value ?? 0)
    const articles = await populate(rows, CONTENT_REFS)
    return ok({ articles, total, page, pages: Math.ceil(total / limit) })
  } catch (e) { return toolError(e) }
})

server.tool('get_help_article', 'Get a single Help Center article by its URL slug, including populated cover image and category.', {
  slug: z.string().describe('The URL slug of the help article'),
}, async ({ slug }) => {
  try {
    const [articleRow] = await db.select().from(helpArticles).where(eq(helpArticles.slug, slug)).limit(1)
    const article = await populateOne(articleRow, CONTENT_REFS)
    if (!article) return toolError(notFound('Help article'))
    return ok(article)
  } catch (e) { return toolError(e) }
})

server.tool('create_help_article', 'Create a new Help Center article. If slug is omitted it is generated from the title (a numeric suffix is added if taken); an explicit slug that is already taken is refused.', {
  title: z.string().describe('Article title'),
  slug: slugInput.optional().describe('URL slug. Generated from the title if omitted.'),
  summary: z.string().optional().describe('Short summary shown on cards (1-2 sentences)'),
  content: z.string().optional().describe('Full article body shown on the detail page (Markdown)'),
  category: z.string().optional().describe('Category _id (generic scope)'),
  icon: z.string().optional().describe('Optional lucide icon name (e.g. "rocket"). Stored as kebab-case.'),
  coverImage: z.string().optional().describe('Media document ID for the cover image'),
  tags: z.array(z.string()).optional().describe('Tags for filtering'),
  featured: z.boolean().optional().describe('Surface on the Help Center "getting started" grid'),
  status: z.enum(['draft', 'published']).optional().describe('Publication status. Defaults to published.'),
  publishedAt: z.string().optional().describe('Publication date as ISO string'),
  order: z.number().optional().describe('Display order (lower = first)'),
}, async (params, context) => {
  try {
    const { publishedAt, coverImage, category, slug: explicitSlug, ...rest } = params
    // `.returning()` is what hands the row back: without it the insert
    // resolves to a driver result, and the tool answered success with null.
    const articleCreated = await insertWithSlug({ explicit: explicitSlug, base: slugBase(params.title, 'article') }, async (slug) => {
      const [row] = await db.insert(helpArticles).values({
        ...rest,
        slug,
        coverImage: coverImage && coverImage.length > 0 ? coverImage : null,
        category: category && category.length > 0 ? category : null,
        publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
      }).returning()
      if (!row) throw new Error('Insert returned no row')
      return row
    })
    auditLog(context, 'create_help_article', { id: articleCreated._id, slug: articleCreated.slug })
    return ok(await populateOne(articleCreated, CONTENT_REFS))
  } catch (e) { return toolError(e) }
})

server.tool('update_help_article', 'Update an existing Help Center article by slug. Only provided fields are changed.', {
  slug: z.string().describe('Current slug of the article to update'),
  newSlug: z.string().optional().describe('New slug to replace the current one. Must be unique.'),
  title: z.string().optional(),
  summary: z.string().optional(),
  content: z.string().optional(),
  category: z.string().optional().describe('Category _id. Pass empty string to clear.'),
  icon: z.string().optional().describe('Lucide icon name. Pass empty string to clear.'),
  coverImage: z.string().optional().describe('Media document ID. Pass empty string to clear.'),
  tags: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  status: z.enum(['draft', 'published']).optional(),
  publishedAt: z.string().optional(),
  order: z.number().optional(),
}, async ({ slug, newSlug, ...updates }) => {
  try {
    const patch: Record<string, unknown> = { ...updates }
    if (newSlug) patch.slug = newSlug
    if (updates.publishedAt) patch.publishedAt = new Date(updates.publishedAt)
    if (updates.coverImage !== undefined) {
      patch.coverImage = updates.coverImage && updates.coverImage.length > 0
        ? updates.coverImage
        : null
    }
    if (updates.category !== undefined) {
      patch.category = updates.category && updates.category.length > 0
        ? updates.category
        : null
    }
    const [articleUpdated] = await db.update(helpArticles).set({ ...patch, updatedAt: new Date() } as never).where(eq(helpArticles.slug, slug)).returning()
    const article = await populateOne(articleUpdated, CONTENT_REFS)
    if (!article) return toolError(notFound('Help article'))
    return ok(article)
  } catch (e) { return toolError(e) }
})

server.tool('delete_help_article', 'Permanently delete a Help Center article by slug. Cannot be undone.', {
  slug: z.string().describe('The URL slug of the article to delete'),
}, async ({ slug }) => {
  try {
    const [article] = await db.delete(helpArticles).where(eq(helpArticles.slug, slug)).returning({ id: helpArticles._id })
    if (!article) return toolError(notFound('Help article'))
    return ok({ deleted: true, slug })
  } catch (e) { return toolError(e) }
})

// ── Referrals ──────────────────────────────────────────────────────────────

const referralRawShape = {
  code: z.string().describe('Unique URL-safe code (e.g. "ALEX-2026"). Letters, digits, dash, underscore only.'),
  name: z.string().describe('Display name of the referrer — shown on the public landing when someone visits /referrals?ref=CODE'),
  email: z.string().optional().describe('Contact email. Admin-only — never returned from the public endpoint.'),
  type: z.enum(['paid', 'ambassador', 'user']).optional().describe('"paid" for affiliates on commission, "ambassador" for unpaid-but-tracked advocates, "user" for casual share links'),
  status: z.enum(['active', 'paused', 'revoked']).optional().describe('Only active codes resolve on the public endpoint'),
  oxyUserId: z.string().optional().describe('Optional link to an Oxy account by user id'),
  commissionPercent: z.number().min(0).max(100).optional().describe('For type="paid" — commission percent, 0–100'),
  customLandingUrl: z.string().optional().describe('Optional destination override. When unset, the code sends visitors to /referrals?ref=CODE.'),
  notes: z.string().optional().describe('Admin-only free-form notes'),
}

server.tool('list_referrals', 'List every referral. Supports filtering by program type or lifecycle status.', {
  type: z.enum(['paid', 'ambassador', 'user']).optional().describe('Filter by program bucket'),
  status: z.enum(['active', 'paused', 'revoked']).optional().describe('Filter by lifecycle status'),
}, async ({ type, status }) => {
  try {
    const filters: SQL[] = []
    if (type) filters.push(eq(referrals.type, type))
    if (status) filters.push(eq(referrals.status, status))
    const rows = await db
      .select()
      .from(referrals)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(asc(referrals.type), desc(referrals.createdAt), asc(referrals._id))
    return ok(rows)
  } catch (e) { return toolError(e) }
})

server.tool('get_referral', 'Get a single referral by its code.', {
  code: z.string().describe('Unique referral code'),
}, async ({ code }) => {
  try {
    const [referral] = await db.select().from(referrals).where(eq(referrals.code, code)).limit(1)
    if (!referral) return toolError(notFound('Referral'))
    return ok(referral)
  } catch (e) { return toolError(e) }
})

server.tool('create_referral', 'Create a new referral code. Defaults to type="user" and status="active".', referralRawShape, async (input) => {
  try {
    const [existing] = await db.select({ id: referrals._id }).from(referrals).where(eq(referrals.code, input.code)).limit(1)
    if (existing) return toolError(conflict(`Referral "${input.code}" already exists`))
    const referral = await insertOne(referrals, input)
    return ok(referral)
  } catch (e) { return toolError(e) }
})

server.tool('update_referral', 'Update an existing referral. Only the fields you provide are changed.', {
  code: z.string().describe('Referral code to update'),
  name: z.string().optional(),
  email: z.string().optional(),
  type: z.enum(['paid', 'ambassador', 'user']).optional(),
  status: z.enum(['active', 'paused', 'revoked']).optional(),
  oxyUserId: z.string().optional(),
  commissionPercent: z.number().min(0).max(100).optional(),
  customLandingUrl: z.string().optional(),
  notes: z.string().optional(),
}, async ({ code, ...patch }) => {
  try {
    const [referral] = await db
      .update(referrals)
      .set({ ...patch, updatedAt: new Date() } as never)
      .where(eq(referrals.code, code))
      .returning()
    if (!referral) return toolError(notFound('Referral'))
    return ok(referral)
  } catch (e) { return toolError(e) }
})

server.tool('delete_referral', 'Permanently delete a referral code. This action cannot be undone.', {
  code: z.string().describe('Referral code to delete'),
}, async ({ code }) => {
  try {
    const [doc] = await db.delete(referrals).where(eq(referrals.code, code)).returning({ id: referrals._id })
    if (!doc) return toolError(notFound('Referral'))
    return ok({ deleted: true, code })
  } catch (e) { return toolError(e) }
})

} // end registerTools

// ── Audit ───────────────────────────────────────────────────────────────────

/**
 * One line per completed write: which tool, which account, which record. The
 * actor is the authenticated account, never an input field, and the target is
 * the minimum that identifies the record — no bodies, no URLs, no personal data.
 */
function auditLog(context: ToolContext, tool: string, target: Record<string, unknown>): void {
  console.log(`[mcp:audit] ${JSON.stringify({ tool, actor: context.actorId, request: context.requestId, target })}`)
}

// ── Capability catalog ──────────────────────────────────────────────────────

const TOOLS = collectTools()

/** Scopes a person grants the connector on Oxy's consent screen. */
const READ_SCOPE = 'website.read'
const WRITE_SCOPE = 'website.write'

function accessFor(toolName: string): McpToolAccess {
  const access = MCP_TOOL_ACCESS[toolName]
  if (!access) throw new Error(`MCP tool ${toolName} has no access policy in mcpAccess.ts`)
  return access
}

function catalogTool(definition: ToolDefinition): CatalogTool {
  const inputSchema: Record<string, unknown> = z.toJSONSchema(z.object(definition.shape), {
    target: 'draft-7',
    io: 'input',
  })
  delete inputSchema.$schema
  const writes = accessFor(definition.name).kind === 'write'
  const effects = effectsFor(definition.name)
  return {
    name: definition.name,
    version: '1.0.0',
    description: definition.description,
    inputSchema,
    capabilityPackage: writes ? 'publish' : 'read',
    requiredCapabilities: [writes ? WRITE_SCOPE : READ_SCOPE],
    resourceTypes: ['website_content'],
    effect: writes ? 'write' : 'read',
    idempotency: effects.idempotency,
    rollback: effects.rollback,
    exposure: ['mcp'],
    limitKeys: [],
    // The catalog is exposed to external MCP only; the internal capability lane
    // never invokes this path.
    invocation: { method: 'POST', path: `/_oxy/capabilities/${definition.name}` },
  }
}

function buildCatalog(): AppCapabilityCatalog {
  const unpoliced = Object.keys(MCP_TOOL_ACCESS).filter((name) => !OPTIONAL_TOOLS.has(name) && !TOOLS.some((tool) => tool.name === name))
  if (unpoliced.length > 0) {
    throw new Error(`MCP access policies without a tool: ${unpoliced.join(', ')}`)
  }
  return appCapabilityCatalogSchema.parse({
    schemaVersion: '1',
    appId: 'website',
    version: '1.0.0',
    audience: 'website-api',
    internalBaseUrl: new URL(config.mcp.resource).origin,
    accountResourceType: 'oxy_account',
    externalMcp: { resource: config.mcp.resource },
    tools: TOOLS.map(catalogTool),
    events: [],
  })
}

/** Built at import, so a tool missing its policy or schema fails the boot rather than a request. */
export const WEBSITE_MCP_CATALOG = buildCatalog()

// ── Authorization ───────────────────────────────────────────────────────────

function isWebsiteAdmin(accountId: string): boolean {
  return config.adminUserIds.includes(accountId)
}

async function authorize(
  _input: Readonly<Record<string, unknown>>,
  { tool, principal }: CatalogInvocationContext,
): Promise<CatalogMcpAuthorizationDecision> {
  const access = accessFor(tool.name)
  const adminOnly = access.kind === 'write' || access.kind === 'admin-read'
  if (adminOnly && !isWebsiteAdmin(principal.activeAccountId)) {
    return { allowed: false, reason: `${tool.name} is only available to website admins` }
  }
  return { allowed: true, effectiveAccountId: principal.activeAccountId }
}

/**
 * Answer a non-admin's read from the site's own public route, with no
 * credentials — exactly what an anonymous visitor would receive.
 */
async function readPublicRoute(
  access: Extract<McpToolAccess, { kind: 'public-read' }>,
  input: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<ToolResult> {
  let path: string
  try {
    path = access.publicPath(input)
  } catch (error) {
    if (error instanceof PublicReadRefused) return errorOf('permission_denied', error.message)
    throw error
  }
  const timeout = AbortSignal.timeout(15_000)
  const response = await fetch(`http://127.0.0.1:${config.port}/api${path}`, {
    headers: { accept: 'application/json' },
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
  })
  if (response.status === 404) return errorOf('not_found', 'Not found')
  if (response.status === 400) return errorOf('invalid_request', 'The public API rejected the request')
  if (!response.ok) return errorOf('service_unavailable', `The public API answered ${response.status}`)
  return ok(await response.json())
}

/**
 * Run one tool: validate with its own Zod schema (the catalog's JSON Schema
 * round trip checks shape, but defaults and refinements live only here), hand
 * it the authenticated context, and turn anything thrown into a safe error.
 * Exported for the integration tests, which call it without the transport.
 */
export async function invokeTool(name: string, input: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
  const definition = TOOLS.find((tool) => tool.name === name)
  if (!definition) return errorOf('not_found', `Unknown tool ${name}`)
  const startedAt = Date.now()
  let result: ToolResult
  try {
    const access = accessFor(name)
    if (access.kind === 'public-read' && !isWebsiteAdmin(context.actorId)) {
      result = await readPublicRoute(access, { ...input }, context.signal)
    } else {
      const { idempotencyKey, ...args } = z.object(definition.shape).parse(input) as Record<string, unknown>
      const run = async () => {
        try {
          return await definition.handler(args, context)
        } catch (error) {
          return toolError(error)
        }
      }
      result = typeof idempotencyKey === 'string'
        ? await withIdempotency({ accountId: context.actorId, tool: name, key: idempotencyKey, input: args }, run)
        : await run()
    }
  } catch (error) {
    result = toolError(error)
  }
  const code = result.isError ? (result.structuredContent as { error?: { code?: string } } | undefined)?.error?.code : undefined
  console.log(`[mcp:call] ${JSON.stringify({ tool: name, actor: context.actorId, request: context.requestId, ok: !result.isError, code, ms: Date.now() - startedAt })}`)
  return result
}

const handlers: CatalogToolHandlers = Object.fromEntries(TOOLS.map((definition) => [
  definition.name,
  async (input: Readonly<Record<string, unknown>>, context: CatalogInvocationContext): Promise<CatalogToolResult> =>
    invokeTool(definition.name, { ...input }, {
      actorId: context.principal.activeAccountId,
      signal: context.request.signal,
      requestId: context.request.requestId,
    }),
]))

export const WEBSITE_MCP_TOOL_NAMES: readonly string[] = TOOLS.map((tool) => tool.name)

// ── Mount on Express app ────────────────────────────────────────────────────

/** Browser clients that may call the endpoint directly; server-side connectors send no Origin. */
const CLAUDE_ORIGINS = ['https://claude.ai', 'https://www.claude.ai', 'https://api.anthropic.com']

/**
 * The website's Oxy service identity. Oxy answers token introspection only for
 * the application that registered the resource, so this is the same credential
 * that registers the catalog.
 */
export const oxyService = new OxyServices({ baseURL: config.oxyApiBase })
if (config.oxyServiceApiKey && config.oxyServiceApiSecret) {
  oxyService.configureServiceAuth(config.oxyServiceApiKey, config.oxyServiceApiSecret)
}

/**
 * Sign-in is Oxy's MCP OAuth: every request carries a short-lived token Oxy
 * issued for this exact resource, checked live against Oxy on each call. The
 * transport is stateless — every task behind the load balancer can answer
 * every request, so there is no session to lose between them.
 */
const service = createCatalogMcpHttpService({
  catalog: WEBSITE_MCP_CATALOG,
  handlers,
  authorize,
  authorizationServer: config.oxyApiBase,
  getServiceToken: () => oxyService.getServiceToken(),
  invalidateServiceToken: () => oxyService.invalidateServiceToken(),
  allowedOrigins: [...CLAUDE_ORIGINS, ...config.mcp.allowedOrigins],
  serverName: 'oxy-website',
  logger: { error: (message, error) => console.error(`[mcp] ${message}:`, error) },
})

export function mountMcp(app: express.Express) {
  // Mounted before express.json(): the transport reads the raw body itself.
  app.all('/mcp', (req, res) => {
    void service.handleMcp(req, res)
  })
  // RFC 9728 places a path-bearing resource's metadata under its path; the bare
  // well-known path is served too for clients that look there first.
  app.all([service.protectedResourceMetadataPath, '/.well-known/oauth-protected-resource'], (req, res) => {
    service.handleProtectedResourceMetadata(req, res)
  })
}
