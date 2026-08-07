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

export const db = drizzle(sql, { schema, casing: 'snake_case' })

/** Closes the pool. Used by scripts so a finished job exits instead of hanging. */
export async function closeDatabase(): Promise<void> {
  await sql.end({ timeout: 5 })
}
