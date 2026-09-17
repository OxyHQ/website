import { and, eq, sql, type SQL } from 'drizzle-orm'
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core'
import { db } from '../db/postgres.js'
import { invalid, notFound, ToolError } from './results.js'
import type { ToolContext } from './registry.js'

/* ──────────────────────────────────────────────
 * The write patterns every domain repeats, done once.
 *
 * - An update applies only the fields given, and — when the caller passes the
 *   `updatedAt` it read — only if the record has not changed since. The check is
 *   part of the UPDATE's WHERE, so two editors cannot both pass it.
 * - A delete can be previewed (`dryRun`) with the same lookup and precondition
 *   it would run, and nothing is written.
 * - Every applied write leaves one `[mcp:audit]` line.
 * ──────────────────────────────────────────── */

type Row = Record<string, unknown>

interface Timestamped {
  _id: PgColumn
  updatedAt: PgColumn
}

/** Compared at millisecond precision: a JS Date cannot carry Postgres' microseconds. */
function unchangedSince(table: Timestamped, expectedUpdatedAt: string): SQL {
  return sql`date_trunc('milliseconds', ${table.updatedAt}) = ${new Date(expectedUpdatedAt).toISOString()}::timestamptz`
}

function iso(value: unknown): string | null {
  return value instanceof Date ? value.toISOString() : typeof value === 'string' ? value : null
}

async function explainMiss(table: PgTable & Timestamped, where: SQL, label: string): Promise<never> {
  const [current] = await db.select({ updatedAt: table.updatedAt }).from(table).where(where).limit(1)
  if (!current) throw notFound(label)
  throw new ToolError('precondition_failed', `${label} changed since it was read; read it again and reapply your change`, {
    currentUpdatedAt: iso(current.updatedAt),
  })
}

/** Drop `undefined` so an omitted field is never written. */
export function definedFields(patch: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined))
}

export async function updateRecord(options: {
  table: PgTable & Timestamped
  where: SQL
  label: string
  patch: Record<string, unknown>
  expectedUpdatedAt?: string
}): Promise<Row> {
  const patch = definedFields(options.patch)
  if (Object.keys(patch).length === 0) throw invalid('Pass at least one field to change')
  const conditions = [options.where]
  if (options.expectedUpdatedAt) conditions.push(unchangedSince(options.table, options.expectedUpdatedAt))
  const [row] = await db
    .update(options.table)
    .set({ ...patch, updatedAt: new Date() } as never)
    .where(and(...conditions))
    .returning()
  if (row) return row as Row
  return explainMiss(options.table, options.where, options.label)
}

export interface DeletePreview {
  deleted: false
  dryRun: true
  target: Row
  updatedAt: string | null
  impact?: Record<string, unknown>
}

export async function deleteRecord(options: {
  table: PgTable & Timestamped
  where: SQL
  label: string
  expectedUpdatedAt?: string
  dryRun?: boolean
  /** The fields that identify the record in a preview. */
  describe: (row: Row) => Row
  /** What else the delete would take with it. */
  impact?: (row: Row) => Promise<Record<string, unknown>>
}): Promise<{ deleted: true; target: Row } | DeletePreview> {
  const conditions = [options.where]
  if (options.expectedUpdatedAt) conditions.push(unchangedSince(options.table, options.expectedUpdatedAt))

  if (options.dryRun) {
    const [row] = await db.select().from(options.table).where(and(...conditions)).limit(1)
    if (!row) return explainMiss(options.table, options.where, options.label)
    const record = row as Row
    return {
      deleted: false,
      dryRun: true,
      target: options.describe(record),
      updatedAt: iso(record.updatedAt),
      ...(options.impact ? { impact: await options.impact(record) } : {}),
    }
  }

  const [row] = await db.delete(options.table).where(and(...conditions)).returning()
  if (!row) return explainMiss(options.table, options.where, options.label)
  return { deleted: true, target: options.describe(row as Row) }
}

/**
 * One line per applied write: which tool, which account, which record. The
 * actor is the authenticated account, never an input field, and the target is
 * the minimum that identifies the record — no bodies, no URLs, no personal data.
 */
export function auditLog(context: ToolContext, tool: string, target: Record<string, unknown>): void {
  console.log(`[mcp:audit] ${JSON.stringify({ tool, actor: context.actorId, request: context.requestId, target })}`)
}

export { eq }
