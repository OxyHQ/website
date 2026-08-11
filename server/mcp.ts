import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import express from 'express'
import { and, asc, count, desc, eq, gte, ilike, inArray, like, lte, ne, not, or, sql, type SQL } from 'drizzle-orm'
import crypto from 'node:crypto'
import { z } from 'zod'
import { safeFetch, UpstreamError } from '@oxyhq/core/server'

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
  mcpTokens,
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
import {
  DEFAULT_HERO_BG_MP4,
  DEFAULT_HERO_BG_WEBM,
  DEFAULT_HERO_POSTER,
  DEFAULT_HERO_TITLE,
} from './constants/hero.js'
import { syncAllRepos, syncSingleRepo } from './services/githubSync.js'
import { deleteFromSpaces, uploadToSpaces } from './services/s3.js'
import { processImage } from './services/thumbnails.js'
import { heroUpdateRawShape, heroUpdateSchema, type HeroUpdate } from './validation/hero.js'
import { escapeRegex } from './utils/escapeRegex.js'
import { TRANSLATABLE_COLLECTIONS } from './constants/translations.js'

// ── SSRF-safe URL download helper ────────────────────────────────────────────

const MAX_DOWNLOAD_BYTES = 25 * 1024 * 1024 // 25 MB

async function downloadUrl(url: string, maxBytes = MAX_DOWNLOAD_BYTES): Promise<{ buffer: Buffer; contentType: string }> {
  const result = await safeFetch(url)
  if (result.status < 200 || result.status >= 300) {
    result.response.destroy()
    throw new UpstreamError(`Upstream returned ${result.status}`)
  }
  const rawContentType = result.headers['content-type']
  const contentType = Array.isArray(rawContentType)
    ? rawContentType[0] ?? 'application/octet-stream'
    : rawContentType ?? 'application/octet-stream'

  return new Promise<{ buffer: Buffer; contentType: string }>((resolve, reject) => {
    const chunks: Buffer[] = []
    let totalBytes = 0

    result.response.on('data', (chunk: Buffer) => {
      totalBytes += chunk.length
      if (totalBytes > maxBytes) {
        result.response.destroy()
        reject(new UpstreamError(`Response exceeds ${maxBytes} byte limit`))
        return
      }
      chunks.push(chunk)
    })

    result.response.on('end', () => {
      resolve({ buffer: Buffer.concat(chunks), contentType })
    })

    result.response.on('error', (err: Error) => {
      reject(new UpstreamError(`Stream error: ${err.message}`))
    })
  })
}

// ─────────────────────────────────────────────────────────────────────────────

function createMcpServer() {
  const server = new McpServer({
    name: 'oxy-website',
    version: '1.0.0',
  }, {
    capabilities: {
      tools: {},
    },
  })
  registerTools(server)
  return server
}

// ── Helper ──────────────────────────────────────────────────────────────────

function ok(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
}

function err(e: unknown) {
  const msg = e instanceof Error ? `${e.message}\n${e.stack}` : String(e)
  return { content: [{ type: 'text' as const, text: msg }], isError: true as const }
}

function registerTools(server: McpServer) {

// ── Diagnostics ─────────────────────────────────────────────────────────────

server.tool('debug_upload_test', 'Test each step of the upload pipeline and report what fails. Use this to diagnose upload_image failures.', {
  url: z.string().describe('URL to test downloading'),
}, async ({ url }) => {
  const steps: string[] = []
  try {
    steps.push('1. Starting fetch...')
    const { buffer, contentType } = await downloadUrl(url)
    steps.push(`2. Fetch done: content-type=${contentType}`)
    steps.push(`3. Buffer: ${buffer.length} bytes`)
    
    steps.push('4. Testing S3 upload...')
    const cdnUrl = await uploadToSpaces(buffer, 'debug-test.jpg', 'image/jpeg', 'oxy-website/debug')
    steps.push(`5. S3 upload OK: ${cdnUrl}`)
    
    steps.push('6. Testing media insert...')
    const mediaRow = await insertOne(media, {
      url: cdnUrl, thumbnails: { sm: '', md: '', lg: '' },
      filename: 'debug-test.jpg', key: new URL(cdnUrl).pathname.slice(1),
      mimeType: 'image/jpeg', size: buffer.length,
      alt: '', tags: ['debug'], folder: 'debug', uploadedBy: 'mcp',
    })
    steps.push(`7. Media created: ${mediaRow._id}`)

    // Cleanup
    await db.delete(media).where(eq(media._id, mediaRow._id as string))
    steps.push('8. Cleanup done')
    
    return ok({ success: true, steps })
  } catch (e) {
    const msg = e instanceof Error ? `${e.message}\n${e.stack}` : String(e)
    steps.push(`FAILED: ${msg}`)
    return ok({ success: false, steps })
  }
})

/** `Model.create(values)` became one insert that hands the row back. */
async function insertOne(table: PgTable, values: Record<string, unknown>): Promise<Record<string, unknown>> {
  const [row] = await db.insert(table).values(values as never).returning()
  return row as Record<string, unknown>
}

// ── Pages ───────────────────────────────────────────────────────────────────

server.tool('list_pages', 'List all page slugs', {}, async () => {
  try {
    const rows = await db.select({ _id: pages._id, slug: pages.slug, title: pages.title }).from(pages).orderBy(asc(pages.slug), asc(pages._id))
    return ok(rows)
  } catch (e) { return err(e) }
})

server.tool('get_page', 'Get a page by slug', { slug: z.string() }, async ({ slug }) => {
  try {
    const [page] = await db.select().from(pages).where(eq(pages.slug, slug)).limit(1)
    if (!page) return err('Page not found')
    return ok(page)
  } catch (e) { return err(e) }
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
  } catch (e) { return err(e) }
})

// ── Navigation ──────────────────────────────────────────────────────────────

server.tool('get_navigation', 'Get all navigation dropdowns', {}, async () => {
  try {
    const nav = await db.select().from(navigationDropdowns).orderBy(asc(navigationDropdowns.order), asc(navigationDropdowns._id))
    return ok(nav)
  } catch (e) { return err(e) }
})

const sidePanelLinkSchema = z.object({ label: z.string(), href: z.string() })
const sidePanelSchema = z.object({ heading: z.string(), links: z.array(sidePanelLinkSchema) })
const navItemSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  href: z.string(),
  icon: z.string().optional(),
  section: z.string().optional(),
  showGrid: z.boolean().optional(),
})
const navDropdownSchema = z.object({
  label: z.string(),
  items: z.array(navItemSchema),
  sidePanel: sidePanelSchema.optional(),
  order: z.number().optional(),
})

