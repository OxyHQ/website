import { AsyncLocalStorage } from 'node:async_hooks'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema/index.js'

/* ──────────────────────────────────────────────
 * The Postgres connection, opened once per process.
 *
 * `DATABASE_URL` is the only knob: on ECS it is the SSM secret pointing at
 * `postgres.internal.oxy.so`, locally it is whatever container you are running.
 * There is no fallback to a hardcoded host — a missing URL is a configuration
 * error we want to hear about at boot rather than a silent connection to
 * somebody's laptop.
 * ──────────────────────────────────────────── */

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is not set. The website API cannot start without a database.')
}

/**
 * `prepare: false` because the shared instance sits behind a connection pooler
 * for other tenants; prepared statements do not survive a pooled connection
 * being handed to another session.
 */
export const sql = postgres(connectionString, {
  max: Number(process.env.DATABASE_POOL_MAX ?? 10),
  idle_timeout: 30,
  connect_timeout: 10,
  prepare: false,
  onnotice: () => {},
})

/**
 * The pool itself. Use it for writes that must outlive an enclosing unit of
 * work — a cleanup record for an object already deleted from storage has to
 * survive the rollback of the operation that deleted it.
 */
export const rootDb = drizzle(sql, { schema, casing: 'snake_case' })

type Database = typeof rootDb
type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0]

const unitOfWork = new AsyncLocalStorage<Transaction>()

/**
 * Run `work` so that every `db` call inside it — including the services it
 * calls — joins ONE transaction; a nested `db.transaction` becomes a savepoint.
 * This is how an MCP write and its idempotency record commit or roll back
 * together without threading a transaction through every handler.
 */
export function runInUnitOfWork<T>(work: () => Promise<T>): Promise<T> {
  const current = unitOfWork.getStore()
  if (current) return work()
  return rootDb.transaction((tx) => unitOfWork.run(tx, work))
}

/**
 * What the application uses: the pool, or the unit of work the current async
 * context is running in.
 */
export const db: Database = new Proxy(rootDb, {
  get(target, property) {
    const store = unitOfWork.getStore()
    // A transaction opened inside a unit of work is a savepoint, and the code
    // inside it must see THAT savepoint as `db` — otherwise its statements would
    // run on the outer transaction and a rollback to the savepoint could not
    // undo them.
    if (store && property === 'transaction') {
      return <T>(work: (tx: Transaction) => Promise<T>) => store.transaction((savepoint) => unitOfWork.run(savepoint, () => work(savepoint)))
    }
    const active = (store ?? target) as unknown as Record<PropertyKey, unknown>
    const value = Reflect.get(active, property)
    return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(active) : value
  },
}) as Database

/** Closes the pool. Used by scripts so a finished job exits instead of hanging. */
export async function closeDatabase(): Promise<void> {
  await sql.end({ timeout: 5 })
}
