import { and, eq, ne, sql } from 'drizzle-orm'
import { db } from '../db/postgres.js'
import { locales, translations } from '../db/schema/index.js'
import { isUniqueViolation } from '../db/pgErrors.js'
import { invalidateLocaleCache } from '../middleware/locale.js'
import { DomainError } from '../utils/domainError.js'

/* ──────────────────────────────────────────────
 * Locales, with one invariant: exactly one enabled default.
 *
 * The site resolves its bare-path language from the default, so a moment with
 * none is a moment every request falls back to a guess. Every change that can
 * move the default — create, update, delete — runs in one transaction that
 * first takes the same advisory lock, so two of them cannot interleave, and the
 * invariant is re-checked on the rows the transaction actually sees.
 *
 * A locale's slug is its code, lower-cased, unless one is given.
 * ──────────────────────────────────────────── */

/** Arbitrary but fixed: the key every default-changing transaction serialises on. */
const DEFAULT_LOCALE_LOCK = 0x6c6f63616c65 // "locale"

export type LocaleRow = typeof locales.$inferSelect

export class LocaleError extends DomainError {
  override name = 'LocaleError'
}

export interface LocaleCreate {
  code: string
  name: string
  nativeName?: string
  slug?: string
  isDefault?: boolean
  enabled?: boolean
  order?: number
}

export type LocaleUpdate = Partial<Omit<LocaleCreate, 'code'>>

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

async function lockDefault(tx: Tx): Promise<void> {
  await tx.execute(sql`select pg_advisory_xact_lock(${DEFAULT_LOCALE_LOCK})`)
}

export function localeSlug(code: string): string {
  return code.trim().toLowerCase()
}

export async function createLocale(input: LocaleCreate): Promise<LocaleRow> {
  const isDefault = input.isDefault === true
  const enabled = input.enabled !== false
  if (isDefault && !enabled) throw new LocaleError('invalid', 'The default locale must be enabled')

  try {
    const created = await db.transaction(async (tx) => {
      await lockDefault(tx)
      const [row] = await tx
        .insert(locales)
        .values({
          code: input.code,
          name: input.name,
          nativeName: input.nativeName || input.name,
          slug: input.slug ? input.slug : localeSlug(input.code),
          isDefault,
          enabled,
          order: input.order ?? 0,
        })
        .returning()
      // Demoted only after the new row exists, inside the same transaction: a
      // failed insert rolls this back with it.
      if (isDefault) {
        await tx.update(locales).set({ isDefault: false, updatedAt: new Date() }).where(ne(locales._id, row._id))
      }
      return row
    })
    invalidateLocaleCache()
    return created
  } catch (error) {
    if (isUniqueViolation(error)) throw new LocaleError('conflict', `A locale with code or slug "${input.slug ?? input.code}" already exists`)
    throw error
  }
}

export async function updateLocale(code: string, patch: LocaleUpdate): Promise<LocaleRow> {
  try {
    const updated = await db.transaction(async (tx) => {
      await lockDefault(tx)
      const [current] = await tx.select().from(locales).where(eq(locales.code, code)).limit(1).for('update')
      if (!current) throw new LocaleError('not_found', 'Locale not found')

      const nextDefault = patch.isDefault ?? current.isDefault
      const nextEnabled = patch.enabled ?? current.enabled
      if (current.isDefault && patch.isDefault === false) {
        throw new LocaleError('invalid', 'The default locale cannot be unset directly; make another locale the default instead')
      }
      if (nextDefault && !nextEnabled) throw new LocaleError('invalid', 'The default locale must be enabled')

      const set: Record<string, unknown> = { updatedAt: new Date() }
      for (const key of ['name', 'nativeName', 'slug', 'isDefault', 'enabled', 'order'] as const) {
        if (patch[key] !== undefined) set[key] = patch[key]
      }
      const [row] = await tx.update(locales).set(set as never).where(eq(locales._id, current._id)).returning()
      if (patch.isDefault === true) {
        await tx
          .update(locales)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(and(ne(locales._id, row._id), eq(locales.isDefault, true)))
      }
      return row
    })
    invalidateLocaleCache()
    return updated
  } catch (error) {
    if (isUniqueViolation(error)) throw new LocaleError('conflict', `The slug "${patch.slug}" is already used by another locale`)
    throw error
  }
}

export async function deleteLocale(code: string): Promise<{ code: string; translationsRemoved: number }> {
  const result = await db.transaction(async (tx) => {
    await lockDefault(tx)
    const [current] = await tx.select().from(locales).where(eq(locales.code, code)).limit(1).for('update')
    if (!current) throw new LocaleError('not_found', 'Locale not found')
    // Read under the lock, so a concurrent "make this the default" cannot slip
    // between the check and the delete.
    if (current.isDefault) throw new LocaleError('invalid', 'Cannot delete the default locale')
    const removed = await tx.delete(translations).where(eq(translations.locale, code)).returning({ id: translations._id })
    await tx.delete(locales).where(eq(locales._id, current._id))
    return { code, translationsRemoved: removed.length }
  })
  invalidateLocaleCache()
  return result
}
