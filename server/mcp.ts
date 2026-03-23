import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
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

const server = new McpServer({
  name: 'oxy-website',
  version: '1.0.0',
})

// ── Helper ──────────────────────────────────────────────────────────────────

function ok(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
}

function err(e: unknown) {
  return { content: [{ type: 'text' as const, text: String(e) }], isError: true as const }
}

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

server.tool('list_posts', 'List newsroom posts with optional filtering', {
  category: z.string().optional(),
  tag: z.string().optional(),
  featured: z.boolean().optional(),
  limit: z.number().optional(),
  page: z.number().optional(),
}, async (params) => {
  try {
    const filter: Record<string, unknown> = {}
    if (params.category) filter.category = params.category
    if (params.tag) filter.tags = params.tag
    if (params.featured) filter.featured = true

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

server.tool('get_post', 'Get a newsroom post by slug', { slug: z.string() }, async ({ slug }) => {
  try {
    const post = await NewsroomPost.findOne({ slug })
    if (!post) return err('Post not found')
    return ok(post)
  } catch (e) { return err(e) }
})

server.tool('create_post', 'Create a new newsroom post', {
  title: z.string(),
  slug: z.string(),
  excerpt: z.string().optional(),
  content: z.string().optional(),
  coverImage: z.string().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  featured: z.boolean().optional(),
  publishedAt: z.string().optional(),
}, async (params) => {
  try {
    const post = await NewsroomPost.create({
      ...params,
      publishedAt: params.publishedAt ? new Date(params.publishedAt) : new Date(),
      authorId: 'mcp-admin',
      authorUsername: 'mcp',
    })
    return ok(post)
  } catch (e) { return err(e) }
})

server.tool('update_post', 'Update a newsroom post by slug', {
  slug: z.string(),
  title: z.string().optional(),
  excerpt: z.string().optional(),
  content: z.string().optional(),
  coverImage: z.string().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  featured: z.boolean().optional(),
  publishedAt: z.string().optional(),
}, async ({ slug, ...updates }) => {
  try {
    if (updates.publishedAt) (updates as any).publishedAt = new Date(updates.publishedAt)
    const post = await NewsroomPost.findOneAndUpdate({ slug }, updates, { new: true })
    if (!post) return err('Post not found')
    return ok(post)
  } catch (e) { return err(e) }
})

server.tool('delete_post', 'Delete a newsroom post by slug', { slug: z.string() }, async ({ slug }) => {
  try {
    const post = await NewsroomPost.findOneAndDelete({ slug })
    if (!post) return err('Post not found')
    return ok({ deleted: true, slug })
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

server.tool('list_changelog', 'List all changelog entries', {}, async () => {
  try {
    const entries = await ChangelogEntry.find().sort('-date')
    return ok(entries)
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

// ── Start Server ────────────────────────────────────────────────────────────

const mcpPort = parseInt(process.env.MCP_PORT || '4001', 10)
const app = express()
const transports: Record<string, SSEServerTransport> = {}

app.get('/sse', async (req, res) => {
  // Validate Bearer token
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Bearer token required' })
    return
  }

  const rawToken = authHeader.slice(7)
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')

  const mcpToken = await McpToken.findOne({
    tokenHash,
    revoked: false,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  })

  if (!mcpToken) {
    res.status(401).json({ error: 'Invalid or expired token' })
    return
  }

  // Update last used timestamp
  mcpToken.lastUsedAt = new Date()
  await mcpToken.save()

  const transport = new SSEServerTransport('/messages', res)
  transports[transport.sessionId] = transport
  res.on('close', () => { delete transports[transport.sessionId] })
  await server.connect(transport)
})

app.post('/messages', async (req, res) => {
  const sessionId = req.query.sessionId as string
  const transport = transports[sessionId]
  if (!transport) { res.status(400).json({ error: 'Unknown session' }); return }
  await transport.handlePostMessage(req, res)
})

async function start() {
  await mongoose.connect(config.mongoUri)
  console.log('Connected to MongoDB')

  app.listen(mcpPort, () => {
    console.log(`MCP server running on http://localhost:${mcpPort}`)
    console.log(`SSE endpoint: http://localhost:${mcpPort}/sse`)
  })
}

start().catch(console.error)