server.tool('replace_navigation', 'Replace all navigation dropdowns', {
  items: z.array(navDropdownSchema),
}, async ({ items }) => {
  try {
    // One transaction: the site cannot be left without navigation halfway.
    const nav = await db.transaction(async (tx) => {
      await tx.delete(navigationDropdowns)
      if (items.length === 0) return []
      return tx.insert(navigationDropdowns).values(items as never).returning()
    })
    return ok(nav)
  } catch (e) { return err(e) }
})

// ── Footer ──────────────────────────────────────────────────────────────────

server.tool('get_footer', 'Get footer content', {}, async () => {
  try {
    const [footer] = await db.select().from(footers).limit(1)
    return ok(footer ?? { columns: [], socialLinks: [], copyright: '' })
  } catch (e) { return err(e) }
})

const footerLinkSchema = z.object({
  label: z.string(),
  href: z.string(),
  isNewBadge: z.boolean().optional(),
  isExternal: z.boolean().optional(),
})
const footerColumnSchema = z.object({ title: z.string(), links: z.array(footerLinkSchema) })
const socialLinkSchema = z.object({ label: z.string(), icon: z.string(), href: z.string() })

server.tool('update_footer', 'Update footer content', {
  columns: z.array(footerColumnSchema).optional(),
  socialLinks: z.array(socialLinkSchema).optional(),
  copyright: z.string().optional(),
}, async (params) => {
  try {
    // Only the fields that were sent, exactly as before: an omitted column
    // list must not blank the footer.
    const update: Record<string, unknown> = {}
    if (params.columns !== undefined) update.columns = params.columns
    if (params.socialLinks !== undefined) update.socialLinks = params.socialLinks
    if (params.copyright !== undefined) update.copyright = params.copyright
    return ok(await upsertSingleton(footers, update))
  } catch (e) { return err(e) }
})

// ── Hero ────────────────────────────────────────────────────────────────────

/** A hero media field is either a Media `_id` or a static URL. */
function isMediaId(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{24}$/i.test(value)
}

/** Resolves the three media fields, leaving static URLs untouched. */
async function withHeroMedia(hero: Record<string, unknown>): Promise<Record<string, unknown>> {
  const populated = { ...hero }
  for (const field of ['backgroundVideoWebm', 'backgroundVideoMp4', 'backgroundPoster'] as const) {
    const value = populated[field]
    if (!isMediaId(value)) continue
    const resolved = await populateOne({ ref: value }, { ref: media })
    populated[field] = resolved?.ref ?? value
  }
  return populated
}

/** The hero singleton, created with the shipped defaults on first read. */
async function readHero(): Promise<Record<string, unknown>> {
  const [row] = await db.select().from(heroContents).limit(1)
  if (row) return withHeroMedia(row)
  const [created] = await db
    .insert(heroContents)
    .values({
      title: DEFAULT_HERO_TITLE,
      backgroundVideoWebm: DEFAULT_HERO_BG_WEBM,
      backgroundVideoMp4: DEFAULT_HERO_BG_MP4,
      backgroundPoster: DEFAULT_HERO_POSTER,
      })
    .returning()
  return withHeroMedia(created)
}

server.tool('get_hero', 'Get the homepage hero singleton: title, background video/poster, and the carousel slot grid that sits below the hero copy. Returns sensible defaults the first time it is called so the site renders identically before any edits.', {}, async () => {
  try {
    return ok(await readHero())
  } catch (e) { return err(e) }
})

server.tool('update_hero', 'Update the homepage hero. Pass any subset of: title (supports newlines), background video/poster (Media _id or static URL like "/images/landing/hero-background.webm"). Only provided fields are changed.', heroUpdateRawShape, async (params: HeroUpdate) => {
  try {
    // Re-validate via the same schema the REST route uses so the MCP and the
    // HTTP path stay in lockstep on shape, defaults, and rejections.
    const body = heroUpdateSchema.parse(params)

    const update: Record<string, unknown> = {}
    if (body.title !== undefined) update.title = body.title
        // A media field holds either a Media `_id` or a static URL; both are
    // stored as given and resolved on read.
    for (const field of ['backgroundVideoWebm', 'backgroundVideoMp4', 'backgroundPoster'] as const) {
      const value = body[field]
      if (value === undefined) continue
      update[field] = value || null
    }

    const hero = (await upsertSingleton(heroContents, update)) as Record<string, unknown> | undefined
    if (!hero) return err(new Error('Failed to update hero content'))
    // Selective populate: Mixed fields may hold static URLs that CastError
    // under a blanket `.populate(...)`.
    return ok(await withHeroMedia(hero))
  } catch (e) { return err(e) }
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
  } catch (e) { return err(e) }
})

server.tool('get_post', 'Get a single newsroom post by its URL slug. Returns full post content including markdown body.', {
  slug: z.string().describe('The URL slug of the post'),
}, async ({ slug }) => {
  try {
    const [row] = await db.select().from(newsroomPosts).where(eq(newsroomPosts.slug, slug)).limit(1)
    const post = await populateOne(row, POST_REFS)
    if (!post) return err('Post not found')
    return ok(post)
  } catch (e) { return err(e) }
})

function generateSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

