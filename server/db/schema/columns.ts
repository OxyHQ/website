import { sql } from 'drizzle-orm'
import { text, timestamp } from 'drizzle-orm/pg-core'

/* ──────────────────────────────────────────────
 * The two shapes every table in this schema repeats.
 *
 * Primary keys are the Mongo ObjectId hex string, kept under its Mongo name
 * `_id`. That is deliberate: the admin UI, every API response and every
 * cross-collection reference already speak in those ids, so keeping them means
 * the copy from Mongo is a straight insert and the DTOs the frontend receives
 * do not change at all during the cutover. New rows get a fresh ObjectId-shaped
 * id from `newObjectId()` rather than a uuid, so the two kinds are
 * indistinguishable to anything downstream.
 * ──────────────────────────────────────────── */

/** 24-character hex, the same shape Mongo's `_id` has. */
export const objectId = () =>
  text('_id')
    .primaryKey()
    .$defaultFn(() => newObjectId())

export const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
}

/**
 * A fresh ObjectId: 4 bytes of seconds, 5 random, 3 from a counter — the same
 * layout Mongo uses, so ids stay sortable by creation time and no consumer can
 * tell a Postgres-born id from a copied one.
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
