import express, { type NextFunction, type Request, type Response } from 'express'
import cors from 'cors'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { and, eq, isNull, sql } from 'drizzle-orm'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { config } from './config.js'
import { ValidationError } from './utils/validate.js'

import pagesRouter from './routes/pages.js'
import { db, sql as pgClient } from './db/postgres.js'
import { categories, navigationDropdowns, products } from './db/schema/index.js'
import navigationRouter from './routes/navigation.js'
import footerRouter from './routes/footer.js'
import heroRouter from './routes/hero.js'
import statusRouter from './routes/status.js'
import productsRouter from './routes/products.js'
import homiioRouter from './routes/homiio.js'
import categoriesRouter from './routes/categories.js'
import newsroomRouter from './routes/newsroom.js'
import coursesRouter from './routes/courses.js'
import resourcesRouter from './routes/resources.js'
import helpRouter from './routes/help.js'
import pricingRouter from './routes/pricing.js'
import testimonialsRouter from './routes/testimonials.js'
import changelogRouter from './routes/changelog.js'
import { startSyncInterval } from './services/githubSync.js'
import { startFeaturePriorityInterval } from './services/featurePriority.js'
import { getPriorityTiers } from './constants/featurePriority.js'
import jobsRouter from './routes/jobs.js'
import settingsRouter from './routes/settings.js'
import seoRouter from './routes/seo.js'
import mcpTokensRouter from './routes/mcp-tokens.js'
import localesRouter from './routes/locales.js'
import translationsRouter from './routes/translations.js'
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
import adminAccessRouter from './routes/adminAccess.js'
import { mountMcp } from './mcp.js'

/** Migrations ship beside the server sources, so this resolves in dev and in the image alike. */
const MIGRATIONS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'db', 'migrations')

const app = express()

const ALWAYS_ALLOWED_ORIGINS = new Set([
  'https://oxy.so',
  'https://www.oxy.so',
  'https://fairco.in',
  'https://www.fairco.in',
  'https://homiio.com',
  'https://www.homiio.com',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:8081',
  'http://localhost:19006',
])

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    if (ALWAYS_ALLOWED_ORIGINS.has(origin)) return callback(null, true)
    const envAllowed = config.corsOrigin?.split(',').map((s) => s.trim()).filter(Boolean) ?? []
    if (envAllowed.includes(origin)) return callback(null, true)
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
app.use('/api/homiio', homiioRouter)
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

// Admin identity — the SPA's admin gate asks this instead of matching usernames.
app.use('/api/admin', adminAccessRouter)

// Social features
app.use('/api/likes', likesRouter)
app.use('/api/comments', commentsRouter)
app.use('/api/features', featuresRouter)
app.use('/api/profiles', profilesRouter)
app.use('/api/badges', badgesRouter)
app.use('/api/referrals', referralsRouter)
app.use('/api/funding-progress', fundingRouter)

// Sitemap: generated at build time into `dist/sitemap.xml` by
// `scripts/prerender.ts`, from the exact route list it renders. It is not
// served from here — `robots.txt` points at `https://oxy.so/sitemap.xml`, and a
// second, shorter route list on this origin could advertise URLs the build
// never emitted. See the header of `scripts/sitemap.ts`.

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
    const existing = regionMap.get(region)
    if (existing) return existing
    const node: InfraStatusNode = { region, status: 'online', droplets: 0, apps: 0, dbs: 0 }
    regionMap.set(region, node)
    return node
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

/**
 * Liveness. Answers as soon as the process is listening, deliberately without
 * touching MongoDB.
 *
 * This is the probe the load balancer must be pointed at. Making liveness
 * depend on the database is what turns a database blip into a total outage: the
 * probe fails, the orchestrator kills the task, the replacement hits the same
 * database and is killed too, and the load balancer ends up with no healthy
 * targets and serves 503 for everything — including after the database
 * recovers, because nothing is left alive to notice.
 */
app.get('/api/health', (_req, res) => res.json({ ok: true }))

/**
 * Readiness — can this process actually serve data right now?
 *
 * Separate from liveness on purpose. Use this to decide whether to send traffic
 * (or to alert), never to decide whether to kill the task. It asks the database
 * rather than reading a cached connection flag: a pool that believes it is
 * connected but cannot answer a query is exactly the state this must catch.
 */
app.get('/api/ready', async (_req, res) => {
  try {
    await pgClient`select 1`
    res.json({ ready: true, db: 'connected' })
  } catch (err) {
    res.status(503).json({ ready: false, db: 'disconnected', error: (err as Error).message })
  }
})

// Validation error handler — must come after all routes so it catches
// ValidationError thrown by route handlers via the `validate()` helper.
app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: 'ValidationError', issues: err.issues })
  }
  return next(err)
})

