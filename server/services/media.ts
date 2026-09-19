import path from 'node:path'
import { and, asc, count, eq, inArray, lte, ne, or, sql, type SQL } from 'drizzle-orm'
import { getTableConfig, PgTable, type PgColumn } from 'drizzle-orm/pg-core'
import { is } from 'drizzle-orm'
import { db, rootDb } from '../db/postgres.js'
import * as schema from '../db/schema/index.js'
import { heroContents, media, seoEntries, storageCleanups, testimonials } from '../db/schema/index.js'
import { buildObjectKey, deleteFromSpaces, keyFromPublicUrl, publicUrlForKey, uploadToSpaces } from './s3.js'
import { processImage } from './thumbnails.js'
import { DomainError } from '../utils/domainError.js'

/* ──────────────────────────────────────────────
 * The media pipeline: validate, store, attach, delete — and account for every
 * object it creates.
 *
 * Three rules hold throughout:
 *
 * 1. Nothing is uploaded until the bytes are known to be a supported raster
 *    image. The declared Content-Type is never trusted, and a thumbnail
 *    failing to generate is not evidence either way — so the original is
 *    checked on its own (signature, then a real decode under a pixel ceiling).
 * 2. An object key is content-addressed and can be shared by several media
 *    rows. No object is deleted while any media row still uses its key.
 * 3. A delete the storage refuses is not forgotten: the key is recorded in
 *    `storage_cleanups` in the same transaction that removes the row, and a
 *    sweep retries it.
 * ──────────────────────────────────────────── */

export type MediaRow = typeof media.$inferSelect

export class MediaError extends DomainError {
  override name = 'MediaError'
}

// ── Validation ──────────────────────────────────────────────────────────────

export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'] as const
export type SupportedImageType = (typeof SUPPORTED_IMAGE_TYPES)[number]

const EXTENSION: Record<SupportedImageType, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/avif': '.avif',
}

/** Decoded-size ceiling: a small file can still expand into a huge bitmap. */
export const MAX_IMAGE_PIXELS = 40_000_000
export const MAX_IMAGE_DIMENSION = 12_000

/** A folder is one lower-case segment under `oxy-website/`, never a path. */
export const MEDIA_FOLDER_PATTERN = /^[a-z0-9][a-z0-9-]{0,39}$/

/** The image type the bytes themselves declare, or `null`. */
export function sniffImageType(buffer: Buffer): SupportedImageType | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg'
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png'
  if (buffer.length >= 6) {
    const head = buffer.subarray(0, 6).toString('latin1')
    if (head === 'GIF87a' || head === 'GIF89a') return 'image/gif'
  }
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString('latin1') === 'RIFF' && buffer.subarray(8, 12).toString('latin1') === 'WEBP') return 'image/webp'
  if (buffer.length >= 12 && buffer.subarray(4, 8).toString('latin1') === 'ftyp') {
    const brand = buffer.subarray(8, 12).toString('latin1')
    if (brand === 'avif' || brand === 'avis') return 'image/avif'
  }
  return null
}

export interface InspectedImage {
  mimeType: SupportedImageType
  width?: number
  height?: number
  /** False when the decoder could not be loaded; the signature check still ran. */
  decoded: boolean
}

type SharpModule = typeof import('sharp')['default']

async function loadSharp(): Promise<SharpModule | null> {
  try {
    return (await import('sharp')).default
  } catch {
    return null
  }
}

export async function inspectImage(buffer: Buffer): Promise<InspectedImage> {
  if (buffer.length === 0) throw new MediaError('invalid', 'The file is empty')
  const mimeType = sniffImageType(buffer)
  if (!mimeType) {
    const head = buffer.subarray(0, 512).toString('utf8').trimStart().toLowerCase()
    if (head.startsWith('<') && head.includes('<svg')) {
      throw new MediaError('invalid', 'SVG is not accepted: it can carry active content. Upload a PNG, JPEG, WebP, GIF or AVIF instead.')
    }
    throw new MediaError('invalid', 'The file is not a supported image (JPEG, PNG, GIF, WebP or AVIF)')
  }

  const sharp = await loadSharp()
  if (!sharp) {
    console.warn('[media] sharp unavailable: accepting image on its signature alone, without dimensions or thumbnails')
    return { mimeType, decoded: false }
  }
  let metadata: import('sharp').Metadata
  try {
    metadata = await sharp(buffer, { limitInputPixels: MAX_IMAGE_PIXELS, failOn: 'error' }).metadata()
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (/pixel limit/i.test(message)) throw new MediaError('too_large', `The image exceeds ${MAX_IMAGE_PIXELS} pixels`)
    throw new MediaError('invalid', 'The image could not be decoded')
  }
  const { width, height } = metadata
  if (!width || !height) throw new MediaError('invalid', 'The image has no readable dimensions')
  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION || width * height > MAX_IMAGE_PIXELS) {
    throw new MediaError('too_large', `The image is ${width}×${height}; the limit is ${MAX_IMAGE_DIMENSION}px a side and ${MAX_IMAGE_PIXELS} pixels`)
  }
  return { mimeType, width, height, decoded: true }
}

