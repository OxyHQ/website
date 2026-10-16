import path from 'node:path';
import { and, asc, count, eq, inArray, isNull, lte, ne, or, sql, type SQL } from 'drizzle-orm';
import { getTableConfig, PgTable, type PgColumn } from 'drizzle-orm/pg-core';
import { is } from 'drizzle-orm';
import { db, rootDb } from '../db/postgres.js';
import * as schema from '../db/schema/index.js';
import {
  heroContents,
  media,
  mediaStorageMigrations,
  newObjectId,
  oxyFileReferenceRemovals,
  seoEntries,
  storageCleanups,
  testimonials,
} from '../db/schema/index.js';
import { buildObjectKey, isLegacyStorageKey, publicUrlForKey } from './s3.js';
import {
  addMediaReference,
  deleteFile,
  deleteLegacyObject,
  importFile,
  legacyKeyOfUrl,
  MEDIA_ENTITY_TYPE,
  OXY_FILES_MAX_BYTES,
  oxyFileUrl,
  oxyMediaUrls,
  removeReference,
  sha256Hex,
  type StoredFile,
  type Thumbnails,
  uploadFile,
  uploadLargeFile,
  uploadLegacyFile,
} from './oxyFiles.js';
import { downloadRemote } from './remoteDownload.js';
import { processImage } from './thumbnails.js';
import { DomainError } from '../utils/domainError.js';

/* ──────────────────────────────────────────────
 * The media pipeline: validate, store, attach, delete — and account for every
 * file it stores.
 *
 * Four rules hold throughout:
 *
 * 1. Nothing is stored until the bytes are known to be a supported image (or,
 *    for an editor's upload, a video). The declared Content-Type is never
 *    trusted: the original is checked on its own (signature, then a real
 *    decode under a pixel ceiling).
 * 2. Images and videos are files the Oxy Website application owns in Oxy Files
 *    (`services/oxyFiles.ts`). A media row registers its use of its file
 *    BEFORE the row is written, so no committed row is without one; a store
 *    that fails before that leaves a file nothing uses, which Oxy collects.
 * 3. A delete withdraws the row's reference through a durable queue
 *    (`oxy_file_reference_removals`) written in the same transaction, and
 *    deletes the file once no other row uses it. Several rows may share one
 *    file (Oxy dedupes the bytes), each with its own reference.
 * 4. Legacy objects (rows not migrated yet, and types Oxy Files cannot hold
 *    yet) keep the old rule: no object is deleted while any row still uses its
 *    key, and a delete the storage refuses is queued in `storage_cleanups`.
 * ──────────────────────────────────────────── */

export type MediaRow = typeof media.$inferSelect;

export class MediaError extends DomainError {
  override name = 'MediaError';
}

// ── Validation ──────────────────────────────────────────────────────────────

export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
] as const;
export type SupportedImageType = (typeof SUPPORTED_IMAGE_TYPES)[number];

const EXTENSION: Record<SupportedImageType, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/avif': '.avif',
};

/** Decoded-size ceiling: a small file can still expand into a huge bitmap. */
export const MAX_IMAGE_PIXELS = 40_000_000;
export const MAX_IMAGE_DIMENSION = 12_000;

/** A folder is one lower-case segment under `oxy-website/`, never a path. */
export const MEDIA_FOLDER_PATTERN = /^[a-z0-9][a-z0-9-]{0,39}$/;

/** The image type the bytes themselves declare, or `null`. */
export function sniffImageType(buffer: Buffer): SupportedImageType | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff)
    return 'image/jpeg';
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  )
    return 'image/png';
  if (buffer.length >= 6) {
    const head = buffer.subarray(0, 6).toString('latin1');
    if (head === 'GIF87a' || head === 'GIF89a') return 'image/gif';
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('latin1') === 'RIFF' &&
    buffer.subarray(8, 12).toString('latin1') === 'WEBP'
  )
    return 'image/webp';
  if (buffer.length >= 12 && buffer.subarray(4, 8).toString('latin1') === 'ftyp') {
    const brand = buffer.subarray(8, 12).toString('latin1');
    if (brand === 'avif' || brand === 'avis') return 'image/avif';
  }
  return null;
}

export interface InspectedImage {
  mimeType: SupportedImageType;
  width?: number;
  height?: number;
  /** False when the decoder could not be loaded; the signature check still ran. */
  decoded: boolean;
}

type SharpModule = typeof import('sharp')['default'];

async function loadSharp(): Promise<SharpModule | null> {
  try {
    return (await import('sharp')).default;
  } catch {
    return null;
  }
}

