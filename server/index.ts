import express, { type NextFunction, type Request, type Response } from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import { config } from './config.js'
import { ValidationError } from './utils/validate.js'

import pagesRouter from './routes/pages.js'
import { Navigation } from './models/Navigation.js'
import { Product } from './models/Product.js'
import { Category } from './models/Category.js'
import navigationRouter from './routes/navigation.js'
import footerRouter from './routes/footer.js'
import heroRouter from './routes/hero.js'
import statusRouter from './routes/status.js'
import productsRouter from './routes/products.js'
import categoriesRouter from './routes/categories.js'
import newsroomRouter from './routes/newsroom.js'
import coursesRouter from './routes/courses.js'
import resourcesRouter from './routes/resources.js'
import helpRouter from './routes/help.js'
import pricingRouter from './routes/pricing.js'
import testimonialsRouter from './routes/testimonials.js'
import changelogRouter from './routes/changelog.js'
import { startSyncInterval } from './services/githubSync.js'
import jobsRouter from './routes/jobs.js'
import settingsRouter from './routes/settings.js'
import seoRouter from './routes/seo.js'
import mcpTokensRouter from './routes/mcp-tokens.js'
import localesRouter from './routes/locales.js'
import translationsRouter from './routes/translations.js'
import sitemapRouter from './routes/sitemap.js'
import backupRouter from './routes/backup.js'
import uploadRouter from './routes/upload.js'
import likesRouter from './routes/likes.js'
import commentsRouter from './routes/comments.js'
import featuresRouter from './routes/features.js'
import profilesRouter from './routes/profiles.js'
import badgesRouter from './routes/badges.js'
import teamRouter from './routes/team.js'
import mediaRouter from './routes/media.js'
import referralsRouter from './routes/referrals.js'
import fundingRouter from './routes/funding.js'
import { mountMcp } from './mcp.js'

const app = express()

const ALWAYS_ALLOWED_ORIGINS = new Set([
  'https://oxy.so',
  'https://www.oxy.so',
  'https://fairco.in',
  'https://www.fairco.in',
  'http://localhost:5173',
  'http://localhost:4173',
])

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    if (ALWAYS_ALLOWED_ORIGINS.has(origin)) return callback(null, true)
    const envAllowed = config.corsOrigin?.split(',').map((s) => s.trim()).filter(Boolean) ?? []
    if (envAllowed.includes(origin)) return callback(null, true)
    if (envAllowed.length === 0 && !config.corsOrigin) return callback(null, true)
    return callback(new Error(`CORS: origin ${origin} not allowed`), false)
  },
  credentials: true,
}))

// MCP must be mounted before express.json() — it needs raw body
mountMcp(app)

app.use(express.json({ limit: '5mb' }))

// API routes
app.use('/api/pages', pagesRouter)
app.use('/api/navigation', navigationRouter)
app.use('/api/footer', footerRouter)
app.use('/api/hero', heroRouter)
app.use('/api/status', statusRouter)
app.use('/api/products', productsRouter)
app.use('/api/categories', categoriesRouter)
app.use('/api/newsroom', newsroomRouter)
app.use('/api/courses', coursesRouter)
app.use('/api/resources', resourcesRouter)
app.use('/api/help', helpRouter)
app.use('/api/pricing', pricingRouter)
app.use('/api/testimonials', testimonialsRouter)
app.use('/api/changelog', changelogRouter)
app.use('/api/jobs', jobsRouter)
app.use('/api/team', teamRouter)
app.use('/api/media', mediaRouter)
app.use('/api/settings', settingsRouter)
app.use('/api/seo', seoRouter)
app.use('/api/mcp-tokens', mcpTokensRouter)
app.use('/api/locales', localesRouter)
app.use('/api/translations', translationsRouter)
app.use('/api/backup', backupRouter)
app.use('/api/upload', uploadRouter)

// Social features
app.use('/api/likes', likesRouter)
app.use('/api/comments', commentsRouter)
app.use('/api/features', featuresRouter)
app.use('/api/profiles', profilesRouter)
app.use('/api/badges', badgesRouter)
app.use('/api/referrals', referralsRouter)
app.use('/api/funding-progress', fundingRouter)

// Sitemap
app.use('/', sitemapRouter)

// Platform stats — proxy to Oxy API
app.get('/api/platform-stats', async (_req, res) => {
  try {
    const resp = await fetch(`${config.oxyApiBase}/platform-stats`)
    if (!resp.ok) throw new Error(`Oxy API returned ${resp.status}`)
    res.json(await resp.json())
  } catch (error) {
    console.error('Platform stats proxy error:', error)
    res.status(502).json({ error: 'Failed to fetch platform stats' })
  }
})

// Infrastructure status — polls DigitalOcean API for droplet/app/db health
interface InfraStatusNode {
  region: string
  status: 'online' | 'degraded' | 'offline'
  droplets: number
  apps: number
  dbs: number
}
let infraCache: { nodes: InfraStatusNode[]; fetchedAt: number } | null = null
const INFRA_CACHE_TTL = 60_000