export function normalizeFolder(folder: string | undefined, fallback = 'images'): string {
  const value = folder ?? fallback
  if (!MEDIA_FOLDER_PATTERN.test(value)) {
    throw new MediaError('invalid', 'folder must be one lower-case segment of letters, digits and dashes (e.g. "newsroom")')
  }
  return value
}

/** A stored filename whose extension matches what the bytes are. */
export function normalizeFilename(requested: string | undefined, mimeType: SupportedImageType, fallback = 'image'): string {
  const base = path.basename(requested ?? '').replace(/\.[^.]*$/, '')
  const safe = base.replace(/[^a-z0-9_-]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || fallback
  return `${safe}${EXTENSION[mimeType]}`
}

// ── Object ownership ────────────────────────────────────────────────────────

type Executor = Pick<typeof db, 'select'>

/** Whether any media row other than `excludeId` still uses this key. */
export async function isKeyInUse(key: string, executor: Executor = db, excludeId?: string): Promise<boolean> {
  const url = publicUrlForKey(key)
  const uses = or(
    eq(media.key, key),
    eq(media.url, url),
    sql`${media.thumbnails}->>'sm' = ${url}`,
    sql`${media.thumbnails}->>'md' = ${url}`,
    sql`${media.thumbnails}->>'lg' = ${url}`,
  ) as SQL
  const [row] = await executor
    .select({ id: media._id })
    .from(media)
    .where(excludeId ? and(uses, ne(media._id, excludeId)) : uses)
    .limit(1)
  return Boolean(row)
}

/** Every object key a media row owns: the original and each thumbnail. */
export function objectKeysOf(row: Pick<MediaRow, 'key' | 'thumbnails'>): { keys: string[]; unparseable: string[] } {
  const keys = new Set<string>([row.key])
  const unparseable: string[] = []
  for (const url of [row.thumbnails?.sm, row.thumbnails?.md, row.thumbnails?.lg]) {
    if (!url) continue
    const key = keyFromPublicUrl(url)
    if (key) keys.add(key)
    else unparseable.push(url)
  }
  return { keys: [...keys], unparseable }
}

const RETRY_BASE_MS = 60_000
const RETRY_CAP_MS = 24 * 60 * 60 * 1000

function nextAttemptAfter(attempts: number): Date {
  return new Date(Date.now() + Math.min(RETRY_BASE_MS * 2 ** Math.max(0, attempts - 1), RETRY_CAP_MS))
}

function describeStorageError(error: unknown): string {
  const name = error instanceof Error ? error.name : 'Error'
  const message = error instanceof Error ? error.message : String(error)
  return `${name}: ${message}`.slice(0, 300)
}

/**
 * Try to delete owed objects now. Each key is re-checked against the media
 * table first: a row created since the debt was recorded owns it again.
 */
async function settleCleanups(
  rows: { _id: string; key: string; attempts: number }[],
  executor: typeof db = db,
): Promise<{ deleted: string[]; pending: string[]; kept: string[] }> {
  const deleted: string[] = []
  const pending: string[] = []
  const kept: string[] = []
  for (const row of rows) {
    if (await isKeyInUse(row.key, executor)) {
      await executor.delete(storageCleanups).where(eq(storageCleanups._id, row._id))
      kept.push(row.key)
      continue
    }
    try {
      await deleteFromSpaces(row.key)
      await executor.delete(storageCleanups).where(eq(storageCleanups._id, row._id))
      deleted.push(row.key)
    } catch (error) {
      const attempts = row.attempts + 1
      await executor
        .update(storageCleanups)
        .set({ attempts, lastError: describeStorageError(error), nextAttemptAt: nextAttemptAfter(attempts), updatedAt: new Date() })
        .where(eq(storageCleanups._id, row._id))
      pending.push(row.key)
    }
  }
  return { deleted, pending, kept }
}

/** Record keys as owed, skipping any another media row still uses. */
async function owe(
  tx: Pick<typeof db, 'select' | 'insert'>,
  keys: string[],
  reason: string,
  mediaId: string | null,
): Promise<{ owed: { _id: string; key: string; attempts: number }[]; shared: string[] }> {
  const owed: { _id: string; key: string; attempts: number }[] = []
  const shared: string[] = []
  for (const key of keys) {
    if (await isKeyInUse(key, tx, mediaId ?? undefined)) {
      shared.push(key)
      continue
    }
    const [row] = await tx
      .insert(storageCleanups)
      .values({ key, reason, mediaId })
      .onConflictDoUpdate({ target: storageCleanups.key, set: { nextAttemptAt: new Date(), updatedAt: new Date() } })
      .returning({ _id: storageCleanups._id, key: storageCleanups.key, attempts: storageCleanups.attempts })
    owed.push(row)
  }
  return { owed, shared }
}

/**
 * Undo the objects a failed operation uploaded — only those it uploaded, and
 * only while no media row uses them. Never throws: a compensation failure is
 * recorded for the sweep instead of masking the original error. Written on the
 * pool, not the caller's unit of work, which is about to roll back.
 */
export async function compensateUploads(keys: string[]): Promise<void> {
  if (keys.length === 0) return
  try {
    const { owed } = await rootDb.transaction((tx) => owe(tx, keys, 'upload_compensation', null))
    await settleCleanups(owed, rootDb)
  } catch (error) {
    console.error(`[media] could not compensate ${keys.length} uploaded object(s):`, error)
  }
}

/** One pass of the durable cleanup queue; safe to run from several tasks at once. */
export async function retryStorageCleanups(limit = 25): Promise<{ deleted: number; pending: number; kept: number }> {
  const claimed = await db
    .update(storageCleanups)
    .set({ nextAttemptAt: sql`now() + interval '10 minutes'`, updatedAt: new Date() })
    .where(
      inArray(
        storageCleanups._id,
        db
          .select({ id: storageCleanups._id })
          .from(storageCleanups)
          .where(lte(storageCleanups.nextAttemptAt, new Date()))
          .orderBy(asc(storageCleanups.nextAttemptAt), asc(storageCleanups._id))
          .limit(limit)
          .for('update', { skipLocked: true }),
      ),
    )
    .returning({ _id: storageCleanups._id, key: storageCleanups.key, attempts: storageCleanups.attempts })
  const result = await settleCleanups(claimed)
  return { deleted: result.deleted.length, pending: result.pending.length, kept: result.kept.length }
}

export async function pendingStorageCleanupCount(): Promise<number> {
  const [row] = await db.select({ value: count() }).from(storageCleanups)
  return Number(row?.value ?? 0)
}

let sweep: ReturnType<typeof setInterval> | null = null

/** Started once after bootstrap, like the other intervals in `server/index.ts`. */
export function startStorageCleanupSweep(intervalMs = 15 * 60 * 1000): void {
  if (sweep) return
  const run = () => {
    retryStorageCleanups().catch((error: unknown) => console.error('[media] storage cleanup sweep failed:', error))
  }
  run()
  sweep = setInterval(run, intervalMs)
  sweep.unref()
}

// ── Ingest ──────────────────────────────────────────────────────────────────

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

export interface IngestInput {
  buffer: Buffer
  filename?: string
  folder: string
  alt?: string
  tags?: string[]
  uploadedBy: string
}

export interface IngestResult<A> {
  media: MediaRow
  attached: A
  /** True when an existing media row with the same object key was reused. */
  reused: boolean
  warnings: string[]
}

/**
 * Validate and store an image, then create its media row and run `attach` in
 * ONE transaction. If `attach` throws — the target is gone, say — the row is
 * rolled back and the objects this call uploaded are compensated.
 *
 * Identical bytes under the same name and folder reuse the existing row
 * instead of uploading again, which is also what makes a retried or resumed
 * batch safe to repeat.
 */
export async function ingestImage<A = undefined>(
  input: IngestInput,
  attach?: (tx: Tx, row: MediaRow) => Promise<A>,
): Promise<IngestResult<A>> {
  const folder = normalizeFolder(input.folder)
  const image = await inspectImage(input.buffer)
  const filename = normalizeFilename(input.filename, image.mimeType)
  const storageFolder = `oxy-website/${folder}`
  const key = buildObjectKey(input.buffer, filename, image.mimeType, storageFolder)
  const warnings: string[] = []
  if (!image.decoded) warnings.push('thumbnails_unavailable: the image decoder is not available on this server')

  const [existing] = await db.select().from(media).where(eq(media.key, key)).orderBy(asc(media._id)).limit(1)
  if (existing) {
    const attached = await db.transaction(async (tx) => (attach ? attach(tx, existing) : (undefined as A)))
    warnings.push('reused_existing_media: identical file already in the library; its alt text and tags were left unchanged')
    return { media: existing, attached, reused: true, warnings }
  }

  const uploaded: string[] = []
  try {
    const url = await uploadToSpaces(input.buffer, filename, image.mimeType, storageFolder)
    uploaded.push(key)

    let thumbnails = { sm: '', md: '', lg: '' }
    if (image.decoded) {
      const processed = await processImage(input.buffer, filename, image.mimeType, storageFolder)
      thumbnails = processed.thumbnails
      for (const thumbUrl of Object.values(thumbnails)) {
        const thumbKey = thumbUrl ? keyFromPublicUrl(thumbUrl) : null
        if (thumbKey) uploaded.push(thumbKey)
      }
      const expected = [200, 400, 800].filter((size) => (image.width ?? 0) > size).length
      const generated = Object.values(thumbnails).filter(Boolean).length
      if (generated < expected) warnings.push('thumbnails_incomplete: some thumbnail sizes could not be generated; the original is stored')
    }

    const result = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(media)
        .values({
          url,
          thumbnails,
          filename,
          key,
          mimeType: image.mimeType,
          size: input.buffer.length,
          width: image.width,
          height: image.height,
          alt: input.alt ?? '',
          tags: input.tags ?? [],
          folder,
          uploadedBy: input.uploadedBy,
        })
        .returning()
      const attached = attach ? await attach(tx, row) : (undefined as A)
      return { row, attached }
    })
    return { media: result.row, attached: result.attached, reused: false, warnings }
  } catch (error) {
    await compensateUploads(uploaded)
    throw error
  }
}

