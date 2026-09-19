import express, { type NextFunction, type Request, type RequestHandler, type Response } from 'express'
import cors from 'cors'
import { config } from './config.js'
import { ValidationError } from './utils/validate.js'
import { sql as pgClient } from './db/postgres.js'
import { readInfrastructureStatus } from './services/infrastructureStatus.js'
import { isBootstrapComplete } from './services/startupState.js'
import type { McpCatalogRegistrationStatus } from './services/mcpCatalogRegistration.js'
import { mountMcp } from './mcp.js'
import pagesRouter from './routes/pages.js'
import navigationRouter from './routes/navigation.js'
import footerRouter from './routes/footer.js'
import heroRouter from './routes/hero.js'
import statusRouter from './routes/status.js'
import statusHistoryRouter from './routes/statusHistory.js'
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
import jobsRouter from './routes/jobs.js'
import settingsRouter from './routes/settings.js'
import seoRouter from './routes/seo.js'
import localesRouter from './routes/locales.js'
import translationsRouter from './routes/translations.js'
import backupRouter from './routes/backup.js'
import uploadRouter from './routes/upload.js'
import likesRouter from './routes/likes.js'
import gamesRouter from './routes/games.js'
import commentsRouter from './routes/comments.js'
import featuresRouter from './routes/features.js'
import profilesRouter from './routes/profiles.js'
import badgesRouter from './routes/badges.js'
import teamRouter from './routes/team.js'
import mediaRouter from './routes/media.js'
import referralsRouter from './routes/referrals.js'
import fundingRouter from './routes/funding.js'
import adminAccessRouter from './routes/adminAccess.js'
import intercomRouter from './routes/intercom.js'
import salesRouter from './routes/sales.js'

/**
 * The HTTP application: middleware order, routes and error handlers, without
 * listening or bootstrapping. `server/index.ts` runs it; the integration tests
 * mount the same thing on an ephemeral port, so what they exercise is the
 * middleware composition production serves.
 */
export interface AppOptions {
  /** Request telemetry, installed first when present. */
  activityMiddleware?: RequestHandler
  catalogRegistrationStatus: () => McpCatalogRegistrationStatus
}

