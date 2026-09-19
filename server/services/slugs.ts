import { isUniqueViolation, pgErrorOf } from '../db/pgErrors.js'
import { newObjectId } from '../db/schema/columns.js'
import { DomainError } from '../utils/domainError.js'
import { db } from '../db/postgres.js'

/* ──────────────────────────────────────────────
 * Slugs: one rule for every table that has one.
 *
 * The unique index is the only guarantee. A "does this slug exist" read before
 * the insert tells you nothing once two requests run at once, so a generated
 * slug is claimed by inserting it and moving to the next candidate when the
 * index refuses. An explicit slug is the caller's chosen URL and is never
 * rewritten: a collision is reported, not papered over with a suffix.
 *
 * Each attempt runs in its own transaction — a savepoint when the caller is
 * already inside one — because in Postgres a failed statement aborts the
 * whole enclosing transaction, and the next candidate could never be tried.
 * ──────────────────────────────────────────── */

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export const MAX_SLUG_LENGTH = 120

/** Candidates tried with a numeric suffix before falling back to a random one. */
const NUMBERED_ATTEMPTS = 8

/**
 * A URL slug from free text. Diacritics fold to their base letter ("Diseñador
 * sénior" → "disenador-senior"); text with no Latin letters or digits at all
 * yields an empty string, which the caller replaces with a fallback.
 */
export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ß/g, 'ss')
    .replace(/[æÆ]/g, 'ae')
    .replace(/[øØ]/g, 'o')
    .replace(/[łŁ]/g, 'l')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, '')
}

/** The base a generated slug starts from; never empty. */
export function slugBase(source: string, fallbackPrefix: string): string {
  return slugify(source) || `${fallbackPrefix}-${newObjectId().slice(-8)}`
}

/** Whether a unique violation came from the slug index rather than another unique column. */
function isSlugCollision(error: unknown): boolean {
  if (!isUniqueViolation(error)) return false
  const fields = pgErrorOf(error)
  return /slug/.test(fields?.constraint_name ?? '') || /\(slug\)/.test(fields?.detail ?? '')
}

export class SlugConflictError extends DomainError {
  override name = 'SlugConflictError'
  constructor(readonly slug: string) {
    super('conflict', `The slug "${slug}" is already in use`, { slug })
  }
}

/**
 * Insert a row that needs a slug.
 *
 * `explicit` — the caller named the slug: one attempt, and a collision throws
 * {@link SlugConflictError}. Otherwise `base` is tried, then `base-2`, `base-3`…
 * and finally a random suffix, each claimed by the insert itself.
 */
export async function insertWithSlug<T>(
  options: { explicit?: string; base: string },
  insert: (slug: string) => Promise<T>,
): Promise<T> {
  if (options.explicit) {
    try {
      return await db.transaction(() => insert(options.explicit as string))
    } catch (error) {
      if (isSlugCollision(error)) throw new SlugConflictError(options.explicit)
      throw error
    }
  }

  const candidates = [options.base]
  for (let n = 2; n < NUMBERED_ATTEMPTS + 2; n += 1) candidates.push(withSuffix(options.base, String(n)))
  candidates.push(withSuffix(options.base, newObjectId().slice(-8)))

  let lastCollision: unknown
  for (const candidate of candidates) {
    try {
      return await db.transaction(() => insert(candidate))
    } catch (error) {
      if (!isSlugCollision(error)) throw error
      lastCollision = error
    }
  }
  throw lastCollision
}

function withSuffix(base: string, suffix: string): string {
  const room = MAX_SLUG_LENGTH - suffix.length - 1
  return `${base.slice(0, room).replace(/-+$/g, '')}-${suffix}`
}