server.tool('create_post', 'Create a new newsroom post. If slug is not provided, it is auto-generated from the title.', {
  title: z.string().describe('Post headline'),
  slug: z.string().optional().describe('URL slug. Auto-generated from title if omitted. Must be unique and URL-safe.'),
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
  dark: z.boolean().optional().describe('Whether the post uses dark mode styling'),
  status: z.enum(['draft', 'published']).optional().describe('Publication status. Defaults to published.'),
  oxyUserId: z.string().optional().describe('Oxy user ID of the author'),
  metaTitle: z.string().optional().describe('SEO title override. Falls back to post title if not set.'),
  ogImage: z.string().optional().describe('Media document ID for the Open Graph image. Falls back to coverImage if not set.'),
  publishedAt: z.string().optional().describe('Publication date as ISO string (e.g. "2026-03-20"). Defaults to now.'),
}, async (params) => {
  try {
    let slug = params.slug || generateSlug(params.title)
    // Check uniqueness, append suffix on collision
    const [existing] = await db.select({ id: newsroomPosts._id }).from(newsroomPosts).where(eq(newsroomPosts.slug, slug)).limit(1)
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`
    }
    const [post] = await db
      .insert(newsroomPosts)
      .values({
        ...params,
        slug,
        publishedAt: params.publishedAt ? new Date(params.publishedAt) : new Date(),
        oxyUserId: params.oxyUserId || 'mcp-admin',
      } as never)
      .returning()
    return ok(await populateOne(post, POST_REFS))
  } catch (e) { return err(e) }
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
    if (!post) return err('Post not found')
    return ok(post)
  } catch (e) { return err(e) }
})

server.tool('delete_post', 'Permanently delete a newsroom post by slug. This action cannot be undone.', {
  slug: z.string().describe('The URL slug of the post to delete'),
}, async ({ slug }) => {
  try {
    const [post] = await db.delete(newsroomPosts).where(eq(newsroomPosts.slug, slug)).returning({ id: newsroomPosts._id })
    if (!post) return err('Post not found')
    return ok({ deleted: true, slug })
  } catch (e) { return err(e) }
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
  } catch (e) { return err(e) }
})

// ── Pricing ─────────────────────────────────────────────────────────────────

server.tool('get_pricing', 'Get all pricing plans', {}, async () => {
  try {
    const plans = await db.select().from(pricingPlans).orderBy(asc(pricingPlans.order), asc(pricingPlans._id))
    return ok(plans)
  } catch (e) { return err(e) }
})

const pricingPlanSchema = z.object({
  name: z.string(),
  price: z.object({ monthly: z.number(), annual: z.number() }),
  description: z.string().optional(),
  features: z.array(z.string()).optional(),
  cta: z.string().optional(),
  highlighted: z.boolean().optional(),
  order: z.number().optional(),
})

server.tool('replace_pricing', 'Replace all pricing plans', {
  plans: z.array(pricingPlanSchema),
}, async ({ plans }) => {
  try {
    const result = await db.transaction(async (tx) => {
      await tx.delete(pricingPlans)
      if (plans.length === 0) return []
      return tx.insert(pricingPlans).values(plans as never).returning()
    })
    return ok(result)
  } catch (e) { return err(e) }
})

// ── Testimonials ────────────────────────────────────────────────────────────

server.tool('get_testimonials', 'Get all testimonials', {}, async () => {
  try {
    const rows = await db.select().from(testimonialsTable).orderBy(asc(testimonialsTable.order), asc(testimonialsTable._id))
    return ok(rows)
  } catch (e) { return err(e) }
})

const testimonialSchema = z.object({
  quote: z.string(),
  author: z.string(),
  role: z.string().optional(),
  company: z.string().optional(),
  avatar: z.string().optional(),
  order: z.number().optional(),
})

server.tool('replace_testimonials', 'Replace all testimonials', {
  testimonials: z.array(testimonialSchema),
}, async ({ testimonials }) => {
  try {
    const result = await db.transaction(async (tx) => {
      await tx.delete(testimonialsTable)
      if (testimonials.length === 0) return []
      return tx.insert(testimonialsTable).values(testimonials as never).returning()
    })
    return ok(result)
  } catch (e) { return err(e) }
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
  } catch (e) { return err(e) }
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
  } catch (e) { return err(e) }
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
    if (!entry) return err('Changelog entry not found')
    return ok(entry)
  } catch (e) { return err(e) }
})

server.tool('delete_changelog_entry', 'Permanently delete a changelog entry by ID.', {
  id: z.string().describe('The _id of the changelog entry to delete'),
}, async ({ id }) => {
  try {
    const entry = (await db.delete(changelogEntries).where(eq(changelogEntries._id, id)).returning({ id: changelogEntries._id }))[0]
    if (!entry) return err('Changelog entry not found')
    return ok({ deleted: true, id })
  } catch (e) { return err(e) }
})

// ── Tracked Repos (GitHub Sync) ─────────────────────────────────────────────

server.tool('list_tracked_repos', 'List GitHub repos tracked for automatic changelog sync. Shows sync status and configuration.', {}, async () => {
  try {
    const repos = await db.select().from(trackedRepos).orderBy(asc(trackedRepos.displayName), asc(trackedRepos._id))
    return ok(repos)
  } catch (e) { return err(e) }
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
  } catch (e) { return err(e) }
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
    if (!tracked) return err('Tracked repo not found')
    return ok(tracked)
  } catch (e) { return err(e) }
})

server.tool('remove_tracked_repo', 'Remove a tracked GitHub repo. Does not delete existing changelog entries from that repo.', {
  id: z.string().describe('The _id of the tracked repo to remove'),
}, async ({ id }) => {
  try {
    const tracked = (await db.delete(trackedRepos).where(eq(trackedRepos._id, id)).returning({ id: trackedRepos._id }))[0]
    if (!tracked) return err('Tracked repo not found')
    return ok({ deleted: true, id })
  } catch (e) { return err(e) }
})

server.tool('sync_repo', 'Manually trigger a sync for a single tracked repo. Fetches new GitHub releases and creates changelog entries.', {
  id: z.string().describe('The _id of the tracked repo to sync'),
}, async ({ id }) => {
  try {
    const count = await syncSingleRepo(id)
    return ok({ synced: count })
  } catch (e) { return err(e) }
})

server.tool('sync_all_repos', 'Manually trigger a sync for all active tracked repos.', {}, async () => {
  try {
    await syncAllRepos()
    return ok({ ok: true, message: 'Sync complete' })
  } catch (e) { return err(e) }
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
  } catch (e) { return err(e) }
})

server.tool('get_job', 'Get a single job listing by its URL slug.', {
  slug: z.string().describe('The URL slug of the job listing'),
}, async ({ slug }) => {
  try {
    const job = (await db.select().from(jobs).where(eq(jobs.slug, slug)).limit(1))[0]
    if (!job) return err('Job not found')
    return ok(job)
  } catch (e) { return err(e) }
})

server.tool('create_job', 'Create a new job listing. Slug is auto-generated from title + location if not provided.', {
  title: z.string().describe('Job title, e.g. "Senior Frontend Engineer"'),
  department: z.string().describe('Department, e.g. "Engineering", "Design", "Sales"'),
  slug: z.string().optional().describe('URL slug. Auto-generated from title + location if omitted.'),
  subtitle: z.string().optional().describe('Short tagline for the role'),
  location: z.string().optional().describe('Job location, e.g. "Remote", "New York", "London"'),
  type: z.string().optional().describe('Employment type, e.g. "Full-time", "Part-time", "Contract"'),
  compensation: z.string().optional().describe('Compensation range, e.g. "$80K – $120K · Offers Equity"'),
  description: z.array(descriptionBlockSchema).optional().describe('Job description as content blocks (paragraph, heading, or list)'),
  active: z.boolean().optional().describe('Whether the job is visible on the careers page. Defaults to true.'),
  order: z.number().optional().describe('Display order (lower = first). Defaults to 0.'),
}, async (params) => {
  try {
    const job = await insertOne(jobs, params)
    return ok(job)
  } catch (e) { return err(e) }
})

server.tool('update_job', 'Update an existing job listing by slug. Only provided fields are changed.', {
  slug: z.string().describe('Current slug of the job to update'),
  title: z.string().optional().describe('Job title'),
  department: z.string().optional().describe('Department'),
  subtitle: z.string().optional().describe('Short tagline for the role'),
  location: z.string().optional().describe('Job location'),
  type: z.string().optional().describe('Employment type'),
  compensation: z.string().optional().describe('Compensation range'),
  description: z.array(descriptionBlockSchema).optional().describe('Job description as content blocks'),
  active: z.boolean().optional().describe('Whether the job is visible'),
  order: z.number().optional().describe('Display order'),
}, async ({ slug, ...updates }) => {
  try {
    const job = (await db.update(jobs).set({ ...updates, updatedAt: new Date() } as never).where(eq(jobs.slug, slug)).returning())[0]
    if (!job) return err('Job not found')
    return ok(job)
  } catch (e) { return err(e) }
})

server.tool('delete_job', 'Permanently delete a job listing by slug.', {
  slug: z.string().describe('The URL slug of the job to delete'),
}, async ({ slug }) => {
  try {
    const job = (await db.delete(jobs).where(eq(jobs.slug, slug)).returning({ id: jobs._id }))[0]
    if (!job) return err('Job not found')
    return ok({ deleted: true, slug })
  } catch (e) { return err(e) }
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
  } catch (e) { return err(e) }
})

server.tool('get_team_member', 'Get a team member by slug.', {
  slug: z.string().describe('The URL slug of the team member'),
}, async ({ slug }) => {
  try {
    const [row] = await db.select().from(teamMembers).where(eq(teamMembers.slug, slug)).limit(1)
    const member = await populateOne(row, { avatar: media })
    if (!member) return err('Team member not found')
    return ok(member)
  } catch (e) { return err(e) }
})

server.tool('create_team_member', 'Create a new team member.', {
  name: z.string().describe('Full name'),
  slug: z.string().optional().describe('URL slug. Auto-generated from name if omitted.'),
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
}, async (params) => {
  try {
    const member = await insertOne(teamMembers, params)
    return ok(member)
  } catch (e) { return err(e) }
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
    if (!member) return err('Team member not found')
    return ok(member)
  } catch (e) { return err(e) }
})

server.tool('delete_team_member', 'Delete a team member by slug.', {
  slug: z.string().describe('The slug of the team member to delete'),
}, async ({ slug }) => {
  try {
    const member = (await db.delete(teamMembers).where(eq(teamMembers.slug, slug)).returning({ id: teamMembers._id }))[0]
    if (!member) return err('Team member not found')
    return ok({ deleted: true, slug })
  } catch (e) { return err(e) }
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
  } catch (e) { return err(e) }
})

server.tool('get_media', 'Get a single media item by ID.', {
  id: z.string().describe('The _id of the media item'),
}, async ({ id }) => {
  try {
    const [row] = await db.select().from(media).where(eq(media._id, id)).limit(1)
    if (!row) return err('Media not found')
    return ok(row)
  } catch (e) { return err(e) }
})

server.tool('update_media', 'Update media metadata (alt text, tags, folder).', {
  id: z.string().describe('The _id of the media item'),
  alt: z.string().optional().describe('Alt text for the image'),
  tags: z.array(z.string()).optional().describe('Tags for organization'),
  folder: z.string().optional().describe('Logical folder name'),
}, async ({ id, ...updates }) => {
  try {
    const [row] = await db.update(media).set({ ...updates, updatedAt: new Date() } as never).where(eq(media._id, id)).returning()
    if (!row) return err('Media not found')
    return ok(row)
  } catch (e) { return err(e) }
})

server.tool('delete_media', 'Delete a media item from S3 and the database.', {
  id: z.string().describe('The _id of the media item to delete'),
}, async ({ id }) => {
  try {
    const [row] = await db.select().from(media).where(eq(media._id, id)).limit(1)
    if (!row) return err('Media not found')

    // Thumbnails are stored as absolute CDN URLs; derive each S3 object key from
    // the URL path. An unparseable URL has no key to delete, so record it —
    // silently skipping would orphan the object in the bucket.
    const keys = [row.key]
    for (const url of [row.thumbnails?.sm, row.thumbnails?.md, row.thumbnails?.lg]) {
      if (!url) continue
      try {
        const key = new URL(url).pathname.slice(1)
        if (key) keys.push(key)
      } catch {
        console.warn(`[mcp] delete_media: unparseable thumbnail URL for media ${id}, object may be orphaned: ${url}`)
      }
    }

    await Promise.allSettled(keys.map(k => deleteFromSpaces(k)))
    await db.delete(media).where(eq(media._id, id))
    return ok({ deleted: true, id })
  } catch (e) { return err(e) }
})

// ── Settings ────────────────────────────────────────────────────────────────

server.tool('get_settings', 'Get site settings', {}, async () => {
  try {
    const [settings] = await db.select().from(siteSettings).limit(1)
    return ok(settings ?? { siteTitle: 'Oxy', siteDescription: '', ogImage: '', banner: null })
  } catch (e) { return err(e) }
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
  } catch (e) { return err(e) }
})

// ── Locales ─────────────────────────────────────────────────────────────────

server.tool('list_locales', 'List all locales (both enabled and disabled). Locales control which languages the site supports.', {}, async () => {
  try {
    const rows = await db.select().from(locales).orderBy(asc(locales.order), asc(locales._id))
    return ok(rows)
  } catch (e) { return err(e) }
})

server.tool('create_locale', 'Create a new locale for the site. Translations can then be added for this locale.', {
  code: z.string().describe('BCP-47 language code, e.g. "en-US", "es-ES", "ca-ES", "fr-FR", "ja-JP"'),
  slug: z.string().optional().describe('URL slug for this locale. Auto-generated from code if omitted (e.g. "en-us").'),
  name: z.string().describe('English name of the language, e.g. "Spanish"'),
  nativeName: z.string().describe('Name in the native language, e.g. "Español"'),
  isDefault: z.boolean().optional().describe('Set as the default locale. Only one locale can be default.'),
  enabled: z.boolean().optional().describe('Whether this locale is active on the site. Defaults to true.'),
  order: z.number().optional().describe('Display order in locale switcher (lower = first)'),
}, async (params) => {
  try {
    if (params.isDefault) {
      await db.update(locales).set({ isDefault: false })
    }
    const locale = await insertOne(locales, params)
    return ok(locale)
  } catch (e) { return err(e) }
})

server.tool('update_locale', 'Update a locale by its code. Only provided fields are changed.', {
  code: z.string().describe('The locale code to update, e.g. "es-ES"'),
  slug: z.string().optional().describe('URL slug for this locale'),
  name: z.string().optional().describe('English name'),
  nativeName: z.string().optional().describe('Native name'),
  isDefault: z.boolean().optional().describe('Set as default locale'),
  enabled: z.boolean().optional().describe('Enable or disable this locale'),
  order: z.number().optional().describe('Display order'),
}, async ({ code, ...updates }) => {
  try {
    if (updates.isDefault) {
      await db.update(locales).set({ isDefault: false })
    }
    const locale = (await db.update(locales).set({ ...updates, updatedAt: new Date() } as never).where(eq(locales.code, code)).returning())[0]
    if (!locale) return err('Locale not found')
    return ok(locale)
  } catch (e) { return err(e) }
})

server.tool('delete_locale', 'Delete a locale and all its translations. Cannot delete the default locale.', {
  code: z.string().describe('The locale code to delete, e.g. "es"'),
}, async ({ code }) => {
  try {
    const locale = (await db.select().from(locales).where(eq(locales.code, code)).limit(1))[0]
    if (!locale) return err('Locale not found')
    if (locale.isDefault) return err('Cannot delete the default locale')
    // One transaction: a locale row without its translations, or the reverse,
    // leaves the admin listing content that is already gone.
    const removed = await db.transaction(async (tx) => {
      await tx.delete(locales).where(eq(locales.code, code))
      return tx.delete(translations).where(eq(translations.locale, code)).returning({ id: translations._id })
    })
    const deletedCount = removed.length
    return ok({ deleted: true, code, translationsRemoved: deletedCount })
  } catch (e) { return err(e) }
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
    return ok(translations)
  } catch (e) { return err(e) }
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
    if (!translation) return err('Translation not found')
    return ok(translation)
  } catch (e) { return err(e) }
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
  } catch (e) { return err(e) }
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
    if (!translation) return err('Translation not found')
    return ok({ deleted: true })
  } catch (e) { return err(e) }
})

// ── Upload ──────────────────────────────────────────────────────────────────

server.tool('upload_image', 'Download an image from a URL, upload it to S3, generate thumbnails, and create a Media document. Returns the full Media object.', {
  url: z.string().describe('Source URL of the image to download'),
  filename: z.string().optional().describe('Desired filename. Auto-derived from URL if omitted.'),
  folder: z.string().optional().describe('Subfolder within oxy-website/ (e.g. "newsroom"). Defaults to "images".'),
  alt: z.string().optional().describe('Alt text for the image'),
  tags: z.array(z.string()).optional().describe('Tags for organization'),
}, async (params) => {
  try {
    const { buffer, contentType } = await downloadUrl(params.url)
    const filename = params.filename || new URL(params.url).pathname.split('/').pop() || 'image'
    const subfolder = params.folder || 'images'
    const folder = `oxy-website/${subfolder}`

    const cdnUrl = await uploadToSpaces(buffer, filename, contentType, folder)
    const key = new URL(cdnUrl).pathname.slice(1)

    let width: number | undefined
    let height: number | undefined
    let thumbnails = { sm: '', md: '', lg: '' }
    try {
      const result = await processImage(buffer, filename, contentType, folder)
      width = result.width
      height = result.height
      thumbnails = result.thumbnails
    } catch {
      // Thumbnail generation is optional
    }

    const row = await insertOne(media, {
      url: cdnUrl, thumbnails, filename, key,
      mimeType: contentType, size: buffer.length,
      width, height,
      alt: params.alt || '',
      tags: params.tags || [],
      folder: subfolder,
      uploadedBy: 'mcp',
    })
    return ok(media)
  } catch (e) { return err(e) }
})

server.tool('upload_and_set_post_cover', 'Download an image from URL, upload to S3, create Media document, and set it as the coverImage on a newsroom post. All in one step.', {
  postSlug: z.string().describe('Slug of the post to update'),
  imageUrl: z.string().describe('Source URL of the image to download'),
  filename: z.string().optional().describe('Desired filename. Auto-derived from URL if omitted.'),
  alt: z.string().optional().describe('Alt text for the image'),
}, async (params) => {
  try {
    // 1. Download
    const { buffer, contentType } = await downloadUrl(params.imageUrl)
    const filename = params.filename || new URL(params.imageUrl).pathname.split('/').pop() || 'cover.jpg'

    // 2. Upload to S3
    const cdnUrl = await uploadToSpaces(buffer, filename, contentType, 'oxy-website/newsroom')
    const key = new URL(cdnUrl).pathname.slice(1)

    // 3. Thumbnails (optional)
    let width: number | undefined
    let height: number | undefined
    let thumbnails = { sm: '', md: '', lg: '' }
    try {
      const result = await processImage(buffer, filename, contentType, 'oxy-website/newsroom')
      width = result.width; height = result.height; thumbnails = result.thumbnails
    } catch { /* thumbnails are optional */ }

    // 4. Create Media document
    const [mediaRow] = await db
      .insert(media)
      .values({
        url: cdnUrl, thumbnails, filename, key,
        mimeType: contentType, size: buffer.length, width, height,
        alt: params.alt || '', tags: ['newsroom'], folder: 'newsroom',
        uploadedBy: 'mcp',
      })
      .returning()

    // 5. Update the post
    const [row] = await db
      .update(newsroomPosts)
      .set({ coverImage: mediaRow._id, imageAlt: params.alt || '', updatedAt: new Date() })
      .where(eq(newsroomPosts.slug, params.postSlug))
      .returning()
    const post = await populateOne(row, POST_REFS)
    if (!post) return err(`Post not found: ${params.postSlug}`)

    return ok({ media: mediaRow, post })
  } catch (e) { return err(e) }
})

server.tool('upload_and_set_team_avatar', 'Download an image, upload to S3, create Media document, and set it as a team member avatar.', {
  memberSlug: z.string().describe('Slug of the team member to update'),
  imageUrl: z.string().describe('Source URL of the image to download'),
  filename: z.string().optional(),
  alt: z.string().optional(),
}, async (params) => {
  try {
    const { buffer, contentType } = await downloadUrl(params.imageUrl)
    const filename = params.filename || new URL(params.imageUrl).pathname.split('/').pop() || 'avatar.jpg'

    const cdnUrl = await uploadToSpaces(buffer, filename, contentType, 'oxy-website/team')
    const key = new URL(cdnUrl).pathname.slice(1)

    let width: number | undefined
    let height: number | undefined
    let thumbnails = { sm: '', md: '', lg: '' }
    try {
      const result = await processImage(buffer, filename, contentType, 'oxy-website/team')
      width = result.width; height = result.height; thumbnails = result.thumbnails
    } catch { /* optional */ }

    const mediaRow = await insertOne(media, {
      url: cdnUrl, thumbnails, filename, key,
      mimeType: contentType, size: buffer.length, width, height,
      alt: params.alt || '', tags: ['team'], folder: 'team',
      uploadedBy: 'mcp',
    })

    const [row] = await db
      .update(teamMembers)
      .set({ avatar: mediaRow._id as string, updatedAt: new Date() })
      .where(eq(teamMembers.slug, params.memberSlug))
      .returning()
    const member = await populateOne(row, { avatar: media })
    if (!member) return err(`Team member not found: ${params.memberSlug}`)

    return ok({ media: mediaRow, member })
  } catch (e) { return err(e) }
})

server.tool('bulk_upload_post_covers', 'Upload cover images for multiple posts in one call. Each entry maps a post slug to an image URL.', {
  posts: z.array(z.object({
    slug: z.string().describe('Post slug'),
    imageUrl: z.string().describe('Source URL of the cover image'),
    alt: z.string().optional().describe('Alt text'),
  })).describe('Array of posts with their cover image URLs'),
}, async ({ posts }) => {
  const results: { slug: string; status: string; mediaId?: string; error?: string }[] = []
  for (const p of posts) {
    try {
      const { buffer, contentType } = await downloadUrl(p.imageUrl)
      const filename = new URL(p.imageUrl).pathname.split('/').pop() || 'cover.jpg'

      const cdnUrl = await uploadToSpaces(buffer, filename, contentType, 'oxy-website/newsroom')
      const key = new URL(cdnUrl).pathname.slice(1)

      let width: number | undefined, height: number | undefined, thumbnails = { sm: '', md: '', lg: '' }
      try {
        const r = await processImage(buffer, filename, contentType, 'oxy-website/newsroom')
        width = r.width
        height = r.height
        thumbnails = r.thumbnails
      } catch {
        // Thumbnail generation is optional
      }

      const [mediaRow] = await db
        .insert(media)
        .values({
          url: cdnUrl, thumbnails, filename, key,
          mimeType: contentType, size: buffer.length, width, height,
          alt: p.alt || '', tags: ['newsroom'], folder: 'newsroom', uploadedBy: 'mcp',
        })
        .returning()

      await db
        .update(newsroomPosts)
        .set({ coverImage: mediaRow._id, imageAlt: p.alt || '', updatedAt: new Date() })
        .where(eq(newsroomPosts.slug, p.slug))
      results.push({ slug: p.slug, status: 'ok', mediaId: mediaRow._id })
    } catch (e) {
      results.push({ slug: p.slug, status: 'error', error: e instanceof Error ? e.message : String(e) })
    }
  }
  return ok(results)
})

server.tool('get_post_with_media', 'Get a newsroom post with its cover image and OG image fully resolved to URLs.', {
  slug: z.string().describe('Post slug'),
}, async ({ slug }) => {
  try {
    const [row] = await db.select().from(newsroomPosts).where(eq(newsroomPosts.slug, slug)).limit(1)
    const post = await populateOne(row, POST_REFS)
    if (!post) return err('Post not found')
    return ok(post)
  } catch (e) { return err(e) }
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
  } catch (e) { return err(e) }
})

server.tool('get_category', 'Get a single category by slug.', {
  slug: z.string().describe('Category slug'),
}, async ({ slug }) => {
  try {
    const doc = (await db.select().from(categories).where(eq(categories.slug, slug)).limit(1))[0]
    if (!doc) return err('Category not found')
    return ok(doc)
  } catch (e) { return err(e) }
})

server.tool('create_category', 'Create a new category. Categories are reusable grouping labels referenced by products, navbar dropdowns, etc.', categoryRawShape, async (input) => {
  try {
    const [existing] = await db.select({ id: categories._id }).from(categories).where(eq(categories.slug, input.slug)).limit(1)
    if (existing) return err(`Category "${input.slug}" already exists`)
    const doc = await insertOne(categories, input)
    return ok(doc)
  } catch (e) { return err(e) }
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
    if (!doc) return err('Category not found')
    return ok(doc)
  } catch (e) { return err(e) }
})

server.tool('delete_category', 'Permanently delete a category. Products or nav items still pointing at it will need to be re-assigned.', {
  slug: z.string().describe('Slug of the category to delete'),
}, async ({ slug }) => {
  try {
    const doc = (await db.delete(categories).where(eq(categories.slug, slug)).returning({ id: categories._id }))[0]
    if (!doc) return err('Category not found')
    return ok({ deleted: true, slug })
  } catch (e) { return err(e) }
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
  } catch (e) { return err(e) }
})

server.tool('get_product', 'Get a single product by its productId.', {
  productId: z.string().describe('Stable product id (e.g. "alia", "mention")'),
}, async ({ productId }) => {
  try {
    const [row] = await db.select().from(products).where(eq(products.productId, productId)).limit(1)
    const product = await populateOne(row, { logo: media })
    if (!product) return err('Product not found')
    return ok(product)
  } catch (e) { return err(e) }
})

server.tool('create_product', 'Create a new product. By default it appears on /technologies, /status, and the ecosystem navbar dropdown.', productRawShape, async (input) => {
  try {
    const [existing] = await db.select({ id: products._id }).from(products).where(eq(products.productId, input.productId)).limit(1)
    if (existing) return err(`Product "${input.productId}" already exists`)
    const product = await insertOne(products, input)
    return ok(product)
  } catch (e) { return err(e) }
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
    if (!product) return err('Product not found')
    return ok(product)
  } catch (e) { return err(e) }
})

server.tool('delete_product', 'Permanently delete a product. This action cannot be undone.', {
  productId: z.string().describe('Stable product id to delete'),
}, async ({ productId }) => {
  try {
    const doc = (await db.delete(products).where(eq(products.productId, productId)).returning({ id: products._id }))[0]
    if (!doc) return err('Product not found')
    return ok({ deleted: true, productId })
  } catch (e) { return err(e) }
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
  } catch (e) { return err(e) }
})

server.tool('get_course', 'Get a single Academy course by its URL slug, including its lessons and populated cover image / category.', {
  slug: z.string().describe('The URL slug of the course'),
}, async ({ slug }) => {
  try {
    const [courseRow] = await db.select().from(courses).where(eq(courses.slug, slug)).limit(1)
    const course = await populateOne(courseRow, CONTENT_REFS)
    if (!course) return err('Course not found')
    return ok(course)
  } catch (e) { return err(e) }
})

server.tool('create_course', 'Create a new Academy course. Auto-generates the slug from the title if none is provided.', {
  title: z.string().describe('Course title'),
  slug: z.string().optional().describe('URL slug. Auto-generated from title if omitted.'),
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
}, async (params) => {
  try {
    let slug = params.slug || generateSlug(params.title)
    const [existing] = await db.select({ id: courses._id }).from(courses).where(eq(courses.slug, slug)).limit(1)
    if (existing) slug = `${slug}-${Date.now().toString(36)}`
    const { publishedAt, coverImage, category, ...rest } = params
    const [courseCreated] = await db.insert(courses).values({
      ...rest,
      slug,
      coverImage: coverImage && coverImage.length > 0 ? coverImage : null,
      category: category && category.length > 0 ? category : null,
      publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
    })
    const populated = await populateOne(courseCreated, CONTENT_REFS)
    return ok(populated)
  } catch (e) { return err(e) }
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
    if (!course) return err('Course not found')
    return ok(course)
  } catch (e) { return err(e) }
})

server.tool('delete_course', 'Permanently delete an Academy course by slug. Cannot be undone.', {
  slug: z.string().describe('The URL slug of the course to delete'),
}, async ({ slug }) => {
  try {
    const [course] = await db.delete(courses).where(eq(courses.slug, slug)).returning({ id: courses._id })
    if (!course) return err('Course not found')
    return ok({ deleted: true, slug })
  } catch (e) { return err(e) }
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
  } catch (e) { return err(e) }
})

server.tool('get_resource', 'Get a single Academy resource by its URL slug.', {
  slug: z.string().describe('The URL slug of the resource'),
}, async ({ slug }) => {
  try {
    const [resourceRow] = await db.select().from(resources).where(eq(resources.slug, slug)).limit(1)
    const resource = await populateOne(resourceRow, CONTENT_REFS)
    if (!resource) return err('Resource not found')
    return ok(resource)
  } catch (e) { return err(e) }
})

server.tool('create_resource', 'Create a new Academy resource. Auto-generates the slug from the title if none is provided.', {
  title: z.string().describe('Resource title'),
  slug: z.string().optional().describe('URL slug. Auto-generated from title if omitted.'),
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
}, async (params) => {
  try {
    let slug = params.slug || generateSlug(params.title)
    const [existing] = await db.select({ id: resources._id }).from(resources).where(eq(resources.slug, slug)).limit(1)
    if (existing) slug = `${slug}-${Date.now().toString(36)}`
    const { publishedAt, coverImage, category, ...rest } = params
    const [resourceCreated] = await db.insert(resources).values({
      ...rest,
      slug,
      coverImage: coverImage && coverImage.length > 0 ? coverImage : null,
      category: category && category.length > 0 ? category : null,
      publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
    })
    const populated = await populateOne(resourceCreated, CONTENT_REFS)
    return ok(populated)
  } catch (e) { return err(e) }
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
    if (!resource) return err('Resource not found')
    return ok(resource)
  } catch (e) { return err(e) }
})

server.tool('delete_resource', 'Permanently delete an Academy resource by slug. Cannot be undone.', {
  slug: z.string().describe('The URL slug of the resource to delete'),
}, async ({ slug }) => {
  try {
    const [resource] = await db.delete(resources).where(eq(resources.slug, slug)).returning({ id: resources._id })
    if (!resource) return err('Resource not found')
    return ok({ deleted: true, slug })
  } catch (e) { return err(e) }
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
  } catch (e) { return err(e) }
})

server.tool('get_help_article', 'Get a single Help Center article by its URL slug, including populated cover image and category.', {
  slug: z.string().describe('The URL slug of the help article'),
}, async ({ slug }) => {
  try {
    const [articleRow] = await db.select().from(helpArticles).where(eq(helpArticles.slug, slug)).limit(1)
    const article = await populateOne(articleRow, CONTENT_REFS)
    if (!article) return err('Help article not found')
    return ok(article)
  } catch (e) { return err(e) }
})

server.tool('create_help_article', 'Create a new Help Center article. Auto-generates the slug from the title if none is provided.', {
  title: z.string().describe('Article title'),
  slug: z.string().optional().describe('URL slug. Auto-generated from title if omitted.'),
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
}, async (params) => {
  try {
    let slug = params.slug || generateSlug(params.title)
    const [existing] = await db.select({ id: helpArticles._id }).from(helpArticles).where(eq(helpArticles.slug, slug)).limit(1)
    if (existing) slug = `${slug}-${Date.now().toString(36)}`
    const { publishedAt, coverImage, category, ...rest } = params
    const [articleCreated] = await db.insert(helpArticles).values({
      ...rest,
      slug,
      coverImage: coverImage && coverImage.length > 0 ? coverImage : null,
      category: category && category.length > 0 ? category : null,
      publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
    })
    const populated = await populateOne(articleCreated, CONTENT_REFS)
    return ok(populated)
  } catch (e) { return err(e) }
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
    if (!article) return err('Help article not found')
    return ok(article)
  } catch (e) { return err(e) }
})

server.tool('delete_help_article', 'Permanently delete a Help Center article by slug. Cannot be undone.', {
  slug: z.string().describe('The URL slug of the article to delete'),
}, async ({ slug }) => {
  try {
    const [article] = await db.delete(helpArticles).where(eq(helpArticles.slug, slug)).returning({ id: helpArticles._id })
    if (!article) return err('Help article not found')
    return ok({ deleted: true, slug })
  } catch (e) { return err(e) }
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
  } catch (e) { return err(e) }
})

server.tool('get_referral', 'Get a single referral by its code.', {
  code: z.string().describe('Unique referral code'),
}, async ({ code }) => {
  try {
    const [referral] = await db.select().from(referrals).where(eq(referrals.code, code)).limit(1)
    if (!referral) return err('Referral not found')
    return ok(referral)
  } catch (e) { return err(e) }
})

server.tool('create_referral', 'Create a new referral code. Defaults to type="user" and status="active".', referralRawShape, async (input) => {
  try {
    const [existing] = await db.select({ id: referrals._id }).from(referrals).where(eq(referrals.code, input.code)).limit(1)
    if (existing) return err(`Referral "${input.code}" already exists`)
    const referral = await insertOne(referrals, input)
    return ok(referral)
  } catch (e) { return err(e) }
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
    if (!referral) return err('Referral not found')
    return ok(referral)
  } catch (e) { return err(e) }
})

server.tool('delete_referral', 'Permanently delete a referral code. This action cannot be undone.', {
  code: z.string().describe('Referral code to delete'),
}, async ({ code }) => {
  try {
    const [doc] = await db.delete(referrals).where(eq(referrals.code, code)).returning({ id: referrals._id })
    if (!doc) return err('Referral not found')
    return ok({ deleted: true, code })
  } catch (e) { return err(e) }
})

} // end registerTools

// ── Mount on Express app ────────────────────────────────────────────────────

async function validateToken(token: string): Promise<boolean> {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  const now = new Date()
  const [mcpToken] = await db
    .select({ id: mcpTokens._id })
    .from(mcpTokens)
    .where(
      and(
        eq(mcpTokens.tokenHash, tokenHash),
        eq(mcpTokens.revoked, false),
        // A token with no expiry never expires; one with an expiry must still
        // be in the future.
        or(sql`${mcpTokens.expiresAt} is null`, gte(mcpTokens.expiresAt, now)),
      ),
    )
    .limit(1)
  if (!mcpToken) return false
  await db.update(mcpTokens).set({ lastUsedAt: now }).where(eq(mcpTokens._id, mcpToken.id))
  return true
}

/**
 * Validates the bearer token carried in the Authorization header. Responds 401
 * and returns false when it is missing or invalid, so callers can bail early.
 * The token is only ever read from the header — never from the query string.
 */
async function requireMcpToken(req: express.Request, res: express.Response): Promise<boolean> {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token || !(await validateToken(token))) {
    res.status(401).json({ error: 'Invalid or expired token' })
    return false
  }
  return true
}

/** Sessions untouched for longer than this are swept along with their McpServer. */
const MCP_SESSION_TTL_MS = 30 * 60 * 1000

interface McpSession {
  transport: StreamableHTTPServerTransport
  lastSeen: number
}

const SESSION_NOT_FOUND = {
  jsonrpc: '2.0',
  error: {
    code: -32001,
    message: 'Session not found. Re-initialize the MCP connection.',
  },
  id: null,
} as const

export function mountMcp(app: express.Express) {
  const sessions = new Map<string, McpSession>()

  /** Returns the live transport for a session id, refreshing its last-seen stamp. */
  const touch = (sessionId: string | undefined): StreamableHTTPServerTransport | undefined => {
    const session = sessionId ? sessions.get(sessionId) : undefined
    if (!session) return undefined
    session.lastSeen = Date.now()
    return session.transport
  }

  // An unclean disconnect never fires onclose, so entries would otherwise pin a
  // transport plus its per-session McpServer forever. Swept on each new session.
  const sweepExpiredSessions = () => {
    const cutoff = Date.now() - MCP_SESSION_TTL_MS
    for (const [id, session] of sessions) {
      if (session.lastSeen < cutoff) {
        sessions.delete(id)
        session.transport.close().catch(e => {
          console.error(`[mcp] failed to close expired transport ${id}:`, e)
        })
      }
    }
  }

  app.post('/mcp', async (req, res) => {
    if (!(await requireMcpToken(req, res))) return

    const sessionId = req.headers['mcp-session-id'] as string | undefined

    // Existing session — route to its live transport
    const existing = touch(sessionId)
    if (existing) {
      await existing.handleRequest(req, res)
      return
    }

    // mountMcp runs before express.json(), so req.body is always undefined here
    // and this handler cannot tell an initialize request from any other one.
    // Consequently a request bearing a session id we don't know about (server
    // restart, transport GC, unclean disconnect) always gets the re-initialize
    // error; only a request with no session id at all opens a new session.
    if (sessionId) {
      res.status(404).json(SESSION_NOT_FOUND)
      return
    }

    // Fresh initialize request — spin up a new transport and register it
    sweepExpiredSessions()
    const mcpServer = createMcpServer()
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => crypto.randomUUID() })
    transport.onclose = () => {
      if (transport.sessionId) sessions.delete(transport.sessionId)
    }
    await mcpServer.connect(transport)
    await transport.handleRequest(req, res)
    if (transport.sessionId) {
      sessions.set(transport.sessionId, { transport, lastSeen: Date.now() })
    }
  })

  app.get('/mcp', async (req, res) => {
    if (!(await requireMcpToken(req, res))) return

    const transport = touch(req.headers['mcp-session-id'] as string | undefined)
    if (transport) {
      await transport.handleRequest(req, res)
      return
    }
    res.status(404).json(SESSION_NOT_FOUND)
  })

  app.delete('/mcp', async (req, res) => {
    if (!(await requireMcpToken(req, res))) return

    const sessionId = req.headers['mcp-session-id'] as string | undefined
    const transport = touch(sessionId)
    if (!sessionId || !transport) {
      res.status(400).json({ error: 'Invalid session' })
      return
    }
    await transport.handleRequest(req, res)
    sessions.delete(sessionId)
  })
}
