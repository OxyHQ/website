import { inArray } from 'drizzle-orm'
import type { PgTable } from 'drizzle-orm/pg-core'
import { db } from './postgres.js'

/* ──────────────────────────────────────────────
 * Reference expansion: a row hands over the referenced ROW, not its id.
 *
 * A row stores a reference as the `_id` of another table. The API has always
 * handed the frontend the referenced ROW in that field, not the id, so every
 * consumer — `resolveProductLogoUrl`, the admin forms, the nav — reads
 * `product.logo.url`. This keeps that contract: one extra query per referenced
 * table for the whole page of rows, never one per row.
 * ──────────────────────────────────────────── */

type Row = Record<string, unknown>

/**
 * Replaces each `field` on every row with the row it points at, or `null` when
 * the reference is empty or dangling. Returns the same array, mutated in place,
 * because the caller always wants the populated version.
 */
export async function populate<T extends Row>(rows: T[], refs: Record<string, PgTable>): Promise<T[]> {
  if (rows.length === 0) return rows

  for (const [field, table] of Object.entries(refs)) {
    const ids = [...new Set(rows.map((row) => row[field]).filter((id): id is string => typeof id === 'string' && id.length > 0))]
    if (ids.length === 0) {
      for (const row of rows) if (row[field] === undefined) (row as Row)[field] = null
      continue
    }

    const idColumn = (table as unknown as Record<string, never>)._id
    const referenced = await db.select().from(table).where(inArray(idColumn, ids))
    const byId = new Map(referenced.map((doc) => [(doc as Row)._id as string, doc]))

    for (const row of rows) {
      const id = row[field]
      ;(row as Row)[field] = typeof id === 'string' ? (byId.get(id) ?? null) : null
    }
  }

  return rows
}

/** The single-row form. `null` in, `null` out, so callers can pipe a lookup. */
export async function populateOne<T extends Row>(row: T | null | undefined, refs: Record<string, PgTable>): Promise<T | null> {
  if (!row) return null
  const [populated] = await populate([row], refs)
  return populated ?? null
}
