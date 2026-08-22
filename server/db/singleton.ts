import { eq } from 'drizzle-orm'
import type { PgTable } from 'drizzle-orm/pg-core'
import { db } from './postgres.js'

/* ──────────────────────────────────────────────
 * The one-row tables — site settings, the footer, the hero.
 *
 * The table holds exactly one row and nobody addresses it by id, so this is
 * the whole contract: update the row that is there, insert one if the table is
 * empty.
 * ──────────────────────────────────────────── */

export async function upsertSingleton(table: PgTable, values: Record<string, unknown>): Promise<unknown> {
  const idColumn = (table as unknown as Record<string, never>)._id
  const [existing] = await db.select().from(table as never).limit(1)

  if (!existing) {
    const [inserted] = await db
      .insert(table)
      .values(values as never)
      .returning()
    return inserted
  }

  const [updated] = await db
    .update(table)
    .set({ ...values, updatedAt: new Date() } as never)
    .where(eq(idColumn, (existing as Record<string, unknown>)._id as string))
    .returning()
  return updated
}