export function createApp(options: AppOptions): express.Express {
  const app = express()
  if (options.activityMiddleware) app.use(options.activityMiddleware)


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

  /**
   * The MCP endpoint and its OAuth metadata come BEFORE the site's CORS policy.
   * The MCP transport enforces its own origin allow-list (Claude's origins plus
   * `MCP_ALLOWED_ORIGINS`), answers its own preflight and exposes
   * `WWW-Authenticate`; the site policy below does not list Claude's origins, so
   * running it first refused those clients before the transport ever saw them.
   * Mounted before express.json() too — the transport reads the raw body itself.
   */
  mountMcp(app)

  function isAllowedSiteOrigin(origin: string): boolean {
    if (ALWAYS_ALLOWED_ORIGINS.has(origin)) return true
    const envAllowed = config.corsOrigin?.split(',').map((s) => s.trim()).filter(Boolean) ?? []
    return envAllowed.includes(origin)
  }

  // A browser origin outside the list is refused with a 403 the caller can read,
  // not thrown into the error handler as a generic 500.
  app.use((req, res, next) => {
    const origin = req.headers.origin
    if (origin && !isAllowedSiteOrigin(origin)) {
      return res.status(403).json({ error: 'Origin not allowed' })
    }
    return next()
  })

  app.use(cors({
    origin: (origin, callback) => callback(null, !origin || isAllowedSiteOrigin(origin)),
    credentials: true,
  }))

  app.use(express.json({ limit: '5mb' }))

  // API routes
  app.use('/api/pages', pagesRouter)
  app.use('/api/navigation', navigationRouter)
  app.use('/api/footer', footerRouter)
  app.use('/api/hero', heroRouter)
  app.use('/api/status', statusRouter)
  app.use('/api/status', statusHistoryRouter)
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
  app.use('/api/locales', localesRouter)
  app.use('/api/translations', translationsRouter)
  app.use('/api/backup', backupRouter)
  app.use('/api/upload', uploadRouter)
  app.use('/api/intercom', intercomRouter)

  // Admin identity — the SPA's admin gate asks this instead of matching usernames.
  app.use('/api/admin', adminAccessRouter)

  // Social features
  app.use('/api/likes', likesRouter)
  app.use('/api/games', gamesRouter)
  app.use('/api/comments', commentsRouter)
  app.use('/api/features', featuresRouter)
  app.use('/api/profiles', profilesRouter)
  app.use('/api/badges', badgesRouter)
  app.use('/api/referrals', referralsRouter)
  app.use('/api/funding-progress', fundingRouter)

  // Sales and private-evaluation requests from /contact/sales.
  app.use('/api/sales-inquiries', salesRouter)

  // Sitemap: generated at build time into `dist/sitemap.xml` by
  // `scripts/prerender.ts`, from the exact route list it renders. It is not
  // served from here — `robots.txt` points at `https://oxy.so/sitemap.xml`, and a
  // second, shorter route list on this origin could advertise URLs the build
  // never emitted. See the header of `scripts/sitemap.ts`.

  app.get('/api/infra-status', async (_req, res) => {
    try {
      const nodes = await readInfrastructureStatus(config.oxyApiBase)
      res.json({ nodes })
    } catch (error) {
      console.error('Infra status error:', error)
      res.status(500).json({ error: 'Failed to fetch infrastructure status' })
    }
  })

  /**
   * Load-balancer startup gate. It becomes healthy only after schema migrations
   * and the one-shot data repairs have completed successfully.
   *
   * Once bootstrap completes this remains a liveness response: a later database
   * interruption does not drain every existing task. `/api/ready` remains the
   * dynamic database-aware diagnostic. During a rolling deploy, ECS keeps the
   * old healthy task because the service requires 100% minimum healthy capacity.
   */
  app.get('/api/health', (_req, res) => {
    if (!isBootstrapComplete()) {
      return res.status(503).json({ ok: false, ready: false, reason: 'database bootstrap pending' })
    }
    return res.json({ ok: true, ready: true })
  })

  /** Process liveness for diagnostics; unlike the ALB probe this never gates traffic. */
  app.get('/api/live', (_req, res) => res.json({ alive: true }))

  /**
   * Readiness — can this process actually serve data right now?
   *
   * Separate from liveness on purpose. Use this to decide whether to send traffic
   * (or to alert), never to decide whether to kill the task. It asks the database
   * rather than reading a cached connection flag: a pool that believes it is
   * connected but cannot answer a query is exactly the state this must catch.
   */
  app.get('/api/ready', async (_req, res) => {
    if (!isBootstrapComplete()) {
      return res.status(503).json({ ready: false, db: 'bootstrap-pending' })
    }
    try {
      await pgClient`select 1`
      res.json({ ready: true, db: 'connected' })
    } catch (err) {
      res.status(503).json({ ready: false, db: 'disconnected', error: (err as Error).message })
    }
  })

  /**
   * MCP diagnostics: is this task's MCP actually usable, beyond the site being
   * up? Read-only and unauthenticated, so it carries no secrets — the catalog
   * registration state is sanitized at the source and the authorization server
   * is reported as configured, never probed per request.
   *
   * Deliberately separate from `/api/health`: an MCP problem must never drain a
   * task that serves the website perfectly well. The HTTP status is always 200;
   * the body says what is wrong.
   */
  app.get('/api/mcp/status', async (_req, res) => {
    let database: 'bootstrap-pending' | 'connected' | 'disconnected' = 'bootstrap-pending'
    if (isBootstrapComplete()) {
      try {
        await pgClient`select 1`
        database = 'connected'
      } catch {
        database = 'disconnected'
      }
    }
    res.set('cache-control', 'no-store').json({
      alive: true,
      database,
      catalogRegistration: options.catalogRegistrationStatus(),
      authorizationServer: { configured: Boolean(config.oxyApiBase), baseUrl: config.oxyApiBase || null },
    })
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

  return app
}
