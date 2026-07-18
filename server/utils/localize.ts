import type { Request } from 'express'
import { Translation } from '../models/Translation.js'
import { applyTranslation, applyTranslations } from './applyTranslation.js'
import type { TRANSLATABLE_COLLECTIONS } from '../constants/translations.js'

type TranslatableCollection = (typeof TRANSLATABLE_COLLECTIONS)[number]

/**
 * The only part of a Mongoose document these helpers need. `toJSON` is declared
 * as returning `unknown` because hydrated document types carry no string index
 * signature, which is what the structural merge below needs.
 */
interface TranslatableDoc {
  _id: { toString(): string }
  toJSON(): unknown
}

/** A document serialized to JSON, with any locale overrides merged in. */
export type LocalizedDoc = Record<string, unknown>

function toRecord(doc: TranslatableDoc): LocalizedDoc {
  return doc.toJSON() as LocalizedDoc
}

/**
 * Serializes one document and overlays the caller's locale.
 *
 * On the default locale no Translation lookup happens at all — the document is
 * returned exactly as stored.
 */
export async function localizeOne(
  req: Request,
  collectionName: TranslatableCollection,
  doc: TranslatableDoc,
): Promise<LocalizedDoc> {
  const json = toRecord(doc)
  if (req.isDefaultLocale) return json

  const translation = await Translation.findOne({
    locale: req.locale,
    collectionName,
    documentId: doc._id.toString(),
  })
  return applyTranslation(json, translation)
}

/**
 * Serializes many documents and overlays the caller's locale, fetching every
 * matching Translation in a single query.
 */
export async function localizeMany(
  req: Request,
  collectionName: TranslatableCollection,
  docs: TranslatableDoc[],
): Promise<LocalizedDoc[]> {
  const json = docs.map(toRecord)
  if (req.isDefaultLocale) return json

  const translations = await Translation.find({
    locale: req.locale,
    collectionName,
    documentId: { $in: docs.map(d => d._id.toString()) },
  })
  return applyTranslations(json, translations)
}
