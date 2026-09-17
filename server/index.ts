import { startWebsiteActivity } from './services/ecosystemActivity.js'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { and, eq, isNull, sql } from 'drizzle-orm'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { config } from './config.js'

import { db, rootDb, sql as pgClient } from './db/postgres.js'
import { categories, navigationDropdowns, products } from './db/schema/index.js'
import { startSyncInterval } from './services/githubSync.js'
import { startFeaturePriorityInterval } from './services/featurePriority.js'
import { startStatusSnapshotInterval } from './services/statusSnapshot.js'
import { getPriorityTiers } from './constants/featurePriority.js'
import { isBootstrapComplete, markBootstrapComplete } from './services/startupState.js'
import { purgeExpiredInquiries } from './routes/sales.js'
import { oxyService, WEBSITE_MCP_CATALOG } from './mcp.js'
import { createApp } from './app.js'
import { startIdempotencyPurge } from './mcp/idempotency.js'
import { startStorageCleanupSweep } from './services/media.js'
import {
  createMcpCatalogRegistration,
  disabledMcpCatalogRegistrationStatus,
  type McpCatalogRegistration,
} from './services/mcpCatalogRegistration.js'

/** Migrations ship beside the server sources, so this resolves in dev and in the image alike. */
const MIGRATIONS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'db', 'migrations')

/**
 * Only the deployed service registers: a local run would otherwise replace
 * production's catalog with whatever is on a developer's branch. Created here
 * and started after `listen()`.
 */
const mcpCatalogRegistration: McpCatalogRegistration | null =
  process.env.NODE_ENV === 'production' && config.oxyServiceApiKey && config.oxyServiceApiSecret
    ? createMcpCatalogRegistration({ catalog: WEBSITE_MCP_CATALOG, oxy: oxyService, oxyApiBase: config.oxyApiBase })
    : null

const activity = startWebsiteActivity(isBootstrapComplete)
const app = createApp({
  activityMiddleware: activity?.middleware,
  catalogRegistrationStatus: () => mcpCatalogRegistration?.status() ?? disabledMcpCatalogRegistrationStatus(WEBSITE_MCP_CATALOG),
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
 * which is what keeps the task alive long enough to get here. postgres.js does
 * not buffer statements issued before the pool is up, so a
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
      await migrate(rootDb, { migrationsFolder: MIGRATIONS_DIR })
      console.log('[db] migrations applied')

      await migrateEcosystemDropdown()
      await migrateProductCategoryRefs()

      startSyncInterval()
      startFeaturePriorityInterval()
      startStatusSnapshotInterval()
      startInquiryRetentionSweep()
      startStorageCleanupSweep()
      startIdempotencyPurge()
      markBootstrapComplete()
      return
    } catch (err) {
      attempt++
      const delay = Math.min(1000 * 2 ** (attempt - 1), MAX_DELAY_MS)
      console.error(`Database bootstrap failed (attempt ${attempt}), retrying in ${delay}ms:`, err)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
}

/**
 * Delete sales inquiries past their retention date, daily.
 *
 * Started here rather than inside `connectWithRetry`'s try block for the same
 * reason the other intervals are: every retry of that loop would stack another
 * timer. It runs once at boot so a task that restarts more often than daily
 * still sweeps, and the handler tolerates a database that is briefly away.
 */
function startInquiryRetentionSweep(): void {
  const DAY_MS = 24 * 60 * 60 * 1000
  const sweep = () => {
    purgeExpiredInquiries().catch((error: unknown) => {
      console.error('[sales] retention sweep failed:', error)
    })
  }
  sweep()
  setInterval(sweep, DAY_MS).unref()
}

/**
 * Listen first, connect second.
 *
 * The previous order — connect, migrate, then listen — meant the process never
 * opened a port until the database answered and the migrations completed. A slow
 * or unreachable database therefore failed the load balancer's health check,
 * the orchestrator replaced the task, the replacement failed the same way, and
 * the target group drained to zero: every route 503s, and the CORS headers go
 * with them, so callers see an opaque CORS error rather than the outage. That
 * state does not clear on its own once the database recovers.
 *
 * Opening the port first lets the process retry and heal itself. `/api/health`
 * stays 503 until bootstrap succeeds, so a replacement cannot receive traffic
 * with an old schema or partially reconciled inventory.
 */
/**
 * Fail fast on a malformed `FEATURE_PRIORITY_TIERS`.
 *
 * Deliberately here, before anything starts, and deliberately not inside
 * `connectWithRetry`: a throw in there is caught by the reconnect loop, which
 * reports a configuration error as a database outage and re-runs the
 * migrations and `startSyncInterval` on every retry. This is a deploy-time
 * mistake in an environment variable, so exiting is right. A task that exits
 * immediately never takes traffic, and the one already running keeps serving
 * until someone fixes the value.
 */
getPriorityTiers()

const server = app.listen(config.port, () => {
  console.log(`Server listening on http://localhost:${config.port}`)
  void connectWithRetry()
  void mcpCatalogRegistration?.start()
})


let shuttingDown = false
async function shutdown() {
  if (shuttingDown) return
  shuttingDown = true
  const deadline = setTimeout(() => process.exit(1), 15_000)
  deadline.unref()
  mcpCatalogRegistration?.stop()
  await new Promise<void>(resolve => server.close(() => resolve()))
  await activity?.stop()
  await pgClient.end({ timeout: 2 })
  clearTimeout(deadline)
  process.exit(0)
}
process.once('SIGTERM', () => { void shutdown() })
process.once('SIGINT', () => { void shutdown() })
