/* ──────────────────────────────────────────────
 * Postgres error codes the routes actually branch on.
 *
 * A duplicate key is SQLSTATE `23505`. Every route that can collide on a
 * unique key checks this, so a slug collision answers 409 rather than 500.
 *
 * drizzle wraps a failed statement in a `DrizzleQueryError` whose `cause` is
 * the driver's error — the SQLSTATE lives there, not on the wrapper — so the
 * code is looked up through the cause chain.
 * ──────────────────────────────────────────── */

export interface PgErrorFields {
  code?: string
  constraint_name?: string
  detail?: string
}

/** The driver error carrying a SQLSTATE, whether thrown directly or wrapped. */
export function pgErrorOf(err: unknown): PgErrorFields | undefined {
  let current: unknown = err
  for (let depth = 0; depth < 5 && typeof current === 'object' && current !== null; depth += 1) {
    const code = (current as { code?: unknown }).code
    if (typeof code === 'string' && /^[0-9A-Z]{5}$/.test(code)) return current as PgErrorFields
    current = (current as { cause?: unknown }).cause
  }
  return undefined
}

/** `unique_violation` — a row already exists for that unique key. */
export function isUniqueViolation(err: unknown): boolean {
  return pgErrorOf(err)?.code === '23505'
}

/** `foreign_key_violation` — the row points at something that is not there. */
export function isForeignKeyViolation(err: unknown): boolean {
  return pgErrorOf(err)?.code === '23503'
}
