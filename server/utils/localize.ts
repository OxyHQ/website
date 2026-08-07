import type { Request } from 'express'
import { and, eq, inArray } from 'drizzle-orm'
import { db } from '../db/postgres.js'
import { translations } from '../db/schema/index.js'
import { applyTranslation, applyTranslations } from './applyTranslation.js'
import type { TRANSLATABLE_COLLECTIONS } from '../constants/translations.js'

type TranslatableCollection = (typeof TRANSLATABLE_COLLECTIONS)[number]

/** A row as it comes back from the database, with locale overrides merged in. */
export type LocalizedDoc = Record<string, unknown>

/**
 * Overlays the caller's locale on one row.
 *
 * On the default locale no translation lookup happens at all — the row is
 * returned exactly as stored.
 */
export async function localizeOne(
  req: Request,
  collectionName: TranslatableCollection,
  doc: LocalizedDoc,
): Promise<LocalizedDoc> {
  if (req.isDefaultLocale) return doc

  const [translation] = await db
    .select()
    .from(translations)
    .where(
      and(
        eq(translations.locale, req.locale),
        eq(translations.collectionName, collectionName),
        eq(translations.documentId, String(doc._id)),
      ),
    )
    .limit(1)
  return applyTranslation(doc, translation ?? null)
}

/**
 * Overlays the caller's locale on many rows, fetching every matching
 * translation in a single query.
 */
export async function localizeMany(
  req: Request,
  collectionName: TranslatableCollection,
  docs: LocalizedDoc[],
): Promise<LocalizedDoc[]> {
  if (req.isDefaultLocale || docs.length === 0) return docs

  const rows = await db
    .select()
    .from(translations)
    .where(
      and(
        eq(translations.locale, req.locale),
        eq(translations.collectionName, collectionName),
        inArray(translations.documentId, docs.map((doc) => String(doc._id))),
      ),
    )
  return applyTranslations(docs, rows)
}
