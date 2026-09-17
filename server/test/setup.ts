import { mock } from 'bun:test'

/* ──────────────────────────────────────────────
 * Preload for the server integration suite (`bun run test:server`).
 *
 * Real PostgreSQL, because the defects this suite guards against — an insert
 * that returned nothing, a unique index racing a pre-check, a transaction that
 * did not hold — are exactly what a mocked database agrees with. Object storage
 * and remote downloads are replaced by in-memory doubles the tests control.
 *
 * The database is wiped between tests, so the URL must name a disposable
 * database on a local or CI host. Anything else is refused before a single
 * statement runs.
 * ──────────────────────────────────────────── */

const url = process.env.TEST_DATABASE_URL
if (!url) {
  throw new Error('TEST_DATABASE_URL is not set. Point it at a disposable PostgreSQL database, e.g. postgres://postgres@127.0.0.1:5432/website_test')
}
const parsed = new URL(url)
if (!['127.0.0.1', 'localhost', '::1', 'postgres'].includes(parsed.hostname) || !/test/.test(parsed.pathname)) {
  throw new Error(`Refusing to run the destructive test suite against ${parsed.hostname}${parsed.pathname}: use a local database whose name contains "test"`)
}
process.env.DATABASE_URL = url
process.env.NODE_ENV = 'test'

// The app under test answers public reads by calling its own REST routes on
// `config.port`, and validates tokens against a fake Oxy — both ports are fixed
// here, before `config` is first imported.
const net = await import('node:net')
async function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = net.createServer()
    probe.once('error', reject)
    probe.listen(0, '127.0.0.1', () => {
      const address = probe.address()
      probe.close(() => resolve(typeof address === 'object' && address ? address.port : 0))
    })
  })
}
process.env.PORT = String(await freePort())
process.env.TEST_FAKE_OXY_PORT = String(await freePort())
process.env.OXY_API_BASE = `http://localhost:${process.env.TEST_FAKE_OXY_PORT}`
process.env.MCP_RESOURCE_URL = `http://localhost:${process.env.PORT}/mcp`
process.env.CORS_ORIGIN = 'https://site.test'
process.env.CDN_BASE_URL = 'https://cdn.test'
process.env.OXY_ADMIN_USER_IDS = 'admin-account'

// ── Object storage double ──────────────────────────────────────────────────

export const storage = {
  objects: new Map<string, { size: number; contentType: string }>(),
  failPuts: 0,
  failDeletes: new Set<string>(),
  failAllDeletes: false,
  reset() {
    this.objects.clear()
    this.failPuts = 0
    this.failDeletes.clear()
    this.failAllDeletes = false
  },
}
;(globalThis as Record<string, unknown>).__testStorage = storage

const real = await import('../services/s3.js')
mock.module('../services/s3.js', () => ({
  ...real,
  uploadToSpaces: async (buffer: Buffer, name: string, contentType: string, folder?: string) => {
    if (storage.failPuts > 0) {
      storage.failPuts -= 1
      throw new Error('simulated storage outage')
    }
    const key = real.buildObjectKey(buffer, name, contentType, folder)
    storage.objects.set(key, { size: buffer.length, contentType })
    return real.publicUrlForKey(key)
  },
  deleteFromSpaces: async (key: string) => {
    if (storage.failAllDeletes || storage.failDeletes.has(key)) throw new Error('simulated storage delete failure')
    storage.objects.delete(key)
  },
}))

// ── Remote download double ─────────────────────────────────────────────────

export const remote = {
  files: new Map<string, Buffer>(),
  requested: [] as string[],
  /** Runs while a download is "in flight", after the tool validated its target. */
  onDownload: null as null | ((source: string) => Promise<void>),
  reset() {
    this.files.clear()
    this.requested = []
    this.onDownload = null
  },
}
;(globalThis as Record<string, unknown>).__testRemote = remote

const realDownload = await import('../services/remoteDownload.js')
const { UpstreamError } = await import('@oxy.so/core/server')
mock.module('../services/remoteDownload.js', () => ({
  ...realDownload,
  downloadRemote: async (source: string) => {
    remote.requested.push(source)
    await remote.onDownload?.(source)
    const buffer = remote.files.get(source)
    if (!buffer) throw new UpstreamError('Upstream returned 404')
    return { buffer, declaredContentType: 'application/octet-stream', finalUrl: source }
  },
}))

// ── Schema ─────────────────────────────────────────────────────────────────

const { migrate } = await import('drizzle-orm/postgres-js/migrator')
const { rootDb } = await import('../db/postgres.js')
const path = await import('node:path')
await migrate(rootDb, { migrationsFolder: path.join(import.meta.dir, '..', 'db', 'migrations') })