export async function inspectImage(buffer: Buffer): Promise<InspectedImage> {
  if (buffer.length === 0) throw new MediaError('invalid', 'The file is empty');
  const mimeType = sniffImageType(buffer);
  if (!mimeType) {
    const head = buffer.subarray(0, 512).toString('utf8').trimStart().toLowerCase();
    if (head.startsWith('<') && head.includes('<svg')) {
      throw new MediaError(
        'invalid',
        'SVG is not accepted: it can carry active content. Upload a PNG, JPEG, WebP, GIF or AVIF instead.',
      );
    }
    throw new MediaError(
      'invalid',
      'The file is not a supported image (JPEG, PNG, GIF, WebP or AVIF)',
    );
  }

  const sharp = await loadSharp();
  if (!sharp) {
    console.warn(
      '[media] sharp unavailable: accepting image on its signature alone, without dimensions or thumbnails',
    );
    return { mimeType, decoded: false };
  }
  let metadata: import('sharp').Metadata;
  try {
    metadata = await sharp(buffer, {
      limitInputPixels: MAX_IMAGE_PIXELS,
      failOn: 'error',
    }).metadata();
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (/pixel limit/i.test(message))
      throw new MediaError('too_large', `The image exceeds ${MAX_IMAGE_PIXELS} pixels`);
    throw new MediaError('invalid', 'The image could not be decoded');
  }
  const { width, height } = metadata;
  if (!width || !height) throw new MediaError('invalid', 'The image has no readable dimensions');
  if (
    width > MAX_IMAGE_DIMENSION ||
    height > MAX_IMAGE_DIMENSION ||
    width * height > MAX_IMAGE_PIXELS
  ) {
    throw new MediaError(
      'too_large',
      `The image is ${width}×${height}; the limit is ${MAX_IMAGE_DIMENSION}px a side and ${MAX_IMAGE_PIXELS} pixels`,
    );
  }
  return { mimeType, width, height, decoded: true };
}

export function normalizeFolder(folder: string | undefined, fallback = 'images'): string {
  const value = folder ?? fallback;
  if (!MEDIA_FOLDER_PATTERN.test(value)) {
    throw new MediaError(
      'invalid',
      'folder must be one lower-case segment of letters, digits and dashes (e.g. "newsroom")',
    );
  }
  return value;
}

/** A stored filename whose extension matches what the bytes are. */
export function normalizeFilename(
  requested: string | undefined,
  mimeType: SupportedImageType,
  fallback = 'image',
): string {
  const base = path.basename(requested ?? '').replace(/\.[^.]*$/, '');
  const safe =
    base
      .replace(/[^a-z0-9_-]/gi, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60) || fallback;
  return `${safe}${EXTENSION[mimeType]}`;
}

/** The video container the bytes declare, or `null`. Only what browsers play. */
export function sniffVideoType(buffer: Buffer): 'video/mp4' | 'video/webm' | null {
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x1a &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xdf &&
    buffer[3] === 0xa3 &&
    buffer.subarray(0, 64).includes(Buffer.from('webm', 'latin1'))
  )
    return 'video/webm';
  if (buffer.length >= 12 && buffer.subarray(4, 8).toString('latin1') === 'ftyp') {
    const brand = buffer.subarray(8, 12).toString('latin1');
    if (['isom', 'iso2', 'iso5', 'iso6', 'mp41', 'mp42', 'avc1', 'dash', 'M4V '].includes(brand))
      return 'video/mp4';
  }
  return null;
}

/**
 * Whether the bytes are an SVG document: optional BOM, XML declaration,
 * comments and doctype, then an `<svg` root. Read from the bytes, never from a
 * declared type or a name.
 */
export function isSvgDocument(buffer: Buffer): boolean {
  const head = buffer
    .subarray(0, 4096)
    .toString('utf8')
    .replace(/^\uFEFF/, '');
  return /^\s*(<\?xml[^>]*\?>\s*)?((<!--[\s\S]*?-->|<!doctype[^>]*>)\s*)*<svg[\s>/]/i.test(head);
}

/** The type of a file that is not a supported image, a video or an SVG. */
export type DocumentType = 'application/pdf' | 'image/x-icon' | 'application/octet-stream';

/**
 * What the bytes of any other file are: a PDF, a Windows icon, or — when the
 * bytes prove nothing — `application/octet-stream`, which Oxy serves as a
 * download. A declared type is never taken: a browser's guess (or a name
 * ending `.bin`) is how raster images ended up recorded as octet streams.
 */
export function sniffDocumentType(buffer: Buffer): DocumentType {
  if (buffer.length >= 5 && buffer.subarray(0, 5).toString('latin1') === '%PDF-')
    return 'application/pdf';
  if (
    buffer.length >= 22 &&
    buffer[0] === 0 &&
    buffer[1] === 0 &&
    buffer[2] === 1 &&
    buffer[3] === 0 &&
    buffer.readUInt16LE(4) > 0
  )
    return 'image/x-icon';
  return 'application/octet-stream';
}

/** The type the bytes prove, whatever the file is. */
export function sniffFileType(buffer: Buffer): string {
  return (
    sniffImageType(buffer) ??
    sniffVideoType(buffer) ??
    (isSvgDocument(buffer) ? 'image/svg+xml' : sniffDocumentType(buffer))
  );
}

const TYPE_EXTENSION: Record<string, string> = {
  ...EXTENSION,
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'image/svg+xml': '.svg',
  'application/pdf': '.pdf',
  'image/x-icon': '.ico',
};

/**
 * A safe file name whose extension matches the type the bytes proved. A file
 * whose bytes prove nothing keeps its own extension (`.zip`, `.docx`), or none.
 */
export function filenameForType(requested: string | undefined, mimeType: string): string {
  const original = path.basename(requested ?? '');
  const ownExtension = /\.([a-z0-9]{1,10})$/i.exec(original)?.[1]?.toLowerCase();
  const safe =
    original
      .replace(/\.[^.]*$/, '')
      .replace(/[^a-z0-9_-]/gi, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60) || 'file';
  const extension = TYPE_EXTENSION[mimeType] ?? (ownExtension ? `.${ownExtension}` : '');
  return `${safe}${extension}`;
}

