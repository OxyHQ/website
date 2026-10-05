import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

/* ──────────────────────────────────────────────
 * Migrations, one task at a time.
 *
 * drizzle-orm's migrator takes no lock: it reads the journal OUTSIDE its
 * transaction, then applies whatever it thinks is pending. Two tasks booting
 * together (a parallel deploy, a scale-out, both restarting at once) both see
 * the same migrations pending: a schema migration fails on one of them, and a
 * data-only migration runs twice.
 *
 * So every boot takes a SESSION-level advisory lock on a dedicated connection
 * and holds it across the whole `migrate` call, which runs on that same
 * connection. The second task waits for the first, then runs `migrate` itself
 * and finds nothing pending. Session-level, not `pg_advisory_xact_lock`: the
 * lock has to span drizzle's statements outside its transaction as well as the
 * transaction itself. A dedicated client, not the pool: a pooled connection
 * handed back mid-way would take the lock with it, or leave it held by a
 * connection serving requests.
 *
 * `DATABASE_URL` is the RDS instance directly (postgres.internal.oxy.so is a
 * CNAME to it), not a transaction-mode pooler, so a session lock means what it
 * says.
 * ──────────────────────────────────────────── */

/**
 * The advisory-lock key for schema migrations: ASCII "web_migr" as one int8.
 *
 * Advisory locks are scoped to the current database, so this only has to be
 * distinct from the other keys taken in the `website` database:
 * `DEFAULT_LOCALE_LOCK` (0x6c6f63616c65, "locale") in `services/locales.ts` and
 * the per-request `hashtextextended(...)` keys in `mcp/idempotency.ts`, whose
 * chance of landing on this value is 2^-64 — and even then the cost is one
 * brief wait, not a wrong result.
 */
export const MIGRATION_LOCK_KEY = 0x7765625f6d696772n

/** What `pg_stat_activity` shows for the connection holding (or waiting on) the lock. */
const APPLICATION_NAME = 'website-api migrations'

export interface MigrateUnderLockOptions {
  connectionString: string
  migrationsFolder: string
  /**
   * Give up waiting for another holder after this long. The caller's retry loop
   * then tries again — the task keeps reporting unready, it never goes on to
   * serve traffic without having migrated. Default 5 minutes.
   */
  maxWaitMs?: number
  /** How often to retry the lock while another connection holds it. Default 500 ms. */
  pollMs?: number
  /** How often to log that we are still waiting, naming the holder. Default 10 s. */
  reportEveryMs?: number
  log?: (line: string) => void
}

export interface MigrationRun {
  /** How long this call waited for another holder before it got the lock. */
  waitedMs: number
  /** `Date.now()` when the lock was granted. */
  lockedAt: number
  /** `Date.now()` when `migrate` returned and the lock was about to be released. */
  migratedAt: number
  /** The backend that held the lock and ran the migrations. */
  backendPid: number
}

export class MigrationLockTimeoutError extends Error {
  override name = 'MigrationLockTimeoutError'
}

interface Holder {
  pid: number
  application_name: string
  state: string | null
  backend_start: Date | null
}

function describeHolder(holder: Holder | undefined): string {
  if (!holder) return 'holder unknown (released while we looked)'
  const since = holder.backend_start ? `, connected ${holder.backend_start.toISOString()}` : ''
  return `held by pid ${holder.pid} (${holder.application_name || 'no application_name'}, ${holder.state ?? 'unknown state'}${since})`
}

/**
 * Apply every pending migration while holding `MIGRATION_LOCK_KEY`.
 *
 * Resolves only after `migrate` completed under the lock; rejects on a
 * migration failure, a lost connection or a wait longer than `maxWaitMs`.
 * The lock is released and the dedicated connection closed on every path —
 * and closing the session would release it regardless.
 */
export async function migrateUnderLock(options: MigrateUnderLockOptions): Promise<MigrationRun> {
  const { connectionString, migrationsFolder } = options
  const maxWaitMs = options.maxWaitMs ?? 5 * 60_000
  const pollMs = options.pollMs ?? 500
  const reportEveryMs = options.reportEveryMs ?? 10_000
  const log = options.log ?? ((line: string) => console.log(line))
  const key = MIGRATION_LOCK_KEY.toString()

  let ending = false
  let lost = false
  const client = postgres(connectionString, {
    max: 1,
    // Never recycle the connection on our own: the lock lives and dies with it.
    idle_timeout: 0,
    max_lifetime: null,
    connect_timeout: 10,
    prepare: false,
    onnotice: () => {},
    connection: { application_name: APPLICATION_NAME },
    onclose: () => {
      if (ending) return
      // The session — and the lock with it — is gone. postgres.js would
      // silently open a new connection for the next statement, which would then
      // run WITHOUT the lock; ending the client makes that statement fail instead.
      lost = true
      void client.end({ timeout: 0 })
    },
  })

  let locked = false
  try {
    const started = Date.now()
    let nextReport = started
    for (;;) {
      const [row] = await client<{ locked: boolean }[]>`select pg_try_advisory_lock(${key}::bigint) as locked`
      if (row.locked) break

      const waited = Date.now() - started
      if (waited >= maxWaitMs || Date.now() >= nextReport) {
        const [holder] = await client<Holder[]>`
          select a.pid, a.application_name, a.state, a.backend_start
          from pg_locks l join pg_stat_activity a on a.pid = l.pid
          where l.locktype = 'advisory' and l.granted
            and l.database = (select oid from pg_database where datname = current_database())
            and l.classid::bigint = (${key}::bigint >> 32)
            and l.objid::bigint = (${key}::bigint & 4294967295)
            and l.objsubid = 1`
        if (waited >= maxWaitMs) {
          throw new MigrationLockTimeoutError(
            `[db] gave up after ${Math.round(waited / 1000)}s waiting for the migration lock, ${describeHolder(holder)}`,
          )
        }
        log(`[db] waiting for the migration lock (${Math.round(waited / 1000)}s), ${describeHolder(holder)}`)
        nextReport = Date.now() + reportEveryMs
      }
      await new Promise((resolve) => setTimeout(resolve, pollMs))
    }
    locked = true
    const lockedAt = Date.now()
    const [{ pid: backendPid }] = await client<{ pid: number }[]>`select pg_backend_pid() as pid`
    if (lockedAt - started > pollMs) log(`[db] migration lock acquired after ${Math.round((lockedAt - started) / 1000)}s`)

    await migrate(drizzle(client), { migrationsFolder })
    const migratedAt = Date.now()

    // Belt and braces for the connection-loss guard above: the migrations just
    // ran on the session that holds the lock, and it still holds it.
    const [check] = await client<{ pid: number; held: boolean }[]>`
      select pg_backend_pid() as pid, exists (
        select 1 from pg_locks
        where locktype = 'advisory' and granted and pid = pg_backend_pid()
          and classid::bigint = (${key}::bigint >> 32)
          and objid::bigint = (${key}::bigint & 4294967295)
          and objsubid = 1
      ) as held`
    if (lost || check.pid !== backendPid || !check.held) {
      throw new Error('[db] the migration lock was lost while migrating; not treating the schema as migrated')
    }
    return { waitedMs: lockedAt - started, lockedAt, migratedAt, backendPid }
  } catch (error) {
    if (lost) throw new Error('[db] the migration lock connection closed mid-way; migrations will be retried under a new lock', { cause: error })
    throw error
  } finally {
    if (locked && !lost) {
      await client`select pg_advisory_unlock(${key}::bigint)`.catch(() => {})
    }
    ending = true
    await client.end({ timeout: 5 }).catch(() => {})
  }
}
