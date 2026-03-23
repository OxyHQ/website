import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import express from 'express'
import mongoose from 'mongoose'
import crypto from 'node:crypto'
import { z } from 'zod'
import { config } from './config.js'

// Models
import { Page } from './models/Page.js'
import { Navigation } from './models/Navigation.js'
import { Footer } from './models/Footer.js'
import { NewsroomPost } from './models/NewsroomPost.js'
import { PricingPlan } from './models/PricingPlan.js'
import { Testimonial } from './models/Testimonial.js'
import { ChangelogEntry } from './models/ChangelogEntry.js'
import { Job } from './models/Job.js'
import { SiteSettings } from './models/SiteSettings.js'
import { McpToken } from './models/McpToken.js'
import { Locale } from './models/Locale.js'
import { Translation } from './models/Translation.js'
import TrackedRepo from './models/TrackedRepo.js'
import { syncAllRepos, syncSingleRepo } from './services/githubSync.js'

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
  return { content: [{ type: 'text' as const, text: String(e) }], isError: true as const }
}

function registerTools(server: McpServer) {

// ── Pages ───────────────────────────────────────────────────────────────────

server.tool('list_pages', 'List all page slugs', {}, async () => {
  try {
    const pages = await Page.find({}, 'slug title').sort('slug')
    return ok(pages)
  } catch (e) { return err(e) }
})

server.tool('get_page', 'Get a page by slug', { slug: z.string() }, async ({ slug }) => {
  try {
    const page = await Page.findOne({ slug })
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
}, async (params) => {
  try {
    const page = await Page.findOneAndUpdate({ slug: params.slug }, params, { new: true, upsert: true })
    return ok(page)
  } catch (e) { return err(e) }
})

// ── Navigation ──────────────────────────────────────────────────────────────

server.tool('get_navigation', 'Get all navigation dropdowns', {}, async () => {
  try {
    const nav = await Navigation.find().sort('order')
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
    await Navigation.deleteMany({})
    const nav = await Navigation.insertMany(items)
    return ok(nav)
  } catch (e) { return err(e) }
})

// ── Footer ──────────────────────────────────────────────────────────────────

server.tool('get_footer', 'Get footer content', {}, async () => {
  try {
    const footer = await Footer.findOne()
    return ok(footer ?? { columns: [], socialLinks: [], copyright: '' })
  } catch (e) { return err(e) }
})

const footerLinkSchema = z.object({
  label: z.string(),
  href: z.string(),
  isNew: z.boolean().optional(),
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
    const footer = await Footer.findOneAndUpdate({}, params, { new: true, upsert: true })
    return ok(footer)
  } catch (e) { return err(e) }
})

// ── Newsroom ────────────────────────────────────────────────────────────────

server.tool('list_posts', 'List newsroom posts with optional filtering by category, tag, featured status, and publication status. Returns paginated results sorted by publishedAt descending.', {
  category: z.string().optional().describe('Filter by category. Common: Company, Research, Product, Safety, Engineering, Security'),
  tag: z.string().optional().describe('Filter by tag'),
  featured: z.boolean().optional().describe('Filter to only featured posts'),
  status: z.enum(['draft', 'published']).optional().describe('Filter by publication status. Omit to return all posts.'),
  search: z.string().optional().describe('Search posts by title or excerpt text'),
  limit: z.number().optional().describe('Results per page (default 20)'),
  page: z.number().optional().describe('Page number (default 1)'),
}, async (params) => {
  try {
    const filter: Record<string, unknown> = {}
    if (params.category) filter.category = params.category
    if (params.tag) filter.tags = params.tag
    if (params.featured) filter.featured = true
    if (params.status) filter.status = params.status

    if (params.search) {
      const regex = { $regex: params.search, $options: 'i' }
      filter.$or = [{ title: regex }, { excerpt: regex }]
    }

    const limit = params.limit ?? 20
    const page = params.page ?? 1
    const skip = (page - 1) * limit

    const [posts, total] = await Promise.all([
      NewsroomPost.find(filter).sort('-publishedAt').skip(skip).limit(limit),
      NewsroomPost.countDocuments(filter),
    ])
    return ok({ posts, total, page, pages: Math.ceil(total / limit) })
  } catch (e) { return err(e) }
})

server.tool('get_post', 'Get a single newsroom post by its URL slug. Returns full post content including markdown body.', {
  slug: z.string().describe('The URL slug of the post'),
}, async ({ slug }) => {
  try {
    const post = await NewsroomPost.findOne({ slug })
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
  excerpt: z.string().optional().describe('Short summary for cards/listings (1-2 sentences)'),
  content: z.string().optional().describe('Full post body in Markdown'),
  coverImage: z.string().optional().describe('URL for cover/hero image'),
  tags: z.array(z.string()).optional().describe('Tags for categorization, e.g. ["ai", "product-update"]'),
  category: z.string().optional().describe('Post category. Common: Company, Research, Product, Safety, Engineering, Security'),
  featured: z.boolean().optional().describe('Whether this post appears in the featured/hero section'),
  status: z.enum(['draft', 'published']).optional().describe('Publication status. Defaults to published.'),
  oxyUserId: z.string().optional().describe('Oxy user ID of the author'),
  metaTitle: z.string().optional().describe('SEO title override. Falls back to post title if not set.'),
  metaDescription: z.string().optional().describe('SEO meta description. Falls back to excerpt if not set.'),
  ogImage: z.string().optional().describe('Open Graph image URL. Falls back to coverImage if not set.'),
  publishedAt: z.string().optional().describe('Publication date as ISO string (e.g. "2026-03-20"). Defaults to now.'),
}, async (params) => {
  try {
    let slug = params.slug || generateSlug(params.title)
    // Check uniqueness, append suffix on collision
    const existing = await NewsroomPost.findOne({ slug })
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`
    }
    const post = await NewsroomPost.create({
      ...params,
      slug,
      publishedAt: params.publishedAt ? new Date(params.publishedAt) : new Date(),
      oxyUserId: params.oxyUserId || 'mcp-admin',
    })
    return ok(post)
  } catch (e) { return err(e) }
})

server.tool('update_post', 'Update an existing newsroom post by slug. Only the fields you provide will be changed; omitted fields remain unchanged.', {
  slug: z.string().describe('Current slug of the post to update'),
  newSlug: z.string().optional().describe('New slug to replace the current one. Must be unique.'),
  title: z.string().optional().describe('Post headline'),
  excerpt: z.string().optional().describe('Short summary for cards/listings (1-2 sentences)'),
  content: z.string().optional().describe('Full post body in Markdown'),
  coverImage: z.string().optional().describe('URL for cover/hero image'),
  tags: z.array(z.string()).optional().describe('Tags for categorization'),
  category: z.string().optional().describe('Post category'),
  featured: z.boolean().optional().describe('Whether this post appears in the featured/hero section'),
  status: z.enum(['draft', 'published']).optional().describe('Publication status'),
  oxyUserId: z.string().optional().describe('Oxy user ID of the author'),
  metaTitle: z.string().optional().describe('SEO title override'),
  metaDescription: z.string().optional().describe('SEO meta description'),
  ogImage: z.string().optional().describe('Open Graph image URL'),
  publishedAt: z.string().optional().describe('Publication date as ISO string'),
}, async ({ slug, newSlug, ...updates }) => {
  try {
    if (updates.publishedAt) (updates as any).publishedAt = new Date(updates.publishedAt)
    if (newSlug) (updates as any).slug = newSlug
    const post = await NewsroomPost.findOneAndUpdate({ slug }, updates, { new: true })
    if (!post) return err('Post not found')
    return ok(post)
  } catch (e) { return err(e) }
})

server.tool('delete_post', 'Permanently delete a newsroom post by slug. This action cannot be undone.', {
  slug: z.string().describe('The URL slug of the post to delete'),
}, async ({ slug }) => {
  try {
    const post = await NewsroomPost.findOneAndDelete({ slug })
    if (!post) return err('Post not found')
    return ok({ deleted: true, slug })
  } catch (e) { return err(e) }
})

server.tool('search_posts', 'Search newsroom posts by title or excerpt text. Returns posts matching the search query.', {
  query: z.string().describe('Search text to match against post titles and excerpts'),
  limit: z.number().optional().describe('Maximum results to return (default 10)'),
}, async (params) => {
  try {
    const regex = { $regex: params.query, $options: 'i' }
    const posts = await NewsroomPost.find({
      $or: [{ title: regex }, { excerpt: regex }],
    }).sort('-publishedAt').limit(params.limit ?? 10)
    return ok(posts)
  } catch (e) { return err(e) }
})

// ── Pricing ─────────────────────────────────────────────────────────────────

server.tool('get_pricing', 'Get all pricing plans', {}, async () => {
  try {
    const plans = await PricingPlan.find().sort('order')
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
    await PricingPlan.deleteMany({})
    const result = await PricingPlan.insertMany(plans)
    return ok(result)
  } catch (e) { return err(e) }
})

// ── Testimonials ────────────────────────────────────────────────────────────

server.tool('get_testimonials', 'Get all testimonials', {}, async () => {
  try {
    const testimonials = await Testimonial.find().sort('order')
    return ok(testimonials)
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
    await Testimonial.deleteMany({})
    const result = await Testimonial.insertMany(testimonials)
    return ok(result)
  } catch (e) { return err(e) }
})

// ── Changelog ───────────────────────────────────────────────────────────────

server.tool('list_changelog', 'List changelog entries with optional repo filter and pagination', {
  repo: z.string().optional().describe('Filter by repo, e.g. "owner/name" or just "name"'),
  limit: z.number().optional(),
  page: z.number().optional(),
}, async (params) => {
  try {
    const page = params.page ?? 1
    const limit = params.limit ?? 20
    const filter: Record<string, unknown> = {}
    if (params.repo) {
      const parts = params.repo.split('/')
      if (parts.length === 2) {
        filter.repoOwner = parts[0]
        filter.repoName = parts[1]
      } else {
        filter.repoName = params.repo
      }
    }
    const [entries, total] = await Promise.all([
      ChangelogEntry.find(filter).sort('-date').skip((page - 1) * limit).limit(limit),
      ChangelogEntry.countDocuments(filter),
    ])
    return ok({ entries, total, page, pages: Math.ceil(total / limit) })
  } catch (e) { return err(e) }
})

server.tool('create_changelog_entry', 'Create a new changelog entry', {
  title: z.string(),
  content: z.string().optional(),
  tags: z.array(z.string()).optional(),
  date: z.string(),
  items: z.array(z.string()).optional(),
  media: z.string().optional(),
}, async (params) => {
  try {
    const entry = await ChangelogEntry.create({ ...params, date: new Date(params.date) })
    return ok(entry)
  } catch (e) { return err(e) }
})

server.tool('update_changelog_entry', 'Update a changelog entry by ID', {
  id: z.string(),
  title: z.string().optional(),
  content: z.string().optional(),
  tags: z.array(z.string()).optional(),
  date: z.string().optional(),
  items: z.array(z.string()).optional(),
  media: z.string().optional(),
}, async ({ id, ...updates }) => {
  try {
    if (updates.date) (updates as any).date = new Date(updates.date)
    const entry = await ChangelogEntry.findByIdAndUpdate(id, updates, { new: true })
    if (!entry) return err('Changelog entry not found')
    return ok(entry)
  } catch (e) { return err(e) }
})

server.tool('delete_changelog_entry', 'Delete a changelog entry by ID', { id: z.string() }, async ({ id }) => {
  try {
    const entry = await ChangelogEntry.findByIdAndDelete(id)
    if (!entry) return err('Changelog entry not found')
    return ok({ deleted: true, id })
  } catch (e) { return err(e) }
})

// ── Tracked Repos (GitHub Sync) ─────────────────────────────────────────────

server.tool('list_tracked_repos', 'List tracked GitHub repos for changelog sync', {}, async () => {
  try {
    const repos = await TrackedRepo.find().sort('displayName')
    return ok(repos)
  } catch (e) { return err(e) }
})

server.tool('add_tracked_repo', 'Add a GitHub repo to track for changelog releases', {
  owner: z.string(),
  repo: z.string(),
  displayName: z.string().optional(),
  defaultTags: z.array(z.object({ label: z.string(), color: z.string() })).optional(),
  active: z.boolean().optional(),
}, async (params) => {
  try {
    const tracked = await TrackedRepo.create({
      ...params,
      displayName: params.displayName || `${params.owner}/${params.repo}`,
      defaultTags: params.defaultTags || [],
      active: params.active !== false,
    })
    return ok(tracked)
  } catch (e) { return err(e) }
})

server.tool('remove_tracked_repo', 'Remove a tracked GitHub repo', { id: z.string() }, async ({ id }) => {
  try {
    const tracked = await TrackedRepo.findByIdAndDelete(id)
    if (!tracked) return err('Tracked repo not found')
    return ok({ deleted: true, id })
  } catch (e) { return err(e) }
})

server.tool('sync_repo', 'Manually sync a single tracked repo', { id: z.string() }, async ({ id }) => {
  try {
    const count = await syncSingleRepo(id)
    return ok({ synced: count })
  } catch (e) { return err(e) }
})

server.tool('sync_all_repos', 'Manually sync all active tracked repos', {}, async () => {
  try {
    await syncAllRepos()
    return ok({ ok: true, message: 'Sync complete' })
  } catch (e) { return err(e) }
})

// ── Jobs ────────────────────────────────────────────────────────────────────

server.tool('list_jobs', 'List job listings', {
  active: z.boolean().optional(),
}, async (params) => {
  try {
    const filter: Record<string, unknown> = {}
    if (params.active !== false) filter.active = true
    const jobs = await Job.find(filter).sort('department')
    return ok(jobs)
  } catch (e) { return err(e) }
})

server.tool('get_job', 'Get a job listing by ID', { id: z.string() }, async ({ id }) => {
  try {
    const job = await Job.findById(id)
    if (!job) return err('Job not found')
    return ok(job)
  } catch (e) { return err(e) }
})

server.tool('create_job', 'Create a new job listing', {
  title: z.string(),
  department: z.string(),
  location: z.string().optional(),
  type: z.string().optional(),
  description: z.string().optional(),
  active: z.boolean().optional(),
}, async (params) => {
  try {
    const job = await Job.create(params)
    return ok(job)
  } catch (e) { return err(e) }
})

server.tool('update_job', 'Update a job listing by ID', {
  id: z.string(),
  title: z.string().optional(),
  department: z.string().optional(),
  location: z.string().optional(),
  type: z.string().optional(),
  description: z.string().optional(),
  active: z.boolean().optional(),
}, async ({ id, ...updates }) => {
  try {
    const job = await Job.findByIdAndUpdate(id, updates, { new: true })
    if (!job) return err('Job not found')
    return ok(job)
  } catch (e) { return err(e) }
})

// ── Settings ────────────────────────────────────────────────────────────────

server.tool('get_settings', 'Get site settings', {}, async () => {
  try {
    const settings = await SiteSettings.findOne()
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
    const settings = await SiteSettings.findOneAndUpdate({}, params, { new: true, upsert: true })
    return ok(settings)
  } catch (e) { return err(e) }
})

// ── Locales ─────────────────────────────────────────────────────────────────

server.tool('list_locales', 'List all locales (enabled and disabled)', {}, async () => {
  try {
    const locales = await Locale.find().sort('order')
    return ok(locales)
  } catch (e) { return err(e) }
})

server.tool('create_locale', 'Create a new locale', {
  code: z.string().describe('e.g. "en", "es", "fr"'),
  name: z.string().describe('English name, e.g. "Spanish"'),
  nativeName: z.string().describe('Native name, e.g. "Español"'),
  isDefault: z.boolean().optional(),
  enabled: z.boolean().optional(),
  order: z.number().optional(),
}, async (params) => {
  try {
    if (params.isDefault) {
      await Locale.updateMany({}, { isDefault: false })
    }
    const locale = await Locale.create(params)
    return ok(locale)
  } catch (e) { return err(e) }
})

server.tool('update_locale', 'Update a locale by code', {
  code: z.string(),
  name: z.string().optional(),
  nativeName: z.string().optional(),
  isDefault: z.boolean().optional(),
  enabled: z.boolean().optional(),
  order: z.number().optional(),
}, async ({ code, ...updates }) => {
  try {
    if (updates.isDefault) {
      await Locale.updateMany({}, { isDefault: false })
    }
    const locale = await Locale.findOneAndUpdate({ code }, updates, { new: true })
    if (!locale) return err('Locale not found')
    return ok(locale)
  } catch (e) { return err(e) }
})

server.tool('delete_locale', 'Delete a locale and its translations', { code: z.string() }, async ({ code }) => {
  try {
    const locale = await Locale.findOne({ code })
    if (!locale) return err('Locale not found')
    if (locale.isDefault) return err('Cannot delete the default locale')
    await Locale.deleteOne({ code })
    const { deletedCount } = await Translation.deleteMany({ locale: code })
    return ok({ deleted: true, code, translationsRemoved: deletedCount })
  } catch (e) { return err(e) }
})

// ── Translations ────────────────────────────────────────────────────────────

const TRANSLATABLE_COLLECTIONS = ['navigation', 'footer', 'pricing', 'testimonials', 'settings', 'pages', 'newsroom', 'jobs']

server.tool('get_translations', 'Get all translations for a collection and locale', {
  collection: z.string().describe(`One of: ${TRANSLATABLE_COLLECTIONS.join(', ')}`),
  locale: z.string().describe('Locale code, e.g. "es"'),
}, async ({ collection, locale }) => {
  try {
    const translations = await Translation.find({ collection, locale })
    return ok(translations)
  } catch (e) { return err(e) }
})

server.tool('get_translation', 'Get translation for a specific document', {
  collection: z.string(),
  documentId: z.string(),
  locale: z.string(),
}, async ({ collection, documentId, locale }) => {
  try {
    const translation = await Translation.findOne({ collection, documentId, locale })
    if (!translation) return err('Translation not found')
    return ok(translation)
  } catch (e) { return err(e) }
})

server.tool('upsert_translation', 'Create or update a translation for a document', {
  collection: z.string().describe(`One of: ${TRANSLATABLE_COLLECTIONS.join(', ')}`),
  documentId: z.string(),
  locale: z.string(),
  fields: z.record(z.any()).describe('Translated field overrides, e.g. { "title": "Hola" }'),
}, async ({ collection, documentId, locale, fields }) => {
  try {
    const translation = await Translation.findOneAndUpdate(
      { collection, documentId, locale },
      { fields },
      { new: true, upsert: true },
    )
    return ok(translation)
  } catch (e) { return err(e) }
})

server.tool('delete_translation', 'Delete a translation for a document', {
  collection: z.string(),
  documentId: z.string(),
  locale: z.string(),
}, async ({ collection, documentId, locale }) => {
  try {
    const translation = await Translation.findOneAndDelete({ collection, documentId, locale })
    if (!translation) return err('Translation not found')
    return ok({ deleted: true })
  } catch (e) { return err(e) }
})

} // end registerTools

// ── Mount on Express app ────────────────────────────────────────────────────

async function validateToken(token: string): Promise<boolean> {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  const mcpToken = await McpToken.findOne({
    tokenHash,
    revoked: false,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  })
  if (!mcpToken) return false
  mcpToken.lastUsedAt = new Date()
  await mcpToken.save()
  return true
}

export function mountMcp(app: express.Express) {
  const transports = new Map<string, StreamableHTTPServerTransport>()

  app.post('/mcp', async (req, res) => {
    const token = (req.query.token as string) || req.headers.authorization?.replace('Bearer ', '')
    if (!token || !(await validateToken(token))) {
      res.status(401).json({ error: 'Invalid or expired token' })
      return
    }

    const sessionId = req.headers['mcp-session-id'] as string | undefined

    // Existing session
    if (sessionId && transports.has(sessionId)) {
      await transports.get(sessionId)!.handleRequest(req, res)
      return
    }

    // New session (initialize request)
    const mcpServer = createMcpServer()
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => crypto.randomUUID() })
    transport.onclose = () => {
      if (transport.sessionId) transports.delete(transport.sessionId)
    }
    await mcpServer.connect(transport)
    await transport.handleRequest(req, res)
    // Store after handleRequest so sessionId is set
    if (transport.sessionId) {
      transports.set(transport.sessionId, transport)
    }
  })

  app.get('/mcp', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined
    if (sessionId && transports.has(sessionId)) {
      await transports.get(sessionId)!.handleRequest(req, res)
      return
    }
    res.status(400).json({ error: 'No active session. Send initialize first via POST.' })
  })

  app.delete('/mcp', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined
    if (sessionId && transports.has(sessionId)) {
      await transports.get(sessionId)!.handleRequest(req, res)
      transports.delete(sessionId)
    } else {
      res.status(400).json({ error: 'Invalid session' })
    }
  })
}