// ── References and deletion ─────────────────────────────────────────────────

export interface MediaReference {
  table: string
  column: string
  ids: string[]
  total: number
}

interface ReferenceColumn {
  table: PgTable
  tableName: string
  column: PgColumn
  idColumn: PgColumn
}

let referenceColumns: ReferenceColumn[] | null = null

/** Every foreign key in the schema that points at `media`, found once. */
function mediaForeignKeys(): ReferenceColumn[] {
  if (referenceColumns) return referenceColumns
  const found: ReferenceColumn[] = []
  for (const value of Object.values(schema)) {
    if (!is(value, PgTable)) continue
    const config = getTableConfig(value)
    for (const fk of config.foreignKeys) {
      const reference = fk.reference()
      if (reference.foreignTable !== media) continue
      const idColumn = config.columns.find((column) => column.name === '_id')
      if (!idColumn) continue
      for (const column of reference.columns) found.push({ table: value, tableName: config.name, column, idColumn })
    }
  }
  referenceColumns = found
  return found
}

const HERO_MEDIA_FIELDS = ['backgroundVideoWebm', 'backgroundVideoMp4', 'backgroundPoster'] as const

/**
 * Where a media row is used. Foreign keys are found from the schema; the hero
 * stores ids in loose jsonb fields; testimonials and SEO entries store the URL
 * itself.
 */
