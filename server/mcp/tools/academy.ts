import { and, asc, count, desc, eq, sql, type SQL } from 'drizzle-orm'
import { z } from 'zod'
import { db, runInUnitOfWork } from '../../db/postgres.js'
import { populate, populateOne } from '../../db/refs.js'
import { categories, courses, helpArticles, media, resources, translations } from '../../db/schema/index.js'
import { insertWithSlug, slugBase } from '../../services/slugs.js'
import { overlayMany, overlayOne } from '../localized.js'
import type { ToolRegistrar, ToolShape } from '../registry.js'
import { notFound, ok } from '../results.js'
import {
  dateInput, deletedOutput, dryRunInput, expectedUpdatedAtInput, limitInput, linkInput, markdownBody, objectIdInput, pagedOutput, pageInput, pageOf,
  readLocaleInput, recordOutput, slugInput, slugLookup, tagList, text, title,
} from '../schemas.js'
import { auditLog, deleteRecord, updateRecord } from '../writes.js'

/* Academy courses and resources, and Help Center articles: three editorial
   collections with the same lifecycle (slug, category, cover, tags, featured,
   draft/published, order), declared once and specialised by their own fields. */

const STATUS = z.enum(['draft', 'published'])
const CONTENT_REFS = { coverImage: media, category: categories }
const RESOURCE_TYPES = ['guide', 'paper', 'video', 'tool', 'template', 'link'] as const
const LEVELS = ['beginner', 'intermediate', 'advanced'] as const

type EditorialTable = typeof courses | typeof resources | typeof helpArticles

interface Collection {
  /** Tool noun: create_<noun>, list_<plural>. */
  noun: string
  plural: string
  /** Response key of the paginated list, matching the REST route. */
  listKey: string
  label: string
  table: EditorialTable
  translationCollection: 'courses' | 'resources' | 'help'
  fields: ToolShape
  requiredOnCreate?: ToolShape
  /** Extra list filters beyond category/tag/featured/status. */
  filters?: ToolShape
  applyFilters?: (input: Record<string, unknown>) => SQL[]
  what: string
}

const lessonSchema = z.object({
  title: title,
  slug: slugInput.describe('Unique within the course'),
  content: markdownBody.optional(),
  order: z.number().int().optional(),
  videoUrl: linkInput.optional(),
  durationMinutes: z.number().int().min(0).max(10_000).optional(),
})

const COLLECTIONS: Collection[] = [
  {
    noun: 'course', plural: 'courses', listKey: 'courses', label: 'Course', table: courses, translationCollection: 'courses', what: 'Academy course',
    fields: {
      summary: text(1000).optional().describe('Card summary (1-2 sentences)'),
      description: markdownBody.optional().describe('Detail page description (Markdown)'),
      level: z.enum(LEVELS).optional().describe('Difficulty'),
      durationMinutes: z.number().int().min(0).max(100_000).optional(),
      lessons: z.array(lessonSchema).max(200).optional().describe('Replaces the whole lesson list when given'),
    },
    filters: { level: z.enum(LEVELS).optional().describe('Admins only: difficulty') },
    applyFilters: (input) => (input.level ? [eq(courses.level, String(input.level))] : []),
  },
  {
    noun: 'resource', plural: 'resources', listKey: 'resources', label: 'Resource', table: resources, translationCollection: 'resources', what: 'Academy resource (guide, paper, video, tool, template or link)',
    fields: {
      summary: text(1000).optional(),
      type: z.enum(RESOURCE_TYPES).optional().describe('Defaults to "guide"'),
      external: z.boolean().optional().describe('Off-site destination'),
    },
    requiredOnCreate: { href: linkInput.describe('A site path like "/academy/…" or an external URL') },
    filters: { type: z.enum(RESOURCE_TYPES).optional() },
    applyFilters: (input) => (input.type ? [eq(resources.type, String(input.type))] : []),
  },
  {
    noun: 'help_article', plural: 'help_articles', listKey: 'articles', label: 'Help article', table: helpArticles, translationCollection: 'help', what: 'Help Center article',
    fields: {
      summary: text(1000).optional(),
      content: markdownBody.optional().describe('Article body (Markdown)'),
      icon: z.union([z.literal(''), z.string().max(60).regex(/^[a-z0-9-]+$/, 'A lucide icon name in kebab-case, e.g. "rocket"')]).optional(),
    },
  },
]

