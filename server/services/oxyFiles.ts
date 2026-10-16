import { createHash } from 'node:crypto';
import { UpstreamError } from '@oxy.so/core/server';
import type { ServiceReferenceInventoryItem, ServiceReferenceReconcileResult } from '@oxy.so/core';
import { DomainError } from '../utils/domainError.js';
import { oxyFilesApi } from './oxyFilesApi.js';
import {
  deleteFromSpaces,
  isLegacyStorageKey,
  keyFromPublicUrl,
  publicUrlForKey,
  uploadToSpaces,
} from './s3.js';

/* ──────────────────────────────────────────────
 * The one door between the site and file storage (ADR 0043, docs/OXY-FILES.md).
 *
 * Every file but an SVG is a file the Oxy Website APPLICATION owns in Oxy
 * Files — images and videos through the media upload, any other type (a PDF,
 * an icon, an archive) through the resumable large upload (stage 4b) — content belonging to the site, not to whichever editor uploaded it
 * (the media row keeps that editor as `uploadedBy`, an audit field). Each
 * media row registers its own use of the file (`media`, the row's `_id`);
 * Oxy moves an application's file nobody uses to trash after 24 hours and
 * deletes it 30 days later, so the site never deletes bytes another row still
 * needs and never has to garbage-collect anything itself.
 *
 * Nothing else in the server talks to storage. The legacy functions at the
 * bottom are what is left of the bucket the site wrote to before.
 * ──────────────────────────────────────────── */

/** The entity type of every reference the site registers: one per media row. */
export const MEDIA_ENTITY_TYPE = 'media';

/** Oxy's webp renditions standing in for the legacy 200/400/800-pixel JPEG thumbnails. */
export const THUMBNAIL_VARIANTS = { sm: 'w320', md: 'w640', lg: 'w1280' } as const;

/** The largest image or video Oxy Files stores (`USER_MEDIA_MAX_BYTES` in the Oxy API). */
export const OXY_FILES_MAX_BYTES = 40 * 1024 * 1024;

/** The raster types Oxy makes webp renditions of; any other file is served as stored. */
const RENDERED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
]);

/** A whole upload (40 MiB at worst) may take longer than the SDK's default request timeout. */
const UPLOAD_TIMEOUT_MS = 120_000;

export type Thumbnails = { sm: string; md: string; lg: string };

export const NO_THUMBNAILS: Thumbnails = { sm: '', md: '', lg: '' };

export interface StoredFile {
  fileId: string;
  sha256: string;
  mimeType: string;
  size: number;
  /** True when the site already held these bytes: Oxy answered the existing file. */
  deduplicated: boolean;
}

export function sha256Hex(buffer: Uint8Array): string {
  return createHash('sha256').update(buffer).digest('hex');
}

/**
 * Whether a file of this type must stay on the legacy storage: an SVG, which
 * Oxy Files refuses as an active document until it stores sanitized SVG.
 * Everything else is an Oxy file. The type must be what the BYTES are, never a
 * declared Content-Type.
 *
 * TODO(oxy-svg): drop this, and the legacy path behind it, once Oxy Files
 * takes sanitized SVG.
 */
export function awaitsOxySvgSupport(mimeType: string): boolean {
  return mimeType.toLowerCase().startsWith('image/svg');
}

/** The public URL of a file, or of one of its image renditions. */
export function oxyFileUrl(fileId: string, variant?: string): string {
  return oxyFilesApi().publicUrl(fileId, variant);
}

/**
 * The `url` and `thumbnails` a media row holding this file stores. A video's
 * thumbnails stay empty: the site reads `thumbnails.lg || url` for a hero
 * video's source, so an image there would replace the video with a still.
 */
export function oxyMediaUrls(
  fileId: string,
  mimeType: string,
): { url: string; thumbnails: Thumbnails } {
  if (!RENDERED_IMAGE_TYPES.has(mimeType))
    return { url: oxyFileUrl(fileId), thumbnails: NO_THUMBNAILS };
  return {
    url: oxyFileUrl(fileId),
    thumbnails: {
      sm: oxyFileUrl(fileId, THUMBNAIL_VARIANTS.sm),
      md: oxyFileUrl(fileId, THUMBNAIL_VARIANTS.md),
      lg: oxyFileUrl(fileId, THUMBNAIL_VARIANTS.lg),
    },
  };
}

// ── Errors ──────────────────────────────────────────────────────────────────

function statusOf(error: unknown): number | undefined {
  const status = (error as { status?: unknown } | null)?.status;
  return typeof status === 'number' && status > 0 ? status : undefined;
}

function codeOf(error: unknown): string | undefined {
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === 'string' ? code : undefined;
}