// ── Legacy objects ──────────────────────────────────────────────────────────

type Executor = Pick<typeof db, 'select'>;

/** Whether any media row other than `excludeId` still uses this legacy key. */
export async function isKeyInUse(
  key: string,
  executor: Executor = db,
  excludeId?: string,
): Promise<boolean> {
  const url = publicUrlForKey(key);
  const uses = or(
    eq(media.key, key),
    eq(media.url, url),
    sql`${media.thumbnails}->>'sm' = ${url}`,
    sql`${media.thumbnails}->>'md' = ${url}`,
    sql`${media.thumbnails}->>'lg' = ${url}`,
  ) as SQL;
  const [row] = await executor
    .select({ id: media._id })
    .from(media)
    .where(excludeId ? and(uses, ne(media._id, excludeId)) : uses)
    .limit(1);
  if (row) return true;
  // A migrated row's legacy thumbnails are recorded only in its migration.
  const [migrated] = await executor
    .select({ id: mediaStorageMigrations.mediaId })
    .from(mediaStorageMigrations)
    .innerJoin(media, eq(media._id, mediaStorageMigrations.mediaId))
    .where(
      and(
        or(
          sql`${mediaStorageMigrations.legacyThumbnails}->>'sm' = ${url}`,
          sql`${mediaStorageMigrations.legacyThumbnails}->>'md' = ${url}`,
          sql`${mediaStorageMigrations.legacyThumbnails}->>'lg' = ${url}`,
        ),
        excludeId ? ne(media._id, excludeId) : undefined,
      ),
    )
    .limit(1);
  return Boolean(migrated);
}

/**
 * Every legacy object a media row owns: its original and each thumbnail,
 * including the thumbnails a migrated row replaced with Oxy renditions. Only
 * keys under the site's own prefix: a seeded row's path, an external URL or an
 * Oxy URL is no object of the site's.
 */
export async function legacyObjectKeysOf(
  row: Pick<MediaRow, '_id' | 'key' | 'thumbnails'>,
  executor: Executor = db,
): Promise<string[]> {
  const keys = new Set<string>();
  if (row.key && isLegacyStorageKey(row.key)) keys.add(row.key);
  const [migration] = await executor
    .select({ legacyThumbnails: mediaStorageMigrations.legacyThumbnails })
    .from(mediaStorageMigrations)
    .where(eq(mediaStorageMigrations.mediaId, row._id))
    .limit(1);
  const thumbnails: Thumbnails[] = [row.thumbnails];
  if (migration) thumbnails.push(migration.legacyThumbnails);
  for (const set of thumbnails)
    for (const url of [set?.sm, set?.md, set?.lg]) {
      const key = url ? legacyKeyOfUrl(url) : null;
      if (key) keys.add(key);
    }
  return [...keys];
}

const RETRY_BASE_MS = 60_000;
const RETRY_CAP_MS = 24 * 60 * 60 * 1000;

function nextAttemptAfter(attempts: number): Date {
  return new Date(
    Date.now() + Math.min(RETRY_BASE_MS * 2 ** Math.max(0, attempts - 1), RETRY_CAP_MS),
  );
}

function describeStorageError(error: unknown): string {
  const name = error instanceof Error ? error.name : 'Error';
  const message = error instanceof Error ? error.message : String(error);
  return `${name}: ${message}`.slice(0, 300);
}

/**
 * Try to delete owed legacy objects now. Each key is re-checked against the
 * media table first: a row created since the debt was recorded owns it again.
 */
async function settleCleanups(
  rows: { _id: string; key: string; attempts: number }[],
  executor: typeof db = db,
): Promise<{ deleted: string[]; pending: string[]; kept: string[] }> {
  const deleted: string[] = [];
  const pending: string[] = [];
  const kept: string[] = [];
  for (const row of rows) {
    if (await isKeyInUse(row.key, executor)) {
      await executor.delete(storageCleanups).where(eq(storageCleanups._id, row._id));
      kept.push(row.key);
      continue;
    }
    try {
      await deleteLegacyObject(row.key);
      await executor.delete(storageCleanups).where(eq(storageCleanups._id, row._id));
      deleted.push(row.key);
    } catch (error) {
      const attempts = row.attempts + 1;
      await executor
        .update(storageCleanups)
        .set({
          attempts,
          lastError: describeStorageError(error),
          nextAttemptAt: nextAttemptAfter(attempts),
          updatedAt: new Date(),
        })
        .where(eq(storageCleanups._id, row._id));
      pending.push(row.key);
    }
  }
  return { deleted, pending, kept };
}

/** Record legacy keys as owed, skipping any another media row still uses. */
async function owe(
  tx: Pick<typeof db, 'select' | 'insert'>,
  keys: string[],
  reason: string,
  mediaId: string | null,
): Promise<{ owed: { _id: string; key: string; attempts: number }[]; shared: string[] }> {
  const owed: { _id: string; key: string; attempts: number }[] = [];
  const shared: string[] = [];
  for (const key of keys) {
    if (await isKeyInUse(key, tx, mediaId ?? undefined)) {
      shared.push(key);
      continue;
    }
    const [row] = await tx
      .insert(storageCleanups)
      .values({ key, reason, mediaId })
      .onConflictDoUpdate({
        target: storageCleanups.key,
        set: { nextAttemptAt: new Date(), updatedAt: new Date() },
      })
      .returning({
        _id: storageCleanups._id,
        key: storageCleanups.key,
        attempts: storageCleanups.attempts,
      });
    owed.push(row);
  }
  return { owed, shared };
}

