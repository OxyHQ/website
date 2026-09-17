import { z } from 'zod'
import { MEDIA_FOLDER_PATTERN } from '../services/media.js'
import { MAX_SLUG_LENGTH, SLUG_PATTERN } from '../services/slugs.js'

/* ──────────────────────────────────────────────
 * Input building blocks shared by every tool.
 *
 * One definition per kind of value, so a limit or a format is decided once:
 * a page size is a positive integer with a ceiling everywhere, a date is an
 * ISO date everywhere, a link is a site path or an http(s) URL everywhere.
 * Values that fail are refused before any handler runs, with the field named.
 * ──────────────────────────────────────────── */

export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100
export const MAX_PAGE = 10_000

export const pageInput = z.number().int().min(1).max(MAX_PAGE).optional().describe('Page number, from 1 (default 1)')
export const limitInput = z.number().int().min(1).max(MAX_PAGE_SIZE).optional().describe(`Results per page, 1–${MAX_PAGE_SIZE} (default ${DEFAULT_PAGE_SIZE})`)

export function pageOf(input: { page?: number; limit?: number }): { page: number; limit: number; offset: number } {
  const page = input.page ?? 1
  const limit = input.limit ?? DEFAULT_PAGE_SIZE
  return { page, limit, offset: (page - 1) * limit }
}

export const objectIdInput = z.string().regex(/^[0-9a-f]{24}$/i, 'Must be a 24-character hex _id')

export const slugInput = z.string().min(1).max(MAX_SLUG_LENGTH).regex(SLUG_PATTERN, 'Use lower-case letters, digits and single dashes')

/** A slug used to FIND a record: existing rows predate the strict pattern, so only the length is checked. */
export const slugLookup = z.string().min(1).max(200)

export const folderInput = z.string().regex(MEDIA_FOLDER_PATTERN, 'One lower-case segment of letters, digits and dashes, e.g. "newsroom"')

/** A source to download; `safeFetch` still validates every hop. */
export const sourceUrlInput = z.string().max(2048).url().refine((value) => /^https?:\/\//i.test(value), 'Must be an http(s) URL')

/** A destination a visitor is sent to: a site path or an absolute http(s) URL. */
export const linkInput = z
  .string()
  .max(2048)
  .refine((value) => (value.startsWith('/') && !value.startsWith('//')) || /^https?:\/\/[^\s]+$/i.test(value), 'Use a path starting with "/" or an http(s) URL')

/** Like `linkInput`, but an empty string clears the value. */
export const optionalLinkInput = z.union([z.literal(''), linkInput])

/** A calendar date or a full ISO 8601 timestamp. */
export const dateInput = z
  .string()
  .max(40)
  .refine((value) => /^\d{4}-\d{2}-\d{2}([T ][\d:.]+(Z|[+-]\d{2}:?\d{2})?)?$/.test(value) && !Number.isNaN(Date.parse(value)), 'Use an ISO date such as "2026-03-20" or "2026-03-20T10:00:00Z"')

export const hexColorInput = z.string().regex(/^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i, 'Use a hex colour such as "#7c3aed"')

export const localeCodeInput = z.string().min(2).max(35).regex(/^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/, 'A BCP-47 code such as "es" or "pt-BR"')

export const text = (max: number) => z.string().max(max)
export const title = z.string().min(1).max(300)
export const tagList = z.array(z.string().min(1).max(60)).max(30)
export const markdownBody = z.string().max(200_000)

/**
 * Optimistic concurrency. Pass the `updatedAt` you read; the change applies
 * only if the record has not changed since, otherwise `precondition_failed`
 * with the current value.
 */
export const expectedUpdatedAtInput = z
  .string()
  .max(40)
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Use the updatedAt value returned by a read')
  .optional()
  .describe('Optional. The updatedAt you last read. If the record changed since, nothing is written and the result is precondition_failed with the current updatedAt.')

export const dryRunInput = z
  .boolean()
  .optional()
  .describe('Optional. Report exactly what would change, without writing anything.')

/** Serve the read in this locale, overlaying its translations (as the public site does). */
export const readLocaleInput = localeCodeInput.optional().describe('Optional locale code (e.g. "es"): overlay that locale\'s translations, as the site does for /es/ pages')

/** A tool's success payload for a paginated list: `{ [key]: items, total, page, pages }`. */
export function pagedOutput(key: string): z.ZodObject {
  return z.object({
    [key]: z.array(z.record(z.string(), z.unknown())),
    total: z.number().int().min(0),
    page: z.number().int().min(1),
    pages: z.number().int().min(0),
  }).loose()
}

export const itemsOutput = z.object({ items: z.array(z.unknown()) })

/** A delete, or its dry run (`deleted: false, dryRun: true`). */
export const deletedOutput = z.object({ deleted: z.boolean() }).loose()

/** A record (`_id` null for a singleton never saved), or a dry run of a write to one. */
export const recordOutput = z.object({ _id: z.string().nullable().optional() }).loose()