export async function findMediaReferences(row: Pick<MediaRow, '_id' | 'url'>): Promise<MediaReference[]> {
  const references: MediaReference[] = []
  for (const ref of mediaForeignKeys()) {
    const where = eq(ref.column, row._id)
    const [ids, [total]] = await Promise.all([
      db.select({ id: ref.idColumn }).from(ref.table).where(where).orderBy(asc(ref.idColumn)).limit(10),
      db.select({ value: count() }).from(ref.table).where(where),
    ])
    const n = Number(total?.value ?? 0)
    if (n > 0) references.push({ table: ref.tableName, column: ref.column.name, ids: ids.map((r) => String(r.id)), total: n })
  }
  for (const field of HERO_MEDIA_FIELDS) {
    const column = heroContents[field]
    const rows = await db.select({ id: heroContents._id }).from(heroContents).where(sql`${column} #>> '{}' = ${row._id}`)
    if (rows.length > 0) references.push({ table: 'hero_contents', column: field, ids: rows.map((r) => r.id), total: rows.length })
  }
  const byUrl: [PgTable, string, PgColumn, PgColumn][] = [
    [testimonials, 'testimonials', testimonials.avatar, testimonials._id],
    [seoEntries, 'seo_entries', seoEntries.ogImage, seoEntries._id],
  ]
  for (const [table, tableName, column, idColumn] of byUrl) {
    const rows = await db.select({ id: idColumn }).from(table).where(eq(column, row.url)).limit(10)
    if (rows.length > 0) references.push({ table: tableName, column: column.name, ids: rows.map((r) => String(r.id)), total: rows.length })
  }
  return references
}