/**
 * Undo the legacy objects a failed operation uploaded — only those it uploaded,
 * and only while no media row uses them. Never throws: a compensation failure
 * is recorded for the sweep instead of masking the original error. Written on
 * the pool, not the caller's unit of work, which is about to roll back.
 */
async function compensateLegacyUploads(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  try {
    const { owed } = await rootDb.transaction((tx) => owe(tx, keys, 'upload_compensation', null));
    await settleCleanups(owed, rootDb);
  } catch (error) {
    console.error(`[media] could not compensate ${keys.length} uploaded object(s):`, error);
  }
}

/** One pass of the legacy cleanup queue; safe to run from several tasks at once. */
export async function retryStorageCleanups(
  limit = 25,
): Promise<{ deleted: number; pending: number; kept: number }> {
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
    .returning({
      _id: storageCleanups._id,
      key: storageCleanups.key,
      attempts: storageCleanups.attempts,
    });
  const result = await settleCleanups(claimed);
  return {
    deleted: result.deleted.length,
    pending: result.pending.length,
    kept: result.kept.length,
  };
}

// ── Oxy Files references ────────────────────────────────────────────────────

type RemovalRow = Pick<
  typeof oxyFileReferenceRemovals.$inferSelect,
  '_id' | 'fileId' | 'entityType' | 'entityId' | 'purge' | 'attempts'
>;

const REMOVAL_COLUMNS = {
  _id: oxyFileReferenceRemovals._id,
  fileId: oxyFileReferenceRemovals.fileId,
  entityType: oxyFileReferenceRemovals.entityType,
  entityId: oxyFileReferenceRemovals.entityId,
  purge: oxyFileReferenceRemovals.purge,
  attempts: oxyFileReferenceRemovals.attempts,
};

/** What became of one owed removal. `file` is only reported for a purge. */
export interface RemovalOutcome {
  fileId: string;
  reference: 'removed' | 'pending';
  file?: 'deleted' | 'shared' | 'in_use' | 'gone' | 'pending';
}

/** Record that a row's reference must be withdrawn — in the caller's transaction. */
async function oweReferenceRemoval(
  tx: Pick<typeof db, 'insert'>,
  removal: { fileId: string; entityId: string; purge: boolean; reason: string },
): Promise<RemovalRow> {
  const [row] = await tx
    .insert(oxyFileReferenceRemovals)
    .values({ ...removal, entityType: MEDIA_ENTITY_TYPE })
    .onConflictDoUpdate({
      target: [
        oxyFileReferenceRemovals.fileId,
        oxyFileReferenceRemovals.entityType,
        oxyFileReferenceRemovals.entityId,
      ],
      set: {
        purge: sql`${oxyFileReferenceRemovals.purge} or excluded.purge`,
        nextAttemptAt: new Date(),
        updatedAt: new Date(),
      },
    })
    .returning(REMOVAL_COLUMNS);
  return row;
}

/**
 * Withdraw owed references now. A purge then deletes the file unless a media
 * row still holds it (re-checked here, as a legacy key is) — Oxy itself
 * refuses while anything else references it, so this can never take a file
 * from under another user.
 */
async function settleReferenceRemovals(
  rows: RemovalRow[],
  executor: typeof db = db,
): Promise<RemovalOutcome[]> {
  const outcomes: RemovalOutcome[] = [];
  for (const row of rows) {
    // A row that took the same id again (it cannot: ids are fresh) or that
    // was restored would hold the reference legitimately.
    const [live] = await executor
      .select({ id: media._id })
      .from(media)
      .where(and(eq(media._id, row.entityId), eq(media.oxyFileId, row.fileId)))
      .limit(1);
    try {
      if (!live) await removeReference(row.fileId, row.entityType, row.entityId);
      let file: RemovalOutcome['file'];
      if (row.purge) {
        const [sharer] = await executor
          .select({ id: media._id })
          .from(media)
          .where(eq(media.oxyFileId, row.fileId))
          .limit(1);
        file = sharer ? 'shared' : await deleteFile(row.fileId);
      }
      await executor
        .delete(oxyFileReferenceRemovals)
        .where(eq(oxyFileReferenceRemovals._id, row._id));
      outcomes.push({ fileId: row.fileId, reference: 'removed', ...(file ? { file } : {}) });
    } catch (error) {
      const attempts = row.attempts + 1;
      await executor
        .update(oxyFileReferenceRemovals)
        .set({
          attempts,
          lastError: describeStorageError(error),
          nextAttemptAt: nextAttemptAfter(attempts),
          updatedAt: new Date(),
        })
        .where(eq(oxyFileReferenceRemovals._id, row._id));
      outcomes.push({
        fileId: row.fileId,
        reference: 'pending',
        ...(row.purge ? { file: 'pending' as const } : {}),
      });
    }
  }
  return outcomes;
}

/**
 * Withdraw a reference registered for a row that was never written (its
 * transaction rolled back). Never throws; an Oxy outage leaves it queued, and
 * the nightly reconciliation would remove it regardless.
 */