// Terminal error handler — without this, anything that is not a ValidationError
// reaches Express's default handler, which answers JSON API clients with an
// HTML error page and logs nothing about which route failed.
app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  console.error(`[error] ${req.method} ${req.originalUrl}:`, err)
  // A response that has already started streaming cannot be rewritten; the
  // default handler is the only thing that can abort the connection cleanly.
  if (res.headersSent) return next(err)
  return res.status(500).json({ error: 'Internal server error' })
})

async function migrateEcosystemDropdown() {
  // Any dropdown that was historically called "Ecosystem" is now
  // auto-driven by the Products CMS. One-shot migration so existing
  // prod data picks up the new apps-mode without a manual admin save.
  const updated = await db
    .update(navigationDropdowns)
    .set({ kind: 'apps', updatedAt: new Date() })
    .where(and(sql`lower(${navigationDropdowns.label}) = 'ecosystem'`, sql`${navigationDropdowns.kind} <> 'apps'`))
    .returning({ id: navigationDropdowns._id })
  if (updated.length > 0) {
    console.log(`[migration] Upgraded ${updated.length} ecosystem dropdown(s) to apps mode`)
  }
}

async function migrateProductCategoryRefs() {
  // Products used to store a free-text `section` slug. Link every legacy
  // product to the matching category row by slug so `product.category`
  // becomes the single source of truth.
  const orphans = await db.select().from(products).where(isNull(products.category))
  if (orphans.length === 0) return
  const rows = await db.select({ id: categories._id, slug: categories.slug }).from(categories)
  const idBySlug = new Map(rows.map((row) => [row.slug, row.id]))
  let linked = 0
  for (const product of orphans) {
    const categoryId = product.section ? idBySlug.get(product.section) : undefined
    if (!categoryId) continue
    await db.update(products).set({ category: categoryId, updatedAt: new Date() }).where(eq(products._id, product._id))
    linked++
  }
  if (linked > 0) {
    console.log(`[migration] Linked ${linked} product(s) to their category by legacy slug`)
  }
}

/**
 * Reach the database, apply migrations, run the start-up data fixes, retrying
 * forever.
 *
 * Deliberately not awaited before `listen()`: `/api/health` answers throughout,
 * which is what keeps the task alive long enough to get here. Unlike Mongoose,
 * postgres.js does not buffer statements issued before the pool is up, so a
 * request arriving during an outage fails fast with a 500 rather than hanging —
 * `/api/ready` is what tells the load balancer to stop sending them.
 *
 * Backs off to a ceiling instead of hammering a database that is already
 * struggling. There is no give-up case: giving up would mean exiting, and a
 * process that exits on an unreachable database is a process that cannot
 * recover when the database returns.
 */
async function connectWithRetry(): Promise<void> {
  const MAX_DELAY_MS = 30_000
  let attempt = 0

  for (;;) {
    try {
      await pgClient`select 1`
      console.log('Connected to PostgreSQL')

      // The schema comes first: a task that starts against an older schema
      // would serve 500s from every route that reads a new column.
      await migrate(db, { migrationsFolder: MIGRATIONS_DIR })
      console.log('[db] migrations applied')

      await migrateEcosystemDropdown()
      await migrateProductCategoryRefs()

      startSyncInterval()
      startFeaturePriorityInterval()
      return
    } catch (err) {
      attempt++
      const delay = Math.min(1000 * 2 ** (attempt - 1), MAX_DELAY_MS)
      console.error(
        `PostgreSQL unavailable (attempt ${attempt}), retrying in ${delay}ms:`,
        (err as Error).message,
      )
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
}

/**
 * Listen first, connect second.
 *
 * The previous order — connect, migrate, then listen — meant the process never
 * opened a port until MongoDB answered and three migrations completed. A slow
 * or unreachable database therefore failed the load balancer's health check,
 * the orchestrator replaced the task, the replacement failed the same way, and
 * the target group drained to zero: every route 503s, and the CORS headers go
 * with them, so callers see an opaque CORS error rather than the outage. That
 * state does not clear on its own once the database recovers.
 *
 * Opening the port first means an unreachable database degrades this service
 * instead of removing it, and it heals by itself.
 */
/**
 * Fail fast on a malformed `FEATURE_PRIORITY_TIERS`.
 *
 * Deliberately here, before anything starts, and deliberately not inside
 * `connectWithRetry`: a throw in there is caught by the reconnect loop, which
 * reports a configuration error as "MongoDB unavailable" and re-runs the
 * migrations and `startSyncInterval` on every retry. This is a deploy-time
 * mistake in an environment variable, so exiting is right. A task that exits
 * immediately never takes traffic, and the one already running keeps serving
 * until someone fixes the value.
 */
getPriorityTiers()

app.listen(config.port, () => {
  console.log(`Server listening on http://localhost:${config.port}`)
  void connectWithRetry()
})