async function fetchInfraStatus(): Promise<InfraStatusNode[]> {
  if (infraCache && Date.now() - infraCache.fetchedAt < INFRA_CACHE_TTL) {
    return infraCache.nodes
  }

  const token = config.doApiToken
  if (!token) {
    // No DO token — return static healthy status for known regions
    return [
      { region: 'ams3', status: 'online', droplets: 5, apps: 8, dbs: 5 },
      { region: 'lon1', status: 'online', droplets: 1, apps: 1, dbs: 0 },
      { region: 'nyc1', status: 'online', droplets: 1, apps: 1, dbs: 0 },
    ]
  }

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  const regionMap = new Map<string, InfraStatusNode>()

  const ensure = (region: string): InfraStatusNode => {
    if (!regionMap.has(region)) {
      regionMap.set(region, { region, status: 'online', droplets: 0, apps: 0, dbs: 0 })
    }
    return regionMap.get(region)!
  }

  try {
    const [dropletsRes, appsRes, dbsRes] = await Promise.allSettled([
      fetch('https://api.digitalocean.com/v2/droplets?per_page=100', { headers }),
      fetch('https://api.digitalocean.com/v2/apps?per_page=100', { headers }),
      fetch('https://api.digitalocean.com/v2/databases?per_page=100', { headers }),
    ])

    if (dropletsRes.status === 'fulfilled' && dropletsRes.value.ok) {
      const data = await dropletsRes.value.json()
      for (const d of data.droplets || []) {
        const node = ensure(d.region?.slug || 'ams3')
        node.droplets++
        if (d.status !== 'active') node.status = 'degraded'
      }
    }

    if (appsRes.status === 'fulfilled' && appsRes.value.ok) {
      const data = await appsRes.value.json()
      for (const a of data.apps || []) {
        const region = a.region?.slug || a.default_ingress?.split('.')[0] || 'ams'
        const node = ensure(region.replace(/\d+$/, '') === 'ams' ? 'ams3' : region)
        node.apps++
      }
    }

    if (dbsRes.status === 'fulfilled' && dbsRes.value.ok) {
      const data = await dbsRes.value.json()
      for (const db of data.databases || []) {
        const node = ensure(db.region || 'ams3')
        node.dbs++
        if (db.status !== 'online') node.status = 'degraded'
      }
    }

    // Ensure our 3 known regions always appear
    ensure('ams3')
    ensure('lon1')
    ensure('nyc1')
  } catch (error) {
    console.error('Infra status fetch error:', error)
    return [
      { region: 'ams3', status: 'online', droplets: 0, apps: 0, dbs: 0 },
      { region: 'lon1', status: 'online', droplets: 0, apps: 0, dbs: 0 },
      { region: 'nyc1', status: 'online', droplets: 0, apps: 0, dbs: 0 },
    ]
  }

  const nodes = Array.from(regionMap.values())
  infraCache = { nodes, fetchedAt: Date.now() }
  return nodes
}

app.get('/api/infra-status', async (_req, res) => {
  try {
    const nodes = await fetchInfraStatus()
    res.json({ nodes })
  } catch (error) {
    console.error('Infra status error:', error)
    res.status(500).json({ error: 'Failed to fetch infrastructure status' })
  }
})

// Health check
app.get('/api/health', (_req, res) => res.json({ ok: true }))

// Validation error handler — must come after all routes so it catches
// ValidationError thrown by route handlers via the `validate()` helper.
app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: 'ValidationError', issues: err.issues })
  }
  return next(err)
})

async function migrateEcosystemDropdown() {
  // Any dropdown that was historically called "Ecosystem" is now
  // auto-driven by the Products CMS. One-shot migration so existing
  // prod data picks up the new apps-mode without a manual admin save.
  const result = await Navigation.updateMany(
    { label: /^ecosystem$/i, kind: { $ne: 'apps' } },
    { $set: { kind: 'apps' } },
  )
  if (result.modifiedCount > 0) {
    console.log(`[migration] Upgraded ${result.modifiedCount} ecosystem dropdown(s) to apps mode`)
  }
}

async function migrateProductCategoryRefs() {
  // Products used to store a free-text `section` slug. Link every legacy
  // product to the matching Category document by slug so `product.category`
  // becomes the single source of truth.
  const orphans = await Product.find({ $or: [{ category: null }, { category: { $exists: false } }] })
  if (orphans.length === 0) return
  const categories = await Category.find({})
  const idBySlug = new Map(categories.map((c) => [c.slug, c._id]))
  let linked = 0
  for (const product of orphans) {
    const categoryId = product.section ? idBySlug.get(product.section) : undefined
    if (!categoryId) continue
    product.category = categoryId
    await product.save()
    linked++
  }
  if (linked > 0) {
    console.log(`[migration] Linked ${linked} product(s) to their Category by legacy slug`)
  }
}

async function start() {
  await mongoose.connect(config.mongoUri)
  console.log('Connected to MongoDB')

  await migrateEcosystemDropdown()
  await migrateProductCategoryRefs()

  startSyncInterval()

  app.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`)
  })
}

start().catch(console.error)
