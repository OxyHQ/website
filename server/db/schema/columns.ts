import { sql } from 'drizzle-orm'
import { text, timestamp } from 'drizzle-orm/pg-core'

/* ──────────────────────────────────────────────
 * The two shapes every table in this schema repeats.
 *
 * Primary keys are a 24-character hex id under the name `_id`. That is
 * deliberate: the admin UI, every API response and every cross-table reference
 * speak in those ids, so a row written years ago and one written today are the
 * same shape to everything downstream. New rows get one from `newObjectId()`
 * rather than a uuid, for the same reason.
 * ──────────────────────────────────────────── */

/** 24-character hex. */
export const objectId = () =>
  text('_id')
    .primaryKey()
    .$defaultFn(() => newObjectId())

export const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
}

/**
 * A fresh id: 4 bytes of seconds, 5 random, 3 from a counter, so ids stay
 * sortable by creation time and every row carries the same shape.
 */
let counter = Math.floor(Math.random() * 0xffffff)
const MACHINE = Array.from({ length: 5 }, () => Math.floor(Math.random() * 256))

export function newObjectId(): string {
  const seconds = Math.floor(Date.now() / 1000)
  counter = (counter + 1) % 0xffffff
  const bytes = [
    (seconds >> 24) & 0xff,
    (seconds >> 16) & 0xff,
    (seconds >> 8) & 0xff,
    seconds & 0xff,
    ...MACHINE,
    (counter >> 16) & 0xff,
    (counter >> 8) & 0xff,
    counter & 0xff,
  ]
  return bytes.map((byte) => byte.toString(16).padStart(2, '0')).join('')
}
