import { and, asc, count, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db, runInUnitOfWork } from '../../db/postgres.js'
import { locales, translations } from '../../db/schema/index.js'
import { TRANSLATABLE_COLLECTIONS } from '../../constants/translations.js'
import { createLocale, deleteLocale, updateLocale } from '../../services/locales.js'
import {
  compareWithSource, findSourceDocument, requireTranslationLocale, translatableFields, translationWhere, validateFields,
} from '../../services/translations.js'
import type { ToolRegistrar } from '../registry.js'
import { invalid, notFound, ok } from '../results.js'
import {
  deletedOutput, dryRunInput, expectedUpdatedAtInput, itemsOutput, limitInput, localeCodeInput, pagedOutput, pageInput, pageOf,
  recordOutput, slugInput, text,
} from '../schemas.js'
import { auditLog, deleteRecord, updateRecord } from '../writes.js'

/* Locales and translation overrides. */

const collectionInput = z.enum(TRANSLATABLE_COLLECTIONS)
const documentIdInput = z.string().min(1).max(64)

export function registerLocaleTools(server: ToolRegistrar): void {
  server.tool('list_locales', 'List locales in display order. Admins get every locale, enabled or not; readers get the enabled ones the public site serves, each with translation readiness.', {}, async () => {
    return ok(await db.select().from(locales).orderBy(asc(locales.order), asc(locales._id)))
  }, { output: 'items', outputSchema: itemsOutput })

  server.tool('create_locale', 'Create a locale. isDefault: true moves the default here atomically; if the create fails the previous default is untouched.', {
    code: localeCodeInput.describe('BCP-47 code, e.g. "es", "pt-BR"'),
    slug: slugInput.optional().describe('URL slug; defaults to the code in lower case'),
    name: text(80).min(1).describe('English name, e.g. "Spanish"'),
    nativeName: text(80).min(1).optional().describe('Native name, e.g. "Español"; defaults to name'),
    isDefault: z.boolean().optional().describe('Make this the default locale (exactly one enabled locale always is)'),
    enabled: z.boolean().optional().describe('Active on the site. Defaults to true.'),
    order: z.number().int().optional(),
  }, async (params, context) => {
    const locale = await createLocale(params)
    auditLog(context, 'create_locale', { code: locale.code, isDefault: locale.isDefault })
    return ok(locale)
  }, { outputSchema: recordOutput })

  server.tool('update_locale', 'Update a locale by code. Only the fields you pass change. isDefault: true moves the default here atomically; the current default cannot be unset or disabled directly — make another locale the default instead.', {
    code: text(35).min(1).describe('The locale code, e.g. "es"'),
    slug: slugInput.optional(),
    name: text(80).min(1).optional(),
    nativeName: text(80).min(1).optional(),
    isDefault: z.boolean().optional(),
    enabled: z.boolean().optional(),
    order: z.number().int().optional(),
  }, async ({ code, ...patch }, context) => {
    const locale = await updateLocale(code, patch)
    auditLog(context, 'update_locale', { code, isDefault: locale.isDefault })
    return ok(locale)
  }, { outputSchema: recordOutput })

  server.tool('delete_locale', 'Delete a locale and all its translations, in one transaction. The default locale cannot be deleted. dryRun: true reports how many translations would go.', {
    code: text(35).min(1).describe('The locale code, e.g. "es"'),
    dryRun: dryRunInput,
  }, async ({ code, dryRun }, context) => {
    if (dryRun) {
      const [locale] = await db.select().from(locales).where(eq(locales.code, code)).limit(1)
      if (!locale) throw notFound('Locale')
      const [n] = await db.select({ value: count() }).from(translations).where(eq(translations.locale, code))
      return ok({ deleted: false, dryRun: true, target: locale, allowed: !locale.isDefault, impact: { translations: Number(n?.value ?? 0) } })
    }
    const result = await deleteLocale(code)
    auditLog(context, 'delete_locale', result)
    return ok({ deleted: true, ...result })
  }, { outputSchema: deletedOutput })

  server.tool('list_translation_collections', 'List the collections that support translations, with the fields each lets a translation override.', {}, async () => {
    return ok(TRANSLATABLE_COLLECTIONS.map((collection) => ({ collection, translatableFields: [...translatableFields(collection).keys()].sort() })))
  }, { output: 'items', outputSchema: itemsOutput })

  server.tool('get_translations', 'List the translations of one collection in one locale, ordered by document. Returns { translations, total, page, pages }.', {
    collection: collectionInput,
    locale: localeCodeInput.describe('Locale code, e.g. "es"'),
    page: pageInput,
    limit: limitInput,
  }, async ({ collection, locale, ...paging }) => {
    const { page, limit, offset } = pageOf(paging)
    const where = and(eq(translations.collectionName, collection), eq(translations.locale, locale))
    const [rows, [totals]] = await Promise.all([
      db.select().from(translations).where(where).orderBy(asc(translations.documentId), asc(translations._id)).offset(offset).limit(limit),
      db.select({ value: count() }).from(translations).where(where),
    ])
    const total = Number(totals?.value ?? 0)
    return ok({ translations: rows, total, page, pages: Math.ceil(total / limit) })
  }, { outputSchema: pagedOutput('translations') })

  server.tool('get_translation', 'Get the translation of one document in one locale. includeSource: true adds the source values of the translated fields and the source fields not translated yet, for review.', {
    collection: collectionInput,
    documentId: documentIdInput.describe('The _id of the source document'),
    locale: localeCodeInput,
    includeSource: z.boolean().optional(),
  }, async ({ collection, documentId, locale, includeSource }) => {
    const [translation] = await db.select().from(translations).where(translationWhere(collection, documentId, locale)).limit(1)
    if (!translation) throw notFound('Translation')
    if (!includeSource) return ok(translation)
    const source = await findSourceDocument(collection, documentId)
    return ok({ ...translation, review: compareWithSource(collection, source, translation.fields) })
  }, { outputSchema: recordOutput })

  server.tool('upsert_translation', 'Write translation overrides for one document in one locale. By default the fields you send are MERGED into the existing overrides, so other translated fields are kept; removeFields drops specific overrides; mode: "replace" sets exactly the fields sent. Only content fields can be translated (list_translation_collections shows which), the document must exist and the locale must not be the default. dryRun: true returns the resulting overrides without saving.', {
    collection: collectionInput,
    documentId: documentIdInput.describe('The _id of the source document'),
    locale: localeCodeInput,
    fields: z.record(z.string().min(1).max(80), z.unknown()).describe('Overrides, e.g. { "title": "Hola", "resume": "Resumen…" }'),
    mode: z.enum(['merge', 'replace']).optional().describe('"merge" (default) or "replace"'),
    removeFields: z.array(z.string().min(1).max(80)).max(100).optional().describe('Overrides to remove (merge mode)'),
    expectedUpdatedAt: expectedUpdatedAtInput,
    dryRun: dryRunInput,
  }, async ({ collection, documentId, locale, fields, mode = 'merge', removeFields = [], expectedUpdatedAt, dryRun }, context) => {
    if (mode === 'replace' && removeFields.length > 0) throw invalid('removeFields only applies to merge mode')
    validateFields(collection, fields)
    const code = await requireTranslationLocale(locale)
    const source = await findSourceDocument(collection, documentId)

    return runInUnitOfWork(async () => {
      const [existing] = await db.select().from(translations).where(translationWhere(collection, documentId, code)).limit(1).for('update')
      const merged: Record<string, unknown> = mode === 'replace' ? { ...fields } : { ...(existing?.fields ?? {}), ...fields }
      for (const key of removeFields) delete merged[key]
      if (Object.keys(merged).length === 0) throw invalid('A translation needs at least one field; use delete_translation to remove it')
      const review = compareWithSource(collection, source, merged)
      const changes = {
        added: Object.keys(merged).filter((key) => !existing || !(key in existing.fields)),
        changed: Object.keys(merged).filter((key) => existing && key in existing.fields && JSON.stringify(existing.fields[key]) !== JSON.stringify(merged[key])),
        removed: existing ? Object.keys(existing.fields).filter((key) => !(key in merged)) : [],
      }
      if (dryRun) return ok({ dryRun: true, collection, documentId, locale: code, fields: merged, changes, review })

      let translation: Record<string, unknown>
      if (existing) {
        translation = await updateRecord({ table: translations, where: eq(translations._id, existing._id), label: 'Translation', patch: { fields: merged }, expectedUpdatedAt })
      } else {
        if (expectedUpdatedAt) throw invalid('expectedUpdatedAt was given but no translation exists yet')
        ;[translation] = await db.insert(translations).values({ collectionName: collection, documentId, locale: code, fields: merged }).returning()
      }
      auditLog(context, 'upsert_translation', { collection, documentId, locale: code, mode, ...changes })
      return ok({ ...translation, changes, review })
    })
  }, { outputSchema: recordOutput })

  server.tool('delete_translation', 'Delete the translation of one document in one locale; the document falls back to its default-locale text there. dryRun: true shows the overrides that would go.', {
    collection: collectionInput,
    documentId: documentIdInput,
    locale: localeCodeInput,
    dryRun: dryRunInput,
    expectedUpdatedAt: expectedUpdatedAtInput,
  }, async ({ collection, documentId, locale, dryRun, expectedUpdatedAt }, context) => {
    const result = await deleteRecord({
      table: translations,
      where: translationWhere(collection, documentId, locale),
      label: 'Translation',
      dryRun,
      expectedUpdatedAt,
      describe: (row) => ({ _id: row._id, collection, documentId, locale, fields: Object.keys(row.fields as Record<string, unknown>) }),
    })
    if (result.deleted) auditLog(context, 'delete_translation', { collection, documentId, locale })
    return ok(result.deleted ? { deleted: true, translation: result.target } : result)
  }, { outputSchema: deletedOutput })
}