export interface DeleteMediaResult {
  deleted: true
  id: string
  referencesCleared: MediaReference[]
  storage: {
    status: 'complete' | 'pending'
    deletedKeys: string[]
    pendingKeys: string[]
    /** Objects another media row still uses; left in place. */
    sharedKeys: string[]
  }
  warnings: string[]
}

/** What `deleteMedia` would do, without doing it. */
export async function previewMediaDelete(id: string): Promise<Record<string, unknown>> {
  const [row] = await db.select().from(media).where(eq(media._id, id)).limit(1)
  if (!row) throw new MediaError('not_found', 'Media not found')
  const references = await findMediaReferences(row)
  const { keys, unparseable } = objectKeysOf(row)
  const shared: string[] = []
  for (const key of keys) if (await isKeyInUse(key, db, row._id)) shared.push(key)
  return {
    deleted: false,
    dryRun: true,
    target: { _id: row._id, filename: row.filename, url: row.url, updatedAt: row.updatedAt },
    references,
    requiresForce: references.length > 0,
    storage: { keysToDelete: keys.filter((key) => !shared.includes(key)), sharedKeysKept: shared, unparseableThumbnails: unparseable },
  }
}

/**
 * Delete a media row and the objects only it owned.
 *
 * A row still in use is refused unless `force` — then the foreign keys clear
 * themselves (`ON DELETE SET NULL`), the hero's loose ids are cleared in the
 * same transaction, and URL copies are reported because nothing can clear them.
 */
export async function deleteMedia(id: string, options: { force?: boolean } = {}): Promise<DeleteMediaResult> {
  const [row] = await db.select().from(media).where(eq(media._id, id)).limit(1)
  if (!row) throw new MediaError('not_found', 'Media not found')

  const references = await findMediaReferences(row)
  if (references.length > 0 && !options.force) {
    throw new MediaError('conflict', 'This media is still in use; pass force to delete it and clear those references', { references })
  }

  const { keys, unparseable } = objectKeysOf(row)
  const warnings = unparseable.map((url) => `unparseable_thumbnail_url: ${url} could not be mapped to an object key and may remain in storage`)
  for (const ref of references) {
    if (ref.table === 'testimonials' || ref.table === 'seo_entries') {
      warnings.push(`dangling_url_reference: ${ref.table}.${ref.column} still holds this media's URL`)
    }
  }

  const { owed, shared } = await db.transaction(async (tx) => {
    for (const field of HERO_MEDIA_FIELDS) {
      await tx
        .update(heroContents)
        .set({ [field]: null, updatedAt: new Date() })
        .where(sql`${heroContents[field]} #>> '{}' = ${row._id}`)
    }
    await tx.delete(media).where(eq(media._id, row._id))
    return owe(tx, keys, 'media_deleted', row._id)
  })

  const settled = await settleCleanups(owed)
  return {
    deleted: true,
    id: row._id,
    referencesCleared: references,
    storage: {
      status: settled.pending.length > 0 ? 'pending' : 'complete',
      deletedKeys: settled.deleted,
      pendingKeys: settled.pending,
      sharedKeys: [...shared, ...settled.kept],
    },
    warnings,
  }
}
