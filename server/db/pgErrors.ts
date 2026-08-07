/* ──────────────────────────────────────────────
 * Postgres error codes the routes actually branch on.
 *
 * Mongo signalled a duplicate key with `err.code === 11000`; Postgres uses
 * SQLSTATE `23505`. Every route that used to check the former checks this
 * instead, so a slug collision still answers 409 rather than 500.
 * ──────────────────────────────────────────── */

/** `unique_violation` — a row already exists for that unique key. */
export function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code?: string }).code === '23505'
}

/** `foreign_key_violation` — the row points at something that is not there. */
export function isForeignKeyViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code?: string }).code === '23503'
}