async function compensateReference(fileId: string, mediaId: string): Promise<void> {
  try {
    const row = await oweReferenceRemoval(rootDb, {
      fileId,
      entityId: mediaId,
      purge: false,
      reason: 'upload_compensation',
    });
    await settleReferenceRemovals([row], rootDb);
  } catch (error) {
    console.error(`[media] could not withdraw the reference of unwritten row ${mediaId}:`, error);
  }
}

/** One pass of the reference-removal queue; safe to run from several tasks at once. */
export async function retryReferenceRemovals(
  limit = 25,
): Promise<{ removed: number; pending: number }> {
  const claimed = await db
    .update(oxyFileReferenceRemovals)
    .set({ nextAttemptAt: sql`now() + interval '10 minutes'`, updatedAt: new Date() })
    .where(
      inArray(
        oxyFileReferenceRemovals._id,
        db
          .select({ id: oxyFileReferenceRemovals._id })
          .from(oxyFileReferenceRemovals)
          .where(lte(oxyFileReferenceRemovals.nextAttemptAt, new Date()))
          .orderBy(asc(oxyFileReferenceRemovals.nextAttemptAt), asc(oxyFileReferenceRemovals._id))
          .limit(limit)
          .for('update', { skipLocked: true }),
      ),
    )
    .returning(REMOVAL_COLUMNS);
  const outcomes = await settleReferenceRemovals(claimed);
  const removed = outcomes.filter((outcome) => outcome.reference === 'removed').length;
  return { removed, pending: outcomes.length - removed };
}

export async function pendingStorageCleanupCount(): Promise<number> {
  const [[legacy], [references]] = await Promise.all([
    db.select({ value: count() }).from(storageCleanups),
    db.select({ value: count() }).from(oxyFileReferenceRemovals),
  ]);
  return Number(legacy?.value ?? 0) + Number(references?.value ?? 0);
}

let sweep: ReturnType<typeof setInterval> | null = null;

/** Started once after bootstrap, like the other intervals in `server/index.ts`. */
export function startStorageCleanupSweep(intervalMs = 15 * 60 * 1000): void {
  if (sweep) return;
  const run = () => {
    retryReferenceRemovals().catch((error: unknown) =>
      console.error('[media] reference removal sweep failed:', error),
    );
    retryStorageCleanups().catch((error: unknown) =>
      console.error('[media] storage cleanup sweep failed:', error),
    );
  };
  run();
  sweep = setInterval(run, intervalMs);
  sweep.unref();
}

// ── Ingest ──────────────────────────────────────────────────────────────────

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

interface MediaDetails {
  filename?: string;
  folder: string;
  alt?: string;
  tags?: string[];
  /** The acting account: an audit field, never the file's owner (the application is). */
  uploadedBy: string;
}

export interface IngestInput extends MediaDetails {
  buffer: Buffer;
}

export interface IngestRemoteInput extends MediaDetails {
  sourceUrl: string;
  signal?: AbortSignal;
}

export interface IngestResult<A> {
  media: MediaRow;
  attached: A;
  /** True when an existing media row with the same bytes, folder and name was reused. */
  reused: boolean;
  warnings: string[];
}

type Attach<A> = (tx: Tx, row: MediaRow) => Promise<A>;

const REUSED_WARNING =
  'reused_existing_media: identical file already in the library; its alt text and tags were left unchanged';

/**
 * The row an upload of these bytes under this name and folder would duplicate:
 * one in Oxy Files with the same hash, or one not migrated yet under the key a
 * legacy upload would have used. A row Oxy reported unavailable is never
 * reused — those bytes may have been taken down.
 */
async function findReusable(match: {
  sha256: string;
  folder: string;
  filename: string;
  legacyKey: string;
}): Promise<MediaRow | undefined> {
  const [row] = await db
    .select()
    .from(media)
    .where(
      and(
        isNull(media.unavailableAt),
        or(
          and(
            eq(media.sha256, match.sha256),
            eq(media.folder, match.folder),
            eq(media.filename, match.filename),
          ),
          eq(media.key, match.legacyKey),
        ),
      ),
    )
    .orderBy(asc(media._id))
    .limit(1);
  return row;
}

async function reuse<A>(
  row: MediaRow,
  attach: Attach<A> | undefined,
  warnings: string[],
): Promise<IngestResult<A>> {
  const attached = await db.transaction(async (tx) =>
    attach ? attach(tx, row) : (undefined as A),
  );
  return { media: row, attached, reused: true, warnings: [...warnings, REUSED_WARNING] };
}

/**
 * Write the media row for a file in Oxy Files, and run `attach` in the same
 * transaction. The reference is registered first; if the transaction then
 * fails, the reference is withdrawn and the error rethrown.
 */
async function recordOxyMedia<A>(
  file: StoredFile,
  values: Omit<typeof media.$inferInsert, '_id' | 'url' | 'thumbnails' | 'oxyFileId' | 'sha256'>,
  attach: Attach<A> | undefined,
): Promise<{ row: MediaRow; attached: A }> {
  const mediaId = newObjectId();
  await addMediaReference(file.fileId, mediaId);
  try {
    return await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(media)
        .values({
          ...values,
          _id: mediaId,
          ...oxyMediaUrls(file.fileId, values.mimeType),
          key: null,
          oxyFileId: file.fileId,
          sha256: file.sha256,
        })
        .returning();
      const attached = attach ? await attach(tx, row) : (undefined as A);
      return { row, attached };
    });
  } catch (error) {
    await compensateReference(file.fileId, mediaId);
    throw error;
  }
}