const commonFields = {
  coverImage: z.union([z.literal(''), objectIdInput]).optional().describe('Media _id; empty string clears it'),
  category: z.union([z.literal(''), objectIdInput]).optional().describe('Category _id (generic scope); empty string clears it'),
  tags: tagList.optional(),
  featured: z.boolean().optional(),
  publishedAt: dateInput.optional(),
  order: z.number().int().optional().describe('Display order (lower first)'),
}

function normalize(fields: Record<string, unknown>): Record<string, unknown> {
  const next: Record<string, unknown> = { ...fields }
  if (fields.coverImage !== undefined) next.coverImage = fields.coverImage || null
  if (fields.category !== undefined) next.category = fields.category || null
  if (typeof fields.publishedAt === 'string') next.publishedAt = new Date(fields.publishedAt)
  return next
}

function translationsOf(collection: Collection, id: unknown) {
  return and(eq(translations.collectionName, collection.translationCollection), eq(translations.documentId, String(id)))
}

function register(server: ToolRegistrar, collection: Collection): void {
  const { table, noun, label } = collection

  server.tool(`list_${collection.plural}`, `List ${collection.what}s: order ascending, then newest. Returns { ${collection.listKey}, total, page, pages }. Readers always get published entries.`, {
    category: objectIdInput.optional().describe('Category _id'),
    tag: text(60).optional(),
    featured: z.boolean().optional().describe('true: only featured. false: only not featured (admins only).'),
    status: STATUS.optional().describe('Admins only. Omit for every status.'),
    ...(collection.filters ?? {}),
    locale: readLocaleInput,
    page: pageInput,
    limit: limitInput,
  }, async (input) => {
    const filters: SQL[] = []
    if (input.category) filters.push(eq(table.category, String(input.category)))
    if (input.tag) filters.push(sql`${table.tags} @> ARRAY[${input.tag}]::text[]`)
    if (input.featured !== undefined) filters.push(eq(table.featured, Boolean(input.featured)))
    if (input.status) filters.push(eq(table.status, String(input.status)))
    filters.push(...(collection.applyFilters?.(input) ?? []))
    const where = filters.length > 0 ? and(...filters) : undefined
    const { page, limit, offset } = pageOf(input as { page?: number; limit?: number })
    const [rows, [totals]] = await Promise.all([
      db.select().from(table).where(where).orderBy(asc(table.order), desc(table.publishedAt), asc(table._id)).offset(offset).limit(limit),
      db.select({ value: count() }).from(table).where(where),
    ])
    const total = Number(totals?.value ?? 0)
    const items = await overlayMany(collection.translationCollection, await populate(rows as Record<string, unknown>[], CONTENT_REFS), input.locale as string | undefined)
    return ok({ [collection.listKey]: items, total, page, pages: Math.ceil(total / limit) })
  }, { outputSchema: pagedOutput(collection.listKey), localized: true })

  server.tool(`get_${noun}`, `Get one ${collection.what} by slug, cover image and category resolved. Readers only see published entries.`, {
    slug: slugLookup,
    locale: readLocaleInput,
  }, async ({ slug, locale }) => {
    const [row] = await db.select().from(table).where(eq(table.slug, slug)).limit(1)
    if (!row) throw notFound(label)
    return ok(await overlayOne(collection.translationCollection, (await populateOne(row as Record<string, unknown>, CONTENT_REFS)) as Record<string, unknown>, locale))
  }, { outputSchema: recordOutput, localized: true })

  server.tool(`create_${noun}`, `Create a ${collection.what}. Published immediately unless status is "draft". If slug is omitted it is generated from the title (a numeric suffix is added if taken); an explicit slug that is taken is refused.`, {
    title,
    slug: slugInput.optional().describe('Generated from the title if omitted'),
    status: STATUS.optional().describe('"published" (default) or "draft"'),
    ...(collection.requiredOnCreate ?? {}),
    ...collection.fields,
    ...commonFields,
  }, async (params, context) => {
    const { slug: explicit, ...fields } = params as Record<string, unknown> & { slug?: string; title: string }
    // `.returning()` hands the row back; without it the insert resolved to a
    // driver result and the tool answered success with null.
    const row = await insertWithSlug({ explicit, base: slugBase(String(fields.title), noun.replace('_', '-')) }, async (slug) => {
      const [inserted] = await db.insert(table).values({ publishedAt: new Date(), ...normalize(fields), slug } as never).returning()
      if (!inserted) throw new Error('Insert returned no row')
      return inserted as Record<string, unknown>
    })
    auditLog(context, `create_${noun}`, { id: row._id, slug: row.slug })
    return ok(await populateOne(row, CONTENT_REFS))
  }, { outputSchema: recordOutput })

  const optionalCreateOnly = Object.fromEntries(Object.entries(collection.requiredOnCreate ?? {}).map(([key, schema]) => [key, schema.optional()]))
  server.tool(`update_${noun}`, `Update a ${collection.what} by slug. Only the fields you pass change.`, {
    slug: slugLookup.describe('Current slug'),
    newSlug: slugInput.optional().describe('New slug; must be unused'),
    title: title.optional(),
    status: STATUS.optional(),
    ...optionalCreateOnly,
    ...collection.fields,
    ...commonFields,
    expectedUpdatedAt: expectedUpdatedAtInput,
  }, async (params, context) => {
    const { slug, newSlug, expectedUpdatedAt, ...fields } = params as Record<string, unknown> & { slug: string; newSlug?: string; expectedUpdatedAt?: string }
    const row = await updateRecord({ table, where: eq(table.slug, slug), label, patch: { ...normalize(fields), slug: newSlug }, expectedUpdatedAt })
    auditLog(context, `update_${noun}`, { id: row._id, slug: row.slug })
    return ok(await populateOne(row, CONTENT_REFS))
  }, { outputSchema: recordOutput })

  server.tool(`delete_${noun}`, `Permanently delete a ${collection.what} and its translations. dryRun: true shows what would go. To unpublish, set status: "draft" instead.`, {
    slug: slugLookup,
    dryRun: dryRunInput,
    expectedUpdatedAt: expectedUpdatedAtInput,
  }, async ({ slug, dryRun, expectedUpdatedAt }, context) => {
    const outcome = await runInUnitOfWork(async () => {
      const result = await deleteRecord({
        table,
        where: eq(table.slug, slug),
        label,
        dryRun,
        expectedUpdatedAt,
        describe: (row) => ({ _id: row._id, slug: row.slug, title: row.title, status: row.status }),
        impact: async (row) => {
          const [n] = await db.select({ value: count() }).from(translations).where(translationsOf(collection, row._id))
          return { translations: Number(n?.value ?? 0) }
        },
      })
      if (!result.deleted) return result
      const removed = await db.delete(translations).where(translationsOf(collection, result.target._id)).returning({ id: translations._id })
      return { deleted: true as const, slug, [noun]: result.target, translationsRemoved: removed.length }
    })
    if (outcome.deleted) auditLog(context, `delete_${noun}`, { slug })
    return ok(outcome)
  }, { outputSchema: deletedOutput })
}

export function registerAcademyTools(server: ToolRegistrar): void {
  for (const collection of COLLECTIONS) register(server, collection)
}
