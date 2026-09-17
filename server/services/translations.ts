import { and, eq } from 'drizzle-orm'
import { getTableConfig, type PgColumn, type PgTable } from 'drizzle-orm/pg-core'
import { db } from '../db/postgres.js'
import {
  categories, changelogEntries, courses, footers, helpArticles, heroContents, jobs, locales, navigationDropdowns, newsroomPosts, pages,
  pricingPlans, products, resources, siteSettings, teamMembers, testimonials, translations,
} from '../db/schema/index.js'
import { TRANSLATABLE_COLLECTIONS } from '../constants/translations.js'
import { DomainError } from '../utils/domainError.js'

/* ──────────────────────────────────────────────
 * Translation overrides, validated.
 *
 * A translation row overlays a source document's fields for one locale (the
 * merge the public site applies is `applyTranslation`). Writing one through the
 * MCP must not be a way around the rest of the model, so:
 *
 * - the collection's document must exist, and the locale must be a real,
 *   non-default locale (default-locale copy lives in the document itself);
 * - only content fields can be overridden — never identity, ownership, state,
 *   ordering, references or dates, which a translation would otherwise let a
 *   caller change for one locale behind the editor's back;
 * - a value must have the column's shape (text for text, a list of strings
 *   for a text list, JSON for a JSON column);
 * - a partial update MERGES into the existing overrides by default, so sending
 *   one field never erases the others; replacing the whole set is explicit.
 * ──────────────────────────────────────────── */

export type TranslatableCollection = (typeof TRANSLATABLE_COLLECTIONS)[number]

export const COLLECTION_TABLES: Record<TranslatableCollection, PgTable & { _id: PgColumn; updatedAt: PgColumn }> = {
  navigation: navigationDropdowns,
  footer: footers,
  pricing: pricingPlans,
  testimonials,
  settings: siteSettings,
  pages,
  newsroom: newsroomPosts,
  jobs,
  hero: heroContents,
  products,
  categories,
  team: teamMembers,
  changelog: changelogEntries,
  courses,
  resources,
  help: helpArticles,
}

/** Never translatable, whatever the collection: identity, ownership, state, order, references, dates. */
const PROTECTED_FIELDS = new Set([
  '_id', 'createdAt', 'updatedAt', 'slug', 'status', 'active', 'featured', 'order', 'publishedAt', 'date',
  'oxyUserId', 'authorUsername', 'productId', 'code', 'isDefault', 'enabled', 'scope', 'kind', 'lifecycle',
  'showOnProducts', 'showOnStatus', 'showInNav', 'navOpensApp', 'external', 'highlighted', 'dark', 'themePreset',
  'coverImage', 'ogImage', 'logo', 'avatar', 'media', 'category', 'products', 'price', 'level', 'type',
  'githubReleaseId', 'repoOwner', 'repoName', 'repoDisplayName', 'htmlUrl', 'tagName',
  'backgroundVideoWebm', 'backgroundVideoMp4', 'backgroundPoster', 'brand', 'brandForeground', 'mark',
  'healthUrl', 'colorPrimary', 'colorSecondary', 'durationMinutes', 'address', 'validThrough',
])

const MAX_FIELDS_BYTES = 256 * 1024

export class TranslationError extends DomainError {
  override name = 'TranslationError'
}

type ColumnKind = 'text' | 'text[]' | 'json'

/** The columns of a collection that a translation may override, by property name. */
export function translatableFields(collection: TranslatableCollection): Map<string, ColumnKind> {
  const table = COLLECTION_TABLES[collection]
  const columns = table as unknown as Record<string, PgColumn>
  const config = getTableConfig(table)
  const byDbName = new Map(config.columns.map((column) => [column.name, column]))
  const fields = new Map<string, ColumnKind>()
  for (const [property, column] of Object.entries(columns)) {
    if (!column || typeof column !== 'object' || !('columnType' in column) || !byDbName.has(column.name)) continue
    if (PROTECTED_FIELDS.has(property)) continue
    if (column.columnType === 'PgText') fields.set(property, 'text')
    else if (column.columnType === 'PgArray') fields.set(property, 'text[]')
    else if (column.columnType === 'PgJsonb' || column.columnType === 'PgJson') fields.set(property, 'json')
  }
  return fields
}

function checkValue(field: string, kind: ColumnKind, value: unknown): void {
  const ok = kind === 'text'
    ? typeof value === 'string'
    : kind === 'text[]'
      ? Array.isArray(value) && value.every((item) => typeof item === 'string')
      : value !== null && typeof value === 'object'
  if (!ok) {
    const expected = kind === 'text' ? 'a string' : kind === 'text[]' ? 'a list of strings' : 'an object or list'
    throw new TranslationError('invalid', `Field "${field}" must be ${expected}`, { field })
  }
}

export function validateFields(collection: TranslatableCollection, fields: Record<string, unknown>): void {
  const allowed = translatableFields(collection)
  const refused = Object.keys(fields).filter((key) => !allowed.has(key))
  if (refused.length > 0) {
    throw new TranslationError('invalid', 'These fields cannot be translated in this collection', {
      refused,
      translatable: [...allowed.keys()].sort(),
    })
  }
  for (const [field, value] of Object.entries(fields)) checkValue(field, allowed.get(field) as ColumnKind, value)
  if (Buffer.byteLength(JSON.stringify(fields)) > MAX_FIELDS_BYTES) {
    throw new TranslationError('too_large', `Translation fields exceed ${MAX_FIELDS_BYTES / 1024} KiB`)
  }
}

export async function findSourceDocument(collection: TranslatableCollection, documentId: string): Promise<Record<string, unknown>> {
  const table = COLLECTION_TABLES[collection]
  const [row] = await db.select().from(table).where(eq(table._id, documentId)).limit(1)
  if (!row) throw new TranslationError('not_found', `No ${collection} document with _id ${documentId}`)
  return row as Record<string, unknown>
}

/** A locale a translation can be written for: known, and not the default. */
export async function requireTranslationLocale(code: string): Promise<string> {
  const [locale] = await db.select().from(locales).where(eq(locales.code, code)).limit(1)
  if (!locale) throw new TranslationError('invalid', `"${code}" is not a configured locale`)
  if (locale.isDefault) throw new TranslationError('invalid', `"${code}" is the default locale; edit the document itself instead`)
  return locale.code
}

export function translationWhere(collection: TranslatableCollection, documentId: string, locale: string) {
  return and(eq(translations.collectionName, collection), eq(translations.documentId, documentId), eq(translations.locale, locale))
}

/**
 * Source values for the translated fields, and the text fields the source has
 * that this translation does not override yet — what a reviewer compares.
 */
export function compareWithSource(collection: TranslatableCollection, source: Record<string, unknown>, fields: Record<string, unknown>) {
  const allowed = translatableFields(collection)
  const sourceValues = Object.fromEntries(Object.keys(fields).map((key) => [key, source[key] ?? null]))
  const untranslated = [...allowed.entries()]
    .filter(([key, kind]) => !(key in fields) && (kind === 'text' ? typeof source[key] === 'string' && source[key] !== '' : source[key] != null))
    .map(([key]) => key)
  return { source: sourceValues, untranslated }
}
