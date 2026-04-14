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
import { HeroContent, getOrCreateHero } from './models/HeroContent.js'
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
import { TeamMember } from './models/TeamMember.js'
import { Media } from './models/Media.js'
import { Product } from './models/Product.js'
import { Referral } from './models/Referral.js'
import { Course } from './models/Course.js'
import { Resource } from './models/Resource.js'
import { syncAllRepos, syncSingleRepo } from './services/githubSync.js'
import { deleteFromSpaces, uploadToSpaces } from './services/s3.js'
import { processImage } from './services/thumbnails.js'
import { heroUpdateRawShape, heroUpdateSchema, type HeroUpdate } from './validation/hero.js'

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
    const resp = await fetch(url)
    steps.push(`2. Fetch done: status=${resp.status}, content-type=${resp.headers.get('content-type')}`)
    
    const buffer = Buffer.from(await resp.arrayBuffer())
    steps.push(`3. Buffer: ${buffer.length} bytes`)
    
    steps.push('4. Testing S3 upload...')
    const cdnUrl = await uploadToSpaces(buffer, 'debug-test.jpg', 'image/jpeg', 'oxy-website/debug')
    steps.push(`5. S3 upload OK: ${cdnUrl}`)
    
    steps.push('6. Testing Media.create...')
    const media = await Media.create({
      url: cdnUrl, thumbnails: { sm: '', md: '', lg: '' },
      filename: 'debug-test.jpg', key: new URL(cdnUrl).pathname.slice(1),
      mimeType: 'image/jpeg', size: buffer.length,
      alt: '', tags: ['debug'], folder: 'debug', uploadedBy: 'mcp',
    })
    steps.push(`7. Media created: ${media._id}`)
    
    // Cleanup
    await Media.findByIdAndDelete(media._id)
    steps.push('8. Cleanup done')
    
    return ok({ success: true, steps })
  } catch (e) {
    const msg = e instanceof Error ? `${e.message}\n${e.stack}` : String(e)
    steps.push(`FAILED: ${msg}`)
    return ok({ success: false, steps })
  }
})

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
  promptPhrases: z.array(z.string()).optional(),
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
    const footer = await Footer.findOne()
    if (footer) {
      if (params.columns !== undefined) footer.columns = params.columns as InstanceType<typeof Footer>['columns']
      if (params.socialLinks !== undefined) footer.socialLinks = params.socialLinks as InstanceType<typeof Footer>['socialLinks']
      if (params.copyright !== undefined) footer.copyright = params.copyright
      await footer.save()
      return ok(footer)
    }
    const created = await Footer.create(params)
    return ok(created)
  } catch (e) { return err(e) }
})

// ── Hero ────────────────────────────────────────────────────────────────────

server.tool('get_hero', 'Get the homepage hero singleton: title, eyebrow text, background video/poster, and the carousel slot grid that sits below the hero copy. Returns sensible defaults the first time it is called so the site renders identically before any edits.', {}, async () => {
  try {
    const hero = await getOrCreateHero()
    return ok(hero)
  } catch (e) { return err(e) }
})

server.tool('update_hero', 'Update the homepage hero. Pass any subset of: title (supports newlines), eyebrow, background video/poster (Media _id or static URL like "/images/landing/hero-background.webm"), or carouselSlots (full replacement of the grid). Only provided fields are changed.', heroUpdateRawShape, async (params: HeroUpdate) => {
  try {
    // Re-validate via the same schema the REST route uses so the MCP and the
    // HTTP path stay in lockstep on shape, defaults, and rejections.
    const body = heroUpdateSchema.parse(params)
    await getOrCreateHero({ populate: false })

    const update: Record<string, unknown> = {}
    if (body.title !== undefined) update.title = body.title
    if (body.eyebrow !== undefined) update.eyebrow = body.eyebrow
    for (const field of ['backgroundVideoWebm', 'backgroundVideoMp4', 'backgroundPoster'] as const) {
      const value = body[field]
      if (value === undefined) continue
      if (typeof value === 'string' && mongoose.Types.ObjectId.isValid(value) && value.length === 24) {
        update[field] = new mongoose.Types.ObjectId(value)
      } else {
        update[field] = value || null
      }
    }
    if (body.carouselSlots !== undefined) update.carouselSlots = body.carouselSlots

    const hero = await HeroContent.findOneAndUpdate({}, update, { new: true, upsert: true })
      .populate('backgroundVideoWebm backgroundVideoMp4 backgroundPoster')
    return ok(hero)
  } catch (e) { return err(e) }
})