/**
 * Validate an image, store it in Oxy Files, then create its media row and run
 * `attach` in ONE transaction. If `attach` throws — the target is gone, say —
 * the row is rolled back and its reference withdrawn; the file, now used by
 * nothing, is Oxy's to collect.
 *
 * Identical bytes under the same name and folder reuse the existing row
 * instead of storing again, which is also what makes a retried or resumed
 * batch safe to repeat.
 */
export async function ingestImage<A = undefined>(
  input: IngestInput,
  attach?: Attach<A>,
): Promise<IngestResult<A>> {
  const folder = normalizeFolder(input.folder);
  const image = await inspectImage(input.buffer);
  return ingestOxyBytes(input, folder, image, attach);
}

async function ingestOxyBytes<A>(
  input: IngestInput,
  folder: string,
  described: { mimeType: string; width?: number; height?: number; decoded: boolean },
  attach: Attach<A> | undefined,
): Promise<IngestResult<A>> {
  const isImage = described.mimeType.startsWith('image/');
  const filename = isImage
    ? normalizeFilename(input.filename, described.mimeType as SupportedImageType)
    : normalizeVideoFilename(input.filename, described.mimeType);
  const warnings: string[] = [];
  if (isImage && !described.decoded)
    warnings.push('dimensions_unavailable: the image decoder is not available on this server');

  const existing = await findReusable({
    sha256: sha256Hex(input.buffer),
    folder,
    filename,
    legacyKey: buildObjectKey(input.buffer, filename, described.mimeType, `oxy-website/${folder}`),
  });
  if (existing) return reuse(existing, attach, warnings);

  const file = await uploadFile(input.buffer, described.mimeType, filename);
  const { row, attached } = await recordOxyMedia(
    file,
    {
      filename,
      mimeType: described.mimeType,
      size: input.buffer.length,
      width: described.width,
      height: described.height,
      alt: input.alt ?? '',
      tags: input.tags ?? [],
      folder,
      uploadedBy: input.uploadedBy,
    },
    attach,
  );
  return { media: row, attached, reused: false, warnings };
}

function normalizeVideoFilename(requested: string | undefined, mimeType: string): string {
  const base = path.basename(requested ?? '').replace(/\.[^.]*$/, '');
  const safe =
    base
      .replace(/[^a-z0-9_-]/gi, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60) || 'video';
  return `${safe}${mimeType === 'video/webm' ? '.webm' : '.mp4'}`;
}

/**
 * Import an image by URL. Oxy fetches it (ADR 0043 D7: its own SSRF-safe
 * fetcher, and a URL it already imported is answered without fetching), and
 * the stored bytes are then read back from Oxy and held to the same rules as
 * an upload — signature, decode, pixel ceiling — because Oxy accepts any image
 * the source DECLARES. A file that fails is left referenced by nothing, which
 * Oxy collects.
 */
export async function ingestRemoteImage<A = undefined>(
  input: IngestRemoteInput,
  attach?: Attach<A>,
): Promise<IngestResult<A>> {
  const folder = normalizeFolder(input.folder);
  const file = await importFile(input.sourceUrl, input.signal);
  if (!(SUPPORTED_IMAGE_TYPES as readonly string[]).includes(file.mimeType))
    throw new MediaError(
      'invalid',
      'The file is not a supported image (JPEG, PNG, GIF, WebP or AVIF)',
    );
  const { buffer } = await downloadRemote(oxyFileUrl(file.fileId), {
    signal: input.signal,
    maxBytes: OXY_FILES_MAX_BYTES,
  });
  if (sha256Hex(buffer) !== file.sha256)
    throw new MediaError(
      'unavailable',
      'Oxy Files served different bytes than it stored; try again',
    );
  const image = await inspectImage(buffer);
  const filename = normalizeFilename(input.filename, image.mimeType);
  const warnings: string[] = [];
  if (!image.decoded)
    warnings.push('dimensions_unavailable: the image decoder is not available on this server');

  const existing = await findReusable({
    sha256: file.sha256,
    folder,
    filename,
    legacyKey: buildObjectKey(buffer, filename, image.mimeType, `oxy-website/${folder}`),
  });
  if (existing) return reuse(existing, attach, warnings);

  const { row, attached } = await recordOxyMedia(
    file,
    {
      filename,
      mimeType: image.mimeType,
      size: buffer.length,
      width: image.width,
      height: image.height,
      alt: input.alt ?? '',
      tags: input.tags ?? [],
      folder,
      uploadedBy: input.uploadedBy,
    },
    attach,
  );
  return { media: row, attached, reused: false, warnings };
}

/**
 * An editor's upload from the admin. What the file IS comes from its bytes —
 * never the browser's declared type, which is how raster images were once
 * recorded as `application/octet-stream`. An image or a video is an Oxy file
 * through the media upload; any other type (a PDF, an icon, an archive) through
 * Oxy's large upload; an SVG stays on the legacy storage until Oxy Files takes
 * sanitized SVG (TODO(oxy-svg), `services/oxyFiles.ts`).
 */
