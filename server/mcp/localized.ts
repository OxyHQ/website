import { and, eq, inArray } from 'drizzle-orm'
import { db } from '../db/postgres.js'
import { locales, translations } from '../db/schema/index.js'
import { applyTranslations } from '../utils/applyTranslation.js'
import type { TRANSLATABLE_COLLECTIONS } from '../constants/translations.js'
import { invalid } from './results.js'

/* ──────────────────────────────────────────────
 * Locale overlays for admin reads.
 *
 * A reader's localized read goes to the public route with `?locale=`, which
 * overlays translations in `localizeMany`. An admin's read comes from the table,
 * so it gets the same overlay here — the same `applyTranslations` merge — and
 * both see the same text for the same locale.
 *
 * Unlike the public route, an unknown or disabled locale is an error rather
 * than a silent fallback to the default language: a caller who asked for
 * Spanish should not be handed English that looks like an answer.
 * ──────────────────────────────────────────── */

type Collection = (typeof TRANSLATABLE_COLLECTIONS)[number]
type Row = Record<string, unknown>

/** The locale to overlay, or `null` for the default locale (no overlay). */
export async function resolveReadLocale(locale: string | undefined): Promise<string | null> {
  if (!locale) return null
  const code = locale.toLowerCase()
  const rows = await db.select({ code: locales.code, isDefault: locales.isDefault }).from(locales).where(eq(locales.enabled, true))
  const match = rows.find((row) => row.code.toLowerCase() === code)
  if (!match) {
    throw invalid(`"${locale}" is not an enabled locale`, { enabled: rows.map((row) => row.code) })
  }
  return match.isDefault ? null : match.code
}

export async function overlayMany<T extends Row>(collection: Collection, rows: T[], locale: string | undefined): Promise<T[]> {
  const code = await resolveReadLocale(locale)
  if (!code || rows.length === 0) return rows
  const overlays = await db
    .select({ documentId: translations.documentId, fields: translations.fields })
    .from(translations)
    .where(and(
      eq(translations.locale, code),
      eq(translations.collectionName, collection),
      inArray(translations.documentId, rows.map((row) => String(row._id))),
    ))
  return applyTranslations(rows, overlays)
}

export async function overlayOne<T extends Row>(collection: Collection, row: T, locale: string | undefined): Promise<T> {
  const [overlaid] = await overlayMany(collection, [row], locale)
  return overlaid
}