// ── Newsroom ────────────────────────────────────────────────────────────────

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
    const filter: Record<string, unknown> = {}
    if (params.category) filter.categories = params.category
    if (params.tag) filter.tags = params.tag
    if (params.featured) filter.featured = true
    if (params.status) filter.status = params.status

    if (params.search) {
      const regex = { $regex: params.search, $options: 'i' }
      filter.$or = [{ title: regex }, { resume: regex }]
    }

    const limit = params.limit ?? 20
    const page = params.page ?? 1
    const skip = (page - 1) * limit

    const [posts, total] = await Promise.all([
      NewsroomPost.find(filter).populate('coverImage ogImage').sort('-publishedAt').skip(skip).limit(limit),
      NewsroomPost.countDocuments(filter),
    ])
    return ok({ posts, total, page, pages: Math.ceil(total / limit) })
  } catch (e) { return err(e) }
})

server.tool('get_post', 'Get a single newsroom post by its URL slug. Returns full post content including markdown body.', {
  slug: z.string().describe('The URL slug of the post'),
}, async ({ slug }) => {
  try {
    const post = await NewsroomPost.findOne({ slug }).populate('coverImage ogImage')
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
    const populated = await NewsroomPost.findById(post._id).populate('coverImage ogImage')
    return ok(populated)
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
    if (updates.publishedAt) (updates as any).publishedAt = new Date(updates.publishedAt)
    if (newSlug) (updates as any).slug = newSlug
    // Cast string IDs to ObjectId for media fields
    if (updates.coverImage) (updates as any).coverImage = new mongoose.Types.ObjectId(updates.coverImage)
    if (updates.ogImage) (updates as any).ogImage = new mongoose.Types.ObjectId(updates.ogImage)
    const post = await NewsroomPost.findOneAndUpdate({ slug }, updates, { new: true }).populate('coverImage ogImage')
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

server.tool('search_posts', 'Search newsroom posts by title or resume text. Returns posts matching the search query.', {
  query: z.string().describe('Search text to match against post titles and resumes'),
  limit: z.number().optional().describe('Maximum results to return (default 10)'),
}, async (params) => {
  try {
    const regex = { $regex: params.query, $options: 'i' }
    const posts = await NewsroomPost.find({
      $or: [{ title: regex }, { resume: regex }],
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

server.tool('list_changelog', 'List changelog entries with optional repo filter, search, and pagination. Returns entries sorted by date descending.', {
  repo: z.string().optional().describe('Filter by repo, e.g. "owner/name" or just "name"'),
  search: z.string().optional().describe('Search entries by title or content text'),
  limit: z.number().optional().describe('Results per page (default 20)'),
  page: z.number().optional().describe('Page number (default 1)'),
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
    if (params.search) {
      const regex = { $regex: params.search, $options: 'i' }
      filter.$or = [{ title: regex }, { content: regex }]
    }
    const [entries, total] = await Promise.all([
      ChangelogEntry.find(filter).populate('media').sort('-date').skip((page - 1) * limit).limit(limit),
      ChangelogEntry.countDocuments(filter),
    ])
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
    const entry = await ChangelogEntry.create({ ...params, date: new Date(params.date) })
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
    if (updates.date) (updates as any).date = new Date(updates.date)
    const entry = await ChangelogEntry.findByIdAndUpdate(id, updates, { new: true })
    if (!entry) return err('Changelog entry not found')
    return ok(entry)
  } catch (e) { return err(e) }
})

server.tool('delete_changelog_entry', 'Permanently delete a changelog entry by ID.', {
  id: z.string().describe('The _id of the changelog entry to delete'),
}, async ({ id }) => {
  try {
    const entry = await ChangelogEntry.findByIdAndDelete(id)
    if (!entry) return err('Changelog entry not found')
    return ok({ deleted: true, id })
  } catch (e) { return err(e) }
})

// ── Tracked Repos (GitHub Sync) ─────────────────────────────────────────────

server.tool('list_tracked_repos', 'List GitHub repos tracked for automatic changelog sync. Shows sync status and configuration.', {}, async () => {
  try {
    const repos = await TrackedRepo.find().sort('displayName')
    return ok(repos)
  } catch (e) { return err(e) }
})

server.tool('add_tracked_repo', 'Add a GitHub repo to track. New releases will be automatically synced as changelog entries.', {
  owner: z.string().describe('GitHub repo owner, e.g. "OxyHQ"'),
  repo: z.string().describe('GitHub repo name, e.g. "Oxy"'),
  displayName: z.string().optional().describe('Display name shown in the changelog. Defaults to "owner/repo".'),
  defaultTags: z.array(z.object({ label: z.string(), color: z.string() })).optional().describe('Default tags applied to synced entries'),
  active: z.boolean().optional().describe('Whether sync is active. Defaults to true.'),
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

server.tool('remove_tracked_repo', 'Remove a tracked GitHub repo. Does not delete existing changelog entries from that repo.', {
  id: z.string().describe('The _id of the tracked repo to remove'),
}, async ({ id }) => {
  try {
    const tracked = await TrackedRepo.findByIdAndDelete(id)
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
    const filter: Record<string, unknown> = {}
    if (params.active !== false) filter.active = true
    const jobs = await Job.find(filter).sort('order department')
    return ok(jobs)
  } catch (e) { return err(e) }
})

server.tool('get_job', 'Get a single job listing by its URL slug.', {
  slug: z.string().describe('The URL slug of the job listing'),
}, async ({ slug }) => {
  try {
    const job = await Job.findOne({ slug })
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
    const job = await Job.create(params)
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
    const job = await Job.findOneAndUpdate({ slug }, updates, { new: true })
    if (!job) return err('Job not found')
    return ok(job)
  } catch (e) { return err(e) }
})

server.tool('delete_job', 'Permanently delete a job listing by slug.', {
  slug: z.string().describe('The URL slug of the job to delete'),
}, async ({ slug }) => {
  try {
    const job = await Job.findOneAndDelete({ slug })
    if (!job) return err('Job not found')
    return ok({ deleted: true, slug })
  } catch (e) { return err(e) }
})

// ── Team Members ────────────────────────────────────────────────────────────

server.tool('list_team_members', 'List team members. Returns active members by default.', {
  active: z.boolean().optional().describe('Filter by active status. Defaults to true.'),
}, async (params) => {
  try {
    const filter: Record<string, unknown> = {}
    if (params.active !== false) filter.active = true
    const members = await TeamMember.find(filter).populate('avatar').sort('order name')
    return ok(members)
  } catch (e) { return err(e) }
})

server.tool('get_team_member', 'Get a team member by slug.', {
  slug: z.string().describe('The URL slug of the team member'),
}, async ({ slug }) => {
  try {
    const member = await TeamMember.findOne({ slug }).populate('avatar')
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
    const member = await TeamMember.create(params)
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
    const member = await TeamMember.findOneAndUpdate({ slug }, updates, { new: true })
    if (!member) return err('Team member not found')
    return ok(member)
  } catch (e) { return err(e) }
})

server.tool('delete_team_member', 'Delete a team member by slug.', {
  slug: z.string().describe('The slug of the team member to delete'),
}, async ({ slug }) => {
  try {
    const member = await TeamMember.findOneAndDelete({ slug })
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
    const filter: Record<string, unknown> = {}
    if (params.search) filter.$text = { $search: params.search }
    if (params.type === 'image') filter.mimeType = { $regex: /^image\// }
    else if (params.type === 'video') filter.mimeType = { $regex: /^video\// }
    else if (params.type === 'document') filter.mimeType = { $nin: [/^image\//, /^video\//] }
    if (params.tag) filter.tags = params.tag
    if (params.folder) filter.folder = params.folder

    const limit = params.limit ?? 20
    const page = params.page ?? 1
    const [items, total] = await Promise.all([
      Media.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Media.countDocuments(filter),
    ])
    return ok({ items, total, page, pages: Math.ceil(total / limit) })
  } catch (e) { return err(e) }
})

server.tool('get_media', 'Get a single media item by ID.', {
  id: z.string().describe('The _id of the media item'),
}, async ({ id }) => {
  try {
    const media = await Media.findById(id)
    if (!media) return err('Media not found')
    return ok(media)
  } catch (e) { return err(e) }
})

server.tool('update_media', 'Update media metadata (alt text, tags, folder).', {
  id: z.string().describe('The _id of the media item'),
  alt: z.string().optional().describe('Alt text for the image'),
  tags: z.array(z.string()).optional().describe('Tags for organization'),
  folder: z.string().optional().describe('Logical folder name'),
}, async ({ id, ...updates }) => {
  try {
    const media = await Media.findByIdAndUpdate(id, updates, { new: true })
    if (!media) return err('Media not found')
    return ok(media)
  } catch (e) { return err(e) }
})

server.tool('delete_media', 'Delete a media item from S3 and the database.', {
  id: z.string().describe('The _id of the media item to delete'),
}, async ({ id }) => {
  try {
    const media = await Media.findById(id)
    if (!media) return err('Media not found')
    const keys = [media.key, ...[media.thumbnails?.sm, media.thumbnails?.md, media.thumbnails?.lg].filter(Boolean).map(u => { try { return new URL(u!).pathname.slice(1) } catch { return '' } }).filter(Boolean)]
    await Promise.allSettled(keys.map(k => deleteFromSpaces(k)))
    await media.deleteOne()
    return ok({ deleted: true, id })
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

server.tool('list_locales', 'List all locales (both enabled and disabled). Locales control which languages the site supports.', {}, async () => {
  try {
    const locales = await Locale.find().sort('order')
    return ok(locales)
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
      await Locale.updateMany({}, { isDefault: false })
    }
    const locale = await Locale.create(params)
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
      await Locale.updateMany({}, { isDefault: false })
    }
    const locale = await Locale.findOneAndUpdate({ code }, updates, { new: true })
    if (!locale) return err('Locale not found')
    return ok(locale)
  } catch (e) { return err(e) }
})

server.tool('delete_locale', 'Delete a locale and all its translations. Cannot delete the default locale.', {
  code: z.string().describe('The locale code to delete, e.g. "es"'),
}, async ({ code }) => {
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

const TRANSLATABLE_COLLECTIONS = ['navigation', 'footer', 'pricing', 'testimonials', 'settings', 'pages', 'newsroom', 'jobs', 'hero', 'products', 'categories', 'team', 'changelog', 'courses', 'resources']

server.tool('list_translation_collections', 'List all collections that support translations.', {}, async () => {
  return ok(TRANSLATABLE_COLLECTIONS)
})

server.tool('get_translations', 'Get all translations for a collection in a specific locale. Returns an array of translated documents.', {
  collection: z.string().describe(`Collection to query. One of: ${TRANSLATABLE_COLLECTIONS.join(', ')}`),
  locale: z.string().describe('Locale code, e.g. "es", "fr", "ja"'),
}, async ({ collection, locale }) => {
  try {
    const translations = await Translation.find({ collectionName: collection, locale })
    return ok(translations)
  } catch (e) { return err(e) }
})

server.tool('get_translation', 'Get the translation for a specific document in a collection.', {
  collection: z.string().describe(`Collection name. One of: ${TRANSLATABLE_COLLECTIONS.join(', ')}`),
  documentId: z.string().describe('The _id of the original document being translated'),
  locale: z.string().describe('Locale code, e.g. "es"'),
}, async ({ collection, documentId, locale }) => {
  try {
    const translation = await Translation.findOne({ collectionName: collection, documentId, locale })
    if (!translation) return err('Translation not found')
    return ok(translation)
  } catch (e) { return err(e) }
})

server.tool('upsert_translation', 'Create or update a translation. The fields object contains key-value overrides that replace the original document fields for the given locale.', {
  collection: z.string().describe(`Collection name. One of: ${TRANSLATABLE_COLLECTIONS.join(', ')}`),
  documentId: z.string().describe('The _id of the original document being translated'),
  locale: z.string().describe('Locale code, e.g. "es"'),
  fields: z.record(z.string(), z.any()).describe('Key-value field overrides. e.g. { "title": "Hola", "excerpt": "Resumen..." }. Only include fields that differ from the original.'),
}, async ({ collection, documentId, locale, fields }) => {
  try {
    const translation = await Translation.findOneAndUpdate(
      { collectionName: collection, documentId, locale },
      { collectionName: collection, fields },
      { new: true, upsert: true },
    )
    return ok(translation)
  } catch (e) { return err(e) }
})

server.tool('delete_translation', 'Delete a translation for a specific document and locale.', {
  collection: z.string().describe('Collection name'),
  documentId: z.string().describe('The _id of the document'),
  locale: z.string().describe('Locale code'),
}, async ({ collection, documentId, locale }) => {
  try {
    const translation = await Translation.findOneAndDelete({ collectionName: collection, documentId, locale })
    if (!translation) return err('Translation not found')
    return ok({ deleted: true })
  } catch (e) { return err(e) }
})

// ── MCP Tokens ───────────────────────────────────────────────────────────────

server.tool('list_mcp_tokens', 'List all MCP API tokens. Token hashes are never exposed. Shows name, creator, usage, and expiry info.', {}, async () => {
  try {
    const tokens = await McpToken.find({}, 'name createdBy createdAt lastUsedAt expiresAt revoked').sort('-createdAt')
    return ok(tokens)
  } catch (e) { return err(e) }
})

server.tool('create_mcp_token', 'Create a new MCP API token. The raw token is returned only once — save it securely.', {
  name: z.string().describe('A descriptive name for this token, e.g. "Claude Desktop" or "CI/CD"'),
  expiresAt: z.string().optional().describe('Expiry date as ISO string. Omit for no expiration.'),
}, async (params) => {
  try {
    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
    const token = await McpToken.create({
      name: params.name,
      tokenHash,
      createdBy: 'mcp-admin',
      expiresAt: params.expiresAt ? new Date(params.expiresAt) : undefined,
    })
    return ok({ _id: token._id, name: token.name, token: rawToken, createdAt: token.createdAt, expiresAt: token.expiresAt })
  } catch (e) { return err(e) }
})

server.tool('revoke_mcp_token', 'Revoke an MCP API token. The token will immediately stop working.', {
  id: z.string().describe('The _id of the token to revoke'),
}, async ({ id }) => {
  try {
    const token = await McpToken.findByIdAndUpdate(id, { revoked: true }, { new: true })
    if (!token) return err('Token not found')
    return ok({ revoked: true, id })
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
    const resp = await fetch(params.url)
    if (!resp.ok) return err(`Failed to download: ${resp.status}`)
    const buffer = Buffer.from(await resp.arrayBuffer())
    const contentType = resp.headers.get('content-type') || 'application/octet-stream'
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
    } catch (e) {
      // Thumbnail generation is optional
    }

    const media = await Media.create({
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
    const resp = await fetch(params.imageUrl)
    if (!resp.ok) return err(`Failed to download image: HTTP ${resp.status}`)
    const buffer = Buffer.from(await resp.arrayBuffer())
    const contentType = resp.headers.get('content-type') || 'image/jpeg'
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
    const media = await Media.create({
      url: cdnUrl, thumbnails, filename, key,
      mimeType: contentType, size: buffer.length, width, height,
      alt: params.alt || '', tags: ['newsroom'], folder: 'newsroom',
      uploadedBy: 'mcp',
    })

    // 5. Update the post
    const post = await NewsroomPost.findOneAndUpdate(
      { slug: params.postSlug },
      { coverImage: media._id, imageAlt: params.alt || '' },
      { new: true },
    ).populate('coverImage ogImage')
    if (!post) return err(`Post not found: ${params.postSlug}`)

    return ok({ media, post })
  } catch (e) { return err(e) }
})

server.tool('upload_and_set_team_avatar', 'Download an image, upload to S3, create Media document, and set it as a team member avatar.', {
  memberSlug: z.string().describe('Slug of the team member to update'),
  imageUrl: z.string().describe('Source URL of the image to download'),
  filename: z.string().optional(),
  alt: z.string().optional(),
}, async (params) => {
  try {
    const resp = await fetch(params.imageUrl)
    if (!resp.ok) return err(`Failed to download: HTTP ${resp.status}`)
    const buffer = Buffer.from(await resp.arrayBuffer())
    const contentType = resp.headers.get('content-type') || 'image/jpeg'
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

    const media = await Media.create({
      url: cdnUrl, thumbnails, filename, key,
      mimeType: contentType, size: buffer.length, width, height,
      alt: params.alt || '', tags: ['team'], folder: 'team',
      uploadedBy: 'mcp',
    })

    const member = await TeamMember.findOneAndUpdate(
      { slug: params.memberSlug },
      { avatar: media._id },
      { new: true },
    ).populate('avatar')
    if (!member) return err(`Team member not found: ${params.memberSlug}`)

    return ok({ media, member })
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
      const resp = await fetch(p.imageUrl)
      if (!resp.ok) { results.push({ slug: p.slug, status: 'error', error: `Download failed: ${resp.status}` }); continue }
      const buffer = Buffer.from(await resp.arrayBuffer())
      const contentType = resp.headers.get('content-type') || 'image/jpeg'
      const filename = new URL(p.imageUrl).pathname.split('/').pop() || 'cover.jpg'

      const cdnUrl = await uploadToSpaces(buffer, filename, contentType, 'oxy-website/newsroom')
      const key = new URL(cdnUrl).pathname.slice(1)

      let width: number | undefined, height: number | undefined, thumbnails = { sm: '', md: '', lg: '' }
      try { const r = await processImage(buffer, filename, contentType, 'oxy-website/newsroom'); width = r.width; height = r.height; thumbnails = r.thumbnails } catch {}

      const media = await Media.create({
        url: cdnUrl, thumbnails, filename, key,
        mimeType: contentType, size: buffer.length, width, height,
        alt: p.alt || '', tags: ['newsroom'], folder: 'newsroom', uploadedBy: 'mcp',
      })

      await NewsroomPost.findOneAndUpdate({ slug: p.slug }, { coverImage: media._id, imageAlt: p.alt || '' })
      results.push({ slug: p.slug, status: 'ok', mediaId: media._id.toString() })
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
    const post = await NewsroomPost.findOne({ slug }).populate('coverImage ogImage')
    if (!post) return err('Post not found')
    return ok(post)
  } catch (e) { return err(e) }
})

// ── Products ──────────────────────────────────────────────────────────────

const productRawShape = {
  productId: z.string().describe('Stable URL-safe id (e.g. "alia", "mention"). Used as the primary lookup key.'),
  name: z.string().describe('Display name'),
  tagline: z.string().optional().describe('Single-line tag shown above the title on each product card'),
  description: z.string().optional().describe('Short body copy shown inside the card'),
  href: z.string().describe('Canonical destination — the running app / external URL. Starts with "http" for external, "/" for internal.'),
  landingUrl: z.string().optional().describe('Optional local landing page on oxy.so (e.g. "/inbox"). When set, /products and the navbar link here instead of href.'),
  healthUrl: z.string().optional().describe('Optional URL to probe for /status health checks. Defaults to `href` when unset.'),
  external: z.boolean().optional().describe('True for off-site destinations (opens in a new tab, shows up-right arrow)'),
  cta: z.string().optional().describe('CTA label (e.g. "Explore Alia", "Visit Mention")'),
  brand: z.string().describe('Hex brand color for the card accent strip + icon mark (e.g. "#7c3aed")'),
  brandForeground: z.string().optional().describe('Optional hex color for the icon mark text. Defaults to white.'),
  mark: z.string().describe('Single letter used inside the brand square when no logo is set'),
  logo: z.string().optional().describe('Media document id for the app logo. Takes precedence over `mark`.'),
  section: z.string().optional().describe('Grouping label used on /products and /status (e.g. "Social & Communication").'),
  lifecycle: z.enum(['live', 'in-development']).optional().describe('"live" for the shipped grid, "in-development" for the new/upcoming section'),
  showOnProducts: z.boolean().optional().describe('Show this product on the /products page.'),
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
    const query: Record<string, unknown> = {}
    if (lifecycle) query.lifecycle = lifecycle
    if (section) query.section = section
    if (surface === 'products') query.showOnProducts = true
    if (surface === 'status') query.showOnStatus = true
    if (surface === 'nav') query.showInNav = true
    const products = await Product.find(query).sort({ lifecycle: 1, section: 1, order: 1 }).populate('logo')
    return ok(products)
  } catch (e) { return err(e) }
})

server.tool('get_product', 'Get a single product by its productId.', {
  productId: z.string().describe('Stable product id (e.g. "alia", "mention")'),
}, async ({ productId }) => {
  try {
    const product = await Product.findOne({ productId }).populate('logo')
    if (!product) return err('Product not found')
    return ok(product)
  } catch (e) { return err(e) }
})

server.tool('create_product', 'Create a new product. By default it appears on /products, /status, and the ecosystem navbar dropdown.', productRawShape, async (input) => {
  try {
    const existing = await Product.findOne({ productId: input.productId })
    if (existing) return err(`Product "${input.productId}" already exists`)
    const product = await Product.create(input)
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
    const product = await Product.findOneAndUpdate({ productId }, normalized, { new: true }).populate('logo')
    if (!product) return err('Product not found')
    return ok(product)
  } catch (e) { return err(e) }
})

server.tool('delete_product', 'Permanently delete a product. This action cannot be undone.', {
  productId: z.string().describe('Stable product id to delete'),
}, async ({ productId }) => {
  try {
    const doc = await Product.findOneAndDelete({ productId })
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
    const filter: Record<string, unknown> = {}
    if (params.category) filter.category = params.category
    if (params.tag) filter.tags = params.tag
    if (params.featured) filter.featured = true
    if (params.status) filter.status = params.status
    if (params.level) filter.level = params.level

    const limit = params.limit ?? 20
    const page = params.page ?? 1
    const skip = (page - 1) * limit

    const [courses, total] = await Promise.all([
      Course.find(filter)
        .populate('coverImage')
        .populate('category')
        .sort({ order: 1, publishedAt: -1 })
        .skip(skip)
        .limit(limit),
      Course.countDocuments(filter),
    ])
    return ok({ courses, total, page, pages: Math.ceil(total / limit) })
  } catch (e) { return err(e) }
})

server.tool('get_course', 'Get a single Academy course by its URL slug, including its lessons and populated cover image / category.', {
  slug: z.string().describe('The URL slug of the course'),
}, async ({ slug }) => {
  try {
    const course = await Course.findOne({ slug }).populate('coverImage').populate('category')
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
    const existing = await Course.findOne({ slug })
    if (existing) slug = `${slug}-${Date.now().toString(36)}`
    const { publishedAt, coverImage, category, ...rest } = params
    const course = await Course.create({
      ...rest,
      slug,
      coverImage: coverImage && coverImage.length > 0 ? new mongoose.Types.ObjectId(coverImage) : null,
      category: category && category.length > 0 ? new mongoose.Types.ObjectId(category) : null,
      publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
    })
    const populated = await Course.findById(course._id).populate('coverImage').populate('category')
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
        ? new mongoose.Types.ObjectId(updates.coverImage)
        : null
    }
    if (updates.category !== undefined) {
      patch.category = updates.category && updates.category.length > 0
        ? new mongoose.Types.ObjectId(updates.category)
        : null
    }
    const course = await Course.findOneAndUpdate({ slug }, patch, { new: true })
      .populate('coverImage')
      .populate('category')
    if (!course) return err('Course not found')
    return ok(course)
  } catch (e) { return err(e) }
})

server.tool('delete_course', 'Permanently delete an Academy course by slug. Cannot be undone.', {
  slug: z.string().describe('The URL slug of the course to delete'),
}, async ({ slug }) => {
  try {
    const course = await Course.findOneAndDelete({ slug })
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
    const filter: Record<string, unknown> = {}
    if (params.category) filter.category = params.category
    if (params.tag) filter.tags = params.tag
    if (params.type) filter.type = params.type
    if (params.featured) filter.featured = true
    if (params.status) filter.status = params.status

    const limit = params.limit ?? 20
    const page = params.page ?? 1
    const skip = (page - 1) * limit

    const [resources, total] = await Promise.all([
      Resource.find(filter)
        .populate('coverImage')
        .populate('category')
        .sort({ order: 1, publishedAt: -1 })
        .skip(skip)
        .limit(limit),
      Resource.countDocuments(filter),
    ])
    return ok({ resources, total, page, pages: Math.ceil(total / limit) })
  } catch (e) { return err(e) }
})

server.tool('get_resource', 'Get a single Academy resource by its URL slug.', {
  slug: z.string().describe('The URL slug of the resource'),
}, async ({ slug }) => {
  try {
    const resource = await Resource.findOne({ slug }).populate('coverImage').populate('category')
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
    const existing = await Resource.findOne({ slug })
    if (existing) slug = `${slug}-${Date.now().toString(36)}`
    const { publishedAt, coverImage, category, ...rest } = params
    const resource = await Resource.create({
      ...rest,
      slug,
      coverImage: coverImage && coverImage.length > 0 ? new mongoose.Types.ObjectId(coverImage) : null,
      category: category && category.length > 0 ? new mongoose.Types.ObjectId(category) : null,
      publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
    })
    const populated = await Resource.findById(resource._id).populate('coverImage').populate('category')
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
        ? new mongoose.Types.ObjectId(updates.coverImage)
        : null
    }
    if (updates.category !== undefined) {
      patch.category = updates.category && updates.category.length > 0
        ? new mongoose.Types.ObjectId(updates.category)
        : null
    }
    const resource = await Resource.findOneAndUpdate({ slug }, patch, { new: true })
      .populate('coverImage')
      .populate('category')
    if (!resource) return err('Resource not found')
    return ok(resource)
  } catch (e) { return err(e) }
})

server.tool('delete_resource', 'Permanently delete an Academy resource by slug. Cannot be undone.', {
  slug: z.string().describe('The URL slug of the resource to delete'),
}, async ({ slug }) => {
  try {
    const resource = await Resource.findOneAndDelete({ slug })
    if (!resource) return err('Resource not found')
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
    const query: Record<string, unknown> = {}
    if (type) query.type = type
    if (status) query.status = status
    const referrals = await Referral.find(query).sort({ type: 1, createdAt: -1 })
    return ok(referrals)
  } catch (e) { return err(e) }
})

server.tool('get_referral', 'Get a single referral by its code.', {
  code: z.string().describe('Unique referral code'),
}, async ({ code }) => {
  try {
    const referral = await Referral.findOne({ code })
    if (!referral) return err('Referral not found')
    return ok(referral)
  } catch (e) { return err(e) }
})

server.tool('create_referral', 'Create a new referral code. Defaults to type="user" and status="active".', referralRawShape, async (input) => {
  try {
    const existing = await Referral.findOne({ code: input.code })
    if (existing) return err(`Referral "${input.code}" already exists`)
    const referral = await Referral.create(input)
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
    const referral = await Referral.findOneAndUpdate({ code }, patch, { new: true })
    if (!referral) return err('Referral not found')
    return ok(referral)
  } catch (e) { return err(e) }
})

server.tool('delete_referral', 'Permanently delete a referral code. This action cannot be undone.', {
  code: z.string().describe('Referral code to delete'),
}, async ({ code }) => {
  try {
    const doc = await Referral.findOneAndDelete({ code })
    if (!doc) return err('Referral not found')
    return ok({ deleted: true, code })
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

  const isInitializeRequest = (body: unknown): boolean => {
    if (!body || typeof body !== 'object') return false
    const b = body as { method?: unknown }
    return b.method === 'initialize'
  }

  app.post('/mcp', async (req, res) => {
    const token = (req.query.token as string) || req.headers.authorization?.replace('Bearer ', '')
    if (!token || !(await validateToken(token))) {
      res.status(401).json({ error: 'Invalid or expired token' })
      return
    }

    const sessionId = req.headers['mcp-session-id'] as string | undefined

    // Existing session — route to its live transport
    if (sessionId && transports.has(sessionId)) {
      const transport = transports.get(sessionId)
      if (transport) {
        await transport.handleRequest(req, res)
        return
      }
    }

    // Stale session — the client is sending a non-initialize request with
    // a session id we don't know about (server restart, transport GC, etc.).
    // Respond with a JSON-RPC error so the client re-initializes instead of
    // silently falling through to the new-session branch.
    if (sessionId && !isInitializeRequest(req.body)) {
      res.status(404).json({
        jsonrpc: '2.0',
        error: {
          code: -32001,
          message: 'Session not found. Re-initialize the MCP connection.',
        },
        id: (req.body as { id?: unknown })?.id ?? null,
      })
      return
    }

    // Fresh initialize request — spin up a new transport and register it
    const mcpServer = createMcpServer()
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => crypto.randomUUID() })
    transport.onclose = () => {
      if (transport.sessionId) transports.delete(transport.sessionId)
    }
    await mcpServer.connect(transport)
    await transport.handleRequest(req, res)
    if (transport.sessionId) {
      transports.set(transport.sessionId, transport)
    }
  })

  app.get('/mcp', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined
    if (sessionId && transports.has(sessionId)) {
      const transport = transports.get(sessionId)
      if (transport) {
        await transport.handleRequest(req, res)
        return
      }
    }
    res.status(404).json({
      jsonrpc: '2.0',
      error: {
        code: -32001,
        message: 'Session not found. Re-initialize the MCP connection.',
      },
      id: null,
    })
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