/**
 * What a failed Oxy Files call means to the editor. Only refusals the caller
 * can act on keep their own wording; anything else is "unavailable", which a
 * retry may get past.
 */
export function fromOxyFilesError(error: unknown): Error {
  if (error instanceof DomainError || error instanceof UpstreamError) return error;
  const status = statusOf(error);
  const code = codeOf(error);
  if (code === 'CONTENT_BLOCKED' || status === 451)
    return new DomainError(
      'invalid',
      'This file was taken down after a content claim and cannot be stored again',
    );
  if (code === 'INVALID_SOURCE_URL' || code === 'SOURCE_URL_REFUSED' || status === 422)
    return new DomainError(
      'invalid',
      'That URL cannot be imported: only public https addresses are fetched',
    );
  if (code === 'SOURCE_FETCH_FAILED' || code === 'SOURCE_FETCH_TIMEOUT')
    return new UpstreamError('The remote source could not be downloaded');
  if (status === 415)
    return new DomainError(
      'invalid',
      'Oxy Files does not store this type of file (programs, HTML, XML and scripts are refused)',
    );
  if (status === 413)
    return new DomainError('too_large', 'The file is larger than Oxy Files accepts');
  console.error('[oxy-files] request failed:', status ?? 'no status', code ?? '', error);
  return new DomainError('unavailable', 'Oxy Files is unavailable; try again shortly');
}

// ── Storing ─────────────────────────────────────────────────────────────────

/**
 * Store bytes as one of the site's files, public. Idempotent per bytes: the
 * same bytes again answer the same file (`deduplicated`). The file is not used
 * by anything until {@link addMediaReference} — if the caller fails before
 * that, Oxy collects it, so a failed upload needs no compensation.
 */
export async function uploadFile(
  buffer: Buffer,
  mimeType: string,
  originalName: string,
): Promise<StoredFile> {
  const expected = sha256Hex(buffer);
  let answer: Awaited<ReturnType<ReturnType<typeof oxyFilesApi>['uploadAppFile']>>;
  try {
    answer = await oxyFilesApi().uploadAppFile(new Uint8Array(buffer), mimeType, {
      visibility: 'public',
      originalName,
      timeout: UPLOAD_TIMEOUT_MS,
    });
  } catch (error) {
    throw fromOxyFilesError(error);
  }
  if (answer.file.sha256 !== expected) {
    console.error(
      `[oxy-files] stored file ${answer.file.id} hashes to ${answer.file.sha256}, the upload to ${expected}`,
    );
    throw new DomainError('unavailable', 'Oxy Files stored different bytes; try again');
  }
  return {
    fileId: answer.file.id,
    sha256: answer.file.sha256,
    mimeType: answer.file.mime,
    size: answer.file.size,
    deduplicated: answer.deduplicated,
  };
}

/**
 * Store bytes of ANY type Oxy Files takes — a PDF, an icon, an archive — as one
 * of the site's files, public, through the resumable large upload (ADR 0043
 * stage 4b, `uploadAppFileLarge`). Oxy refuses programs and active documents
 * (HTML, SVG, XML, scripts) by type and by the name's extension (415), and
 * serves every type a browser would not render safely as a download. Oxy
 * hashes the assembled file before it is one; the site checks that hash
 * against its own as for any upload. Unreferenced until {@link addMediaReference}.
 */
export async function uploadLargeFile(
  buffer: Buffer,
  mimeType: string,
  filename: string,
): Promise<StoredFile> {
  const expected = sha256Hex(buffer);
  let answer: Awaited<ReturnType<ReturnType<typeof oxyFilesApi>['uploadAppFileLarge']>>;
  try {
    answer = await oxyFilesApi().uploadAppFileLarge(new Uint8Array(buffer), {
      mime: mimeType,
      visibility: 'public',
      filename,
      sha256: expected,
    });
  } catch (error) {
    throw fromOxyFilesError(error);
  }
  if (answer.file.sha256 !== expected) {
    console.error(
      `[oxy-files] stored file ${answer.file.id} hashes to ${answer.file.sha256}, the upload to ${expected}`,
    );
    throw new DomainError('unavailable', 'Oxy Files stored different bytes; try again');
  }
  return {
    fileId: answer.file.id,
    sha256: answer.file.sha256,
    mimeType: answer.file.mime,
    size: answer.file.size,
    deduplicated: answer.deduplicated,
  };
}

/**
 * Have Oxy fetch a URL into one of the site's files (ADR 0043 D7): Oxy's own
 * SSRF-safe fetcher, and the same URL imported again answers the file it
 * already made without fetching. Unreferenced until {@link addMediaReference}.
 */