export async function ingestUpload(input: IngestInput): Promise<IngestResult<undefined>> {
  const folder = normalizeFolder(input.folder);
  if (input.buffer.length === 0) throw new MediaError('invalid', 'The file is empty');
  if (sniffImageType(input.buffer)) return ingestImage({ ...input, folder });
  const video = sniffVideoType(input.buffer);
  if (video) return ingestOxyBytes(input, folder, { mimeType: video, decoded: false }, undefined);
  // TODO(oxy-svg): an SVG is the one type Oxy Files refuses (an active document).
  if (isSvgDocument(input.buffer)) return ingestLegacySvg(input, folder);
  return ingestOxyDocument(input, folder);
}

/** Any file that is not an image, a video or an SVG: one of the site's files, by the large upload. */
async function ingestOxyDocument(
  input: IngestInput,
  folder: string,
): Promise<IngestResult<undefined>> {
  const mimeType = sniffDocumentType(input.buffer);
  const filename = filenameForType(input.filename, mimeType);
  const existing = await findReusable({
    sha256: sha256Hex(input.buffer),
    folder,
    filename,
    legacyKey: buildObjectKey(input.buffer, filename, mimeType, `oxy-website/${folder}`),
  });
  if (existing) return reuse(existing, undefined, []);

  const file = await uploadLargeFile(input.buffer, mimeType, filename);
  const { row } = await recordOxyMedia<undefined>(
    file,
    {
      filename,
      mimeType,
      size: input.buffer.length,
      alt: input.alt ?? '',
      tags: input.tags ?? [],
      folder,
      uploadedBy: input.uploadedBy,
    },
    undefined,
  );
  return { media: row, attached: undefined, reused: false, warnings: [] };
}

/** TODO(oxy-svg): an SVG on the legacy storage, recorded as the SVG its bytes are. */
async function ingestLegacySvg(
  input: IngestInput,
  folder: string,
): Promise<IngestResult<undefined>> {
  const mimeType = 'image/svg+xml';
  const storageFolder = `oxy-website/${folder}`;
  const filename = filenameForType(input.filename, mimeType);
  const legacyKey = buildObjectKey(input.buffer, filename, mimeType, storageFolder);
  const [existing] = await db
    .select()
    .from(media)
    .where(and(eq(media.key, legacyKey), isNull(media.unavailableAt)))
    .orderBy(asc(media._id))
    .limit(1);
  if (existing) return reuse(existing, undefined, []);

  const uploaded: string[] = [];
  try {
    const stored = await uploadLegacyFile(input.buffer, filename, mimeType, storageFolder);
    uploaded.push(stored.key);
    const processed = await processImage(input.buffer, filename, mimeType, storageFolder);
    for (const url of Object.values(processed.thumbnails)) {
      const key = url ? legacyKeyOfUrl(url) : null;
      if (key) uploaded.push(key);
    }
    const [row] = await db
      .insert(media)
      .values({
        url: stored.url,
        thumbnails: processed.thumbnails,
        filename,
        key: stored.key,
        mimeType,
        size: input.buffer.length,
        width: processed.width,
        height: processed.height,
        alt: input.alt ?? '',
        tags: input.tags ?? [],
        folder,
        uploadedBy: input.uploadedBy,
      })
      .returning();
    return { media: row, attached: undefined, reused: false, warnings: [] };
  } catch (error) {
    await compensateLegacyUploads(uploaded);
    throw error;
  }
}

// ── References and deletion ─────────────────────────────────────────────────

export interface MediaReference {
  table: string;
  column: string;
  ids: string[];
  total: number;
}

interface ReferenceColumn {
  table: PgTable;
  tableName: string;
  column: PgColumn;
  idColumn: PgColumn;
}

let referenceColumns: ReferenceColumn[] | null = null;

/** Every foreign key in the schema that points at `media`, found once. */
function mediaForeignKeys(): ReferenceColumn[] {
  if (referenceColumns) return referenceColumns;
  const found: ReferenceColumn[] = [];
  for (const value of Object.values(schema)) {
    if (!is(value, PgTable)) continue;
    const config = getTableConfig(value);
    for (const fk of config.foreignKeys) {
      const reference = fk.reference();
      if (reference.foreignTable !== media) continue;
      const idColumn = config.columns.find((column) => column.name === '_id');
      if (!idColumn) continue;
      for (const column of reference.columns)
        found.push({ table: value, tableName: config.name, column, idColumn });
    }
  }
  referenceColumns = found;
  return found;
}

const HERO_MEDIA_FIELDS = [
  'backgroundVideoWebm',
  'backgroundVideoMp4',
  'backgroundPoster',
] as const;

/**
 * Where a media row is used. Foreign keys are found from the schema; the hero
 * stores ids in loose jsonb fields; testimonials and SEO entries store the URL
 * itself.
 */
export async function findMediaReferences(
  row: Pick<MediaRow, '_id' | 'url'>,
): Promise<MediaReference[]> {
  const references: MediaReference[] = [];
  for (const ref of mediaForeignKeys()) {
    const where = eq(ref.column, row._id);
    const [ids, [total]] = await Promise.all([
      db
        .select({ id: ref.idColumn })
        .from(ref.table)
        .where(where)
        .orderBy(asc(ref.idColumn))
        .limit(10),
      db.select({ value: count() }).from(ref.table).where(where),
    ]);
    const n = Number(total?.value ?? 0);
    if (n > 0)
      references.push({
        table: ref.tableName,
        column: ref.column.name,
        ids: ids.map((r) => String(r.id)),
        total: n,
      });
  }
  for (const field of HERO_MEDIA_FIELDS) {
    const column = heroContents[field];
    const rows = await db
      .select({ id: heroContents._id })
      .from(heroContents)
      .where(sql`${column} #>> '{}' = ${row._id}`);
    if (rows.length > 0)
      references.push({
        table: 'hero_contents',
        column: field,
        ids: rows.map((r) => r.id),
        total: rows.length,
      });
  }
  const byUrl: [PgTable, string, PgColumn, PgColumn][] = [
    [testimonials, 'testimonials', testimonials.avatar, testimonials._id],
    [seoEntries, 'seo_entries', seoEntries.ogImage, seoEntries._id],
  ];
  for (const [table, tableName, column, idColumn] of byUrl) {
    const rows = await db.select({ id: idColumn }).from(table).where(eq(column, row.url)).limit(10);
    if (rows.length > 0)
      references.push({
        table: tableName,
        column: column.name,
        ids: rows.map((r) => String(r.id)),
        total: rows.length,
      });
  }
  return references;
}