export async function importFile(sourceUrl: string, signal?: AbortSignal): Promise<StoredFile> {
  try {
    const answer = await oxyFilesApi().importAppFile(sourceUrl, {
      visibility: 'public',
      ...(signal ? { signal } : {}),
    });
    return {
      fileId: answer.file.id,
      sha256: answer.file.sha256,
      mimeType: answer.file.mime,
      size: answer.file.size,
      deduplicated: answer.deduplicated || answer.outcome !== 'downloaded',
    };
  } catch (error) {
    throw fromOxyFilesError(error);
  }
}

// ── References ──────────────────────────────────────────────────────────────

/**
 * Register a media row's use of its file. Called BEFORE the row is written, so
 * no committed row is ever without its reference. A file that is gone (taken
 * down, or purged between the upload and now) is refused.
 */
export async function addMediaReference(fileId: string, mediaId: string): Promise<void> {
  let results: Awaited<ReturnType<ReturnType<typeof oxyFilesApi>['references']['add']>>;
  try {
    results = await oxyFilesApi().references.add([
      { fileId, entityType: MEDIA_ENTITY_TYPE, entityId: mediaId },
    ]);
  } catch (error) {
    throw fromOxyFilesError(error);
  }
  const result = results[0]?.result;
  if (result !== 'created' && result !== 'exists')
    throw new DomainError('unavailable', 'The stored file is no longer available; upload it again');
}

/** Withdraw a reference. `not_found` means there was none to withdraw, which is the goal. */
export async function removeReference(
  fileId: string,
  entityType: string,
  entityId: string,
): Promise<void> {
  try {
    await oxyFilesApi().references.remove([{ fileId, entityType, entityId }]);
  } catch (error) {
    throw fromOxyFilesError(error);
  }
}

/**
 * Delete one of the site's files now rather than after Oxy's grace period.
 * `in_use` when anything still references it (another application, or a row
 * that took it since) — then the reference removal alone stands and Oxy
 * collects the file once it is free.
 */
export async function deleteFile(fileId: string): Promise<'deleted' | 'in_use' | 'gone'> {
  try {
    await oxyFilesApi().deleteAppFile(fileId);
    return 'deleted';
  } catch (error) {
    const status = statusOf(error);
    if (status === 404) return 'gone';
    if (status === 409) return 'in_use';
    throw fromOxyFilesError(error);
  }
}

/**
 * Send Oxy the full inventory of the site's `media` references and let it add
 * the missing and remove the stale (ADR 0043 D6).
 */
export async function reconcileMediaReferences(
  items: AsyncIterable<ServiceReferenceInventoryItem>,
  options: { dryRun: boolean },
): Promise<ServiceReferenceReconcileResult | 'busy'> {
  try {
    return await oxyFilesApi().references.reconcile(MEDIA_ENTITY_TYPE, items, options);
  } catch (error) {
    // One reconciliation per application and entity type at a time: another
    // task (or an operator's run) holds it, and that one will finish the job.
    if (statusOf(error) === 409) return 'busy';
    throw fromOxyFilesError(error);
  }
}

// ── Legacy storage ──────────────────────────────────────────────────────────

/**
 * TODO(oxy-svg): Oxy Files refuses SVG (an active document) until it stores
 * sanitized SVG. Until then an SVG an editor uploads still goes to the legacy
 * storage, and its row keeps a legacy `key`; `bun run oxy-files migrate`
 * records those rows `deferred` and carries them over once Oxy accepts SVG,
 * and the bucket cannot be retired before that (docs/OXY-FILES.md). Every
 * other type is an Oxy file ({@link uploadFile}, {@link uploadLargeFile}).
 */
export async function uploadLegacyFile(
  buffer: Buffer,
  filename: string,
  contentType: string,
  folder: string,
): Promise<{ url: string; key: string }> {
  const url = await uploadToSpaces(buffer, filename, contentType, folder);
  const key = keyFromPublicUrl(url);
  if (!key) throw new Error(`legacy storage answered an unparseable URL for ${filename}`);
  return { url, key };
}

/**
 * Delete a legacy object. Refuses any key outside the site's own `oxy-website/`
 * prefix: the legacy objects live in Oxy's media bucket and share their host
 * with Oxy's own files, so a URL like `<cdn>/<fileId>` parses to a key that is
 * not the site's to delete.
 */
export async function deleteLegacyObject(key: string): Promise<void> {
  if (!isLegacyStorageKey(key))
    throw new Error(`refusing to delete ${key}: not under the site's legacy prefix`);
  await deleteFromSpaces(key);
}

/** The legacy object key behind a URL, or null when the URL is not a legacy object's. */
export function legacyKeyOfUrl(url: string): string | null {
  const key = keyFromPublicUrl(url);
  return key && isLegacyStorageKey(key) && publicUrlForKey(key) === url ? key : null;
}