export interface DeleteMediaResult {
  deleted: true;
  id: string;
  referencesCleared: MediaReference[];
  storage: {
    status: 'complete' | 'pending';
    /** Legacy objects deleted. */
    deletedKeys: string[];
    /** Legacy objects whose delete failed and is queued. */
    pendingKeys: string[];
    /** Legacy objects another media row still uses; left in place. */
    sharedKeys: string[];
    /**
     * The row's file in Oxy Files, when it had one: its reference withdrawn
     * (or queued), and the file deleted — unless another row still uses it
     * (`shared`) or something outside the site does (`in_use`, Oxy collects
     * it once free).
     */
    oxyFile?: RemovalOutcome;
  };
  warnings: string[];
}

/** What `deleteMedia` would do, without doing it. */
export async function previewMediaDelete(id: string): Promise<Record<string, unknown>> {
  const [row] = await db.select().from(media).where(eq(media._id, id)).limit(1);
  if (!row) throw new MediaError('not_found', 'Media not found');
  const references = await findMediaReferences(row);
  const keys = await legacyObjectKeysOf(row);
  const shared: string[] = [];
  for (const key of keys) if (await isKeyInUse(key, db, row._id)) shared.push(key);
  let oxyFile: Record<string, unknown> | undefined;
  if (row.oxyFileId) {
    const [sharer] = await db
      .select({ id: media._id })
      .from(media)
      .where(and(eq(media.oxyFileId, row.oxyFileId), ne(media._id, row._id)))
      .limit(1);
    oxyFile = {
      fileId: row.oxyFileId,
      fileDeleted: !sharer,
      sharedWithOtherMedia: Boolean(sharer),
    };
  }
  return {
    deleted: false,
    dryRun: true,
    target: { _id: row._id, filename: row.filename, url: row.url, updatedAt: row.updatedAt },
    references,
    requiresForce: references.length > 0,
    storage: {
      keysToDelete: keys.filter((key) => !shared.includes(key)),
      sharedKeysKept: shared,
      ...(oxyFile ? { oxyFile } : {}),
    },
  };
}

/**
 * Delete a media row, its use of its Oxy file, and the legacy objects only it
 * owned.
 *
 * A row still in use is refused unless `force` — then the foreign keys clear
 * themselves (`ON DELETE SET NULL`), the hero's loose ids are cleared in the
 * same transaction, and URL copies are reported because nothing can clear them.
 */
export async function deleteMedia(
  id: string,
  options: { force?: boolean } = {},
): Promise<DeleteMediaResult> {
  const [row] = await db.select().from(media).where(eq(media._id, id)).limit(1);
  if (!row) throw new MediaError('not_found', 'Media not found');

  const references = await findMediaReferences(row);
  if (references.length > 0 && !options.force) {
    throw new MediaError(
      'conflict',
      'This media is still in use; pass force to delete it and clear those references',
      { references },
    );
  }

  const warnings: string[] = [];
  for (const ref of references) {
    if (ref.table === 'testimonials' || ref.table === 'seo_entries') {
      warnings.push(
        `dangling_url_reference: ${ref.table}.${ref.column} still holds this media's URL`,
      );
    }
  }

  const keys = await legacyObjectKeysOf(row);
  const { owed, shared, removal } = await db.transaction(async (tx) => {
    for (const field of HERO_MEDIA_FIELDS) {
      await tx
        .update(heroContents)
        .set({ [field]: null, updatedAt: new Date() })
        .where(sql`${heroContents[field]} #>> '{}' = ${row._id}`);
    }
    await tx.delete(media).where(eq(media._id, row._id));
    const legacy = await owe(tx, keys, 'media_deleted', row._id);
    const removal = row.oxyFileId
      ? await oweReferenceRemoval(tx, {
          fileId: row.oxyFileId,
          entityId: row._id,
          purge: true,
          reason: 'media_deleted',
        })
      : null;
    return { ...legacy, removal };
  });

  const settled = await settleCleanups(owed);
  const [oxyFile] = removal ? await settleReferenceRemovals([removal]) : [];
  const pending = settled.pending.length > 0 || oxyFile?.reference === 'pending';
  return {
    deleted: true,
    id: row._id,
    referencesCleared: references,
    storage: {
      status: pending ? 'pending' : 'complete',
      deletedKeys: settled.deleted,
      pendingKeys: settled.pending,
      sharedKeys: [...shared, ...settled.kept],
      ...(oxyFile ? { oxyFile } : {}),
    },
    warnings,
  };
}
