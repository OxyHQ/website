import { DomainError } from '../utils/domainError.js';
import path from 'node:path';
import { and, asc, count, eq, gt, isNotNull, isNull, sql } from 'drizzle-orm';
import { config } from '../config.js';
import { db } from '../db/postgres.js';
import {
  media,
  mediaStorageMigrations,
  oxyFileReferenceRemovals,
  storageCleanups,
} from '../db/schema/index.js';
import {
  addMediaReference,
  isSvgType,
  legacyKeyOfUrl,
  oxyMediaUrls,
  removeReference,
  sha256Hex,
  MEDIA_ENTITY_TYPE,
  type StoredFile,
  SVG_NOT_ACCEPTED,
  uploadFile,
  uploadLargeFile,
  uploadSvgFile,
} from './oxyFiles.js';
import { isLegacyStorageKey, LEGACY_KEY_PREFIX, publicUrlForKey, readFromSpaces } from './s3.js';
import {
  filenameForType,
  readBackSvg,
  sniffFileType,
  sniffImageType,
  sniffVideoType,
} from './media.js';

/* ──────────────────────────────────────────────
 * Carrying the legacy storage into Oxy Files, and measuring what is left.
 *
 * `bun run oxy-files migrate` (preview by default, `--apply` to write):
 *
 * 1. Orphans. A legacy URL that content still holds but no media row owns
 *    (a URL copied into markdown, a row deleted around its copies) gets a
 *    media row of its own in folder `migrated`, so it is carried over and
 *    referenced like any other.
 * 2. Rows. Each media row still on the legacy storage is read from the bucket,
 *    hashed, typed FROM ITS BYTES (the row's recorded type and name extension
 *    are corrected to match — the legacy upload trusted the browser), stored as
 *    one of the site's files (an image or video by the media upload, an SVG by
 *    the same upload as Oxy's sanitized document, anything else by the large
 *    upload) and checked: Oxy's SHA-256 must equal the one computed here, or
 *    the row is NOT switched. An SVG is the exception, because Oxy stores the
 *    SANITIZED document (ADR 0043 stage 4c): it is read back from Oxy and must
 *    hash to the SHA-256 Oxy reported and be an SVG document. Against an Oxy
 *    API without stage 4c, which refuses SVG, the row stays where it is,
 *    `deferred`, and the next run carries it over. The row then
 *    registers its reference and takes the Oxy URL and renditions; its legacy
 *    key and thumbnails are kept (row and `media_storage_migrations`) so a
 *    delete still removes the old copies until the bucket is retired.
 * 3. Copies. Every other column holding a migrated legacy URL is rewritten to
 *    the Oxy URL.
 *
 * Resumable: a migrated row is never read again, a failed one is retried by
 * the next run, and each phase is idempotent. Reports carry media ids,
 * SHA-256s, file ids and counts — never a URL.
 * ──────────────────────────────────────────── */

/** Tables the URL scan and rewrite never touch: the media library itself and the site's own bookkeeping. */
const UNSCANNED_TABLES = new Set([
  'media',
  'media_storage_migrations',
  'storage_cleanups',
  'oxy_file_reference_removals',
  'oxy_file_events',
  'oxy_file_reconciliations',
]);

const LEGACY_PATH_MARKER = `/${LEGACY_KEY_PREFIX}`;
/** A URL in any text: up to a quote, bracket, whitespace or backslash. */
const URL_PATTERN = /https?:\/\/[^\s"'()<>\\[\]]+/g;

interface ScannedColumn {
  table: string;
  column: string;
  kind: 'text' | 'jsonb' | 'array';
}

/** Every text, jsonb and text[] column of a table that has an `_id`, outside the unscanned set. */
async function scannedColumns(): Promise<ScannedColumn[]> {
  const rows = await db.execute<{ table_name: string; column_name: string; data_type: string }>(sql`
    select c.table_name, c.column_name, c.data_type
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.data_type in ('text', 'character varying', 'jsonb', 'json', 'ARRAY')
      and exists (
        select 1 from information_schema.columns i
        where i.table_schema = 'public' and i.table_name = c.table_name and i.column_name = '_id'
      )
    order by c.table_name, c.column_name
  `);
  return [...rows]
    .filter((row) => !UNSCANNED_TABLES.has(row.table_name) && row.column_name !== '_id')
    .map((row) => ({
      table: row.table_name,
      column: row.column_name,
      kind:
        row.data_type === 'ARRAY'
          ? 'array'
          : row.data_type === 'jsonb' || row.data_type === 'json'
            ? 'jsonb'
            : 'text',
    }));
}

function quoted(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`;
}

/** Rows of one column whose text mentions the legacy prefix (any host). */
async function rowsMentioningLegacy(
  column: ScannedColumn,
): Promise<{ id: string; value: unknown }[]> {
  const rows = await db.execute<{ id: string; value: unknown }>(
    sql.raw(
      `select "_id" as id, ${quoted(column.column)} as value from ${quoted(column.table)}
       where ${quoted(column.column)}::text like '%${LEGACY_PATH_MARKER}%' order by "_id"`,
    ),
  );
  return [...rows];
}

/** Every URL in a string, array or JSON value. */
function urlsIn(value: unknown, found: string[] = []): string[] {
  if (typeof value === 'string') {
    for (const match of value.matchAll(URL_PATTERN)) found.push(match[0]);
  } else if (Array.isArray(value)) {
    for (const item of value) urlsIn(item, found);
  } else if (value && typeof value === 'object') {
    for (const item of Object.values(value)) urlsIn(item, found);
  }
  return found;
}

/** The value with every URL `map` knows replaced; strings, arrays and JSON alike. */
function rewriteUrls(value: unknown, map: Map<string, string>): unknown {
  if (typeof value === 'string') return value.replace(URL_PATTERN, (url) => map.get(url) ?? url);
  if (Array.isArray(value)) return value.map((item) => rewriteUrls(item, map));
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, rewriteUrls(item, map)]),
    );
  return value;
}

/**
 * A text[] literal built element by element: a JS array bound as one
 * parameter is sent as a single scalar (AGENTS.md, "Database").
 */
function textArray(values: string[]) {
  return sql`ARRAY[${sql.join(
    values.map((value) => sql`${value}`),
    sql`, `,
  )}]::text[]`;
}

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return 'unparseable';
  }
}

// ── Census ──────────────────────────────────────────────────────────────────

export interface LegacyStorageCensus {
  media: {
    total: number;
    /** In Oxy Files. */
    oxy: number;
    /** On the legacy storage: what `migrate` carries over (an SVG included). */
    legacy: number;
    /** A path the site serves itself (`/images/…`), not storage. */
    sitePath: number;
    /** A URL on another host, hotlinked. */
    external: number;
    unavailable: number;
  };
  /** Rows per `table.column` still holding a legacy URL (any host). */
  legacyUrlRows: Record<string, number>;
  /** Hosts those legacy URLs are on — the configured CDN, or an older one. */
  legacyUrlHosts: Record<string, number>;
  pending: { referenceRemovals: number; legacyCleanups: number };
  migrations: Record<string, number>;
}

/**
 * Where the site's media stands. The bucket may be retired once `legacy` and
 * every `legacyUrlRows` count are zero and the CDN
 * has served the prefix nothing for the soak (docs/OXY-FILES.md).
 */
export async function legacyStorageCensus(): Promise<LegacyStorageCensus> {
  const rows = await db
    .select({
      url: media.url,
      key: media.key,
      oxyFileId: media.oxyFileId,
      mimeType: media.mimeType,
      unavailableAt: media.unavailableAt,
    })
    .from(media);
  const census: LegacyStorageCensus = {
    media: {
      total: rows.length,
      oxy: 0,
      legacy: 0,
      sitePath: 0,
      external: 0,
      unavailable: 0,
    },
    legacyUrlRows: {},
    legacyUrlHosts: {},
    pending: { referenceRemovals: 0, legacyCleanups: 0 },
    migrations: {},
  };
  for (const row of rows) {
    if (row.unavailableAt) census.media.unavailable += 1;
    if (row.oxyFileId) census.media.oxy += 1;
    else if (isLegacyRow(row)) census.media.legacy += 1;
    else if (row.url.startsWith('/')) census.media.sitePath += 1;
    else census.media.external += 1;
  }
  for (const column of await scannedColumns()) {
    const mentions = await rowsMentioningLegacy(column);
    let rowsWithLegacy = 0;
    for (const { value } of mentions) {
      const legacy = urlsIn(value).filter((url) => url.includes(LEGACY_PATH_MARKER));
      if (legacy.length === 0) continue;
      rowsWithLegacy += 1;
      for (const url of legacy) {
        const host = hostOf(url);
        census.legacyUrlHosts[host] = (census.legacyUrlHosts[host] ?? 0) + 1;
      }
    }
    if (rowsWithLegacy > 0)
      census.legacyUrlRows[`${column.table}.${column.column}`] = rowsWithLegacy;
  }
  const [[removals], [cleanups], statuses] = await Promise.all([
    db.select({ value: count() }).from(oxyFileReferenceRemovals),
    db.select({ value: count() }).from(storageCleanups),
    db
      .select({ status: mediaStorageMigrations.status, value: count() })
      .from(mediaStorageMigrations)
      .groupBy(mediaStorageMigrations.status),
  ]);
  census.pending = {
    referenceRemovals: Number(removals?.value ?? 0),
    legacyCleanups: Number(cleanups?.value ?? 0),
  };
  for (const { status, value } of statuses) census.migrations[status] = Number(value);
  return census;
}

function isLegacyRow(row: { url: string; key: string | null; oxyFileId: string | null }): boolean {
  return (
    !row.oxyFileId &&
    row.key !== null &&
    isLegacyStorageKey(row.key) &&
    publicUrlForKey(row.key) === row.url
  );
}

// ── Migration ───────────────────────────────────────────────────────────────

export interface MigrationItem {
  mediaId: string;
  status: 'migrated' | 'would_migrate' | 'deferred' | 'failed';
  legacySha256?: string;
  oxySha256?: string;
  oxyFileId?: string;
  /** A short cause — never a URL or a key. */
  error?: string;
}

export interface MigrationReport {
  mode: 'preview' | 'apply';
  orphans: { found: number; created: number; missing: number };
  media: Record<MigrationItem['status'], number>;
  rewrite: {
    /** Rows changed (or, in preview, that would change) per `table.column`. */
    rows: Record<string, number>;
    replaced: number;
    /** Legacy URLs on the configured CDN no migrated row accounts for. */
    unmapped: number;
    /** Legacy-path URLs on another host, left as they are. */
    otherHosts: number;
  };
  items: MigrationItem[];
}

/** The cause of a failure, without anything that could carry a URL or a key. */
function causeOf(error: unknown): string {
  if (error instanceof Error) {
    const code = (error as { code?: unknown }).code;
    const kind = (error as { kind?: unknown }).kind;
    const label = typeof code === 'string' ? code : typeof kind === 'string' ? kind : error.name;
    return `${label}: ${error.message.replace(/\S*\/\S*/g, '…')}`.slice(0, 200);
  }
  return 'unknown error';
}

/** Phase 1: give every legacy URL content holds a media row, if none owns it. */
async function adoptOrphans(apply: boolean): Promise<MigrationReport['orphans']> {
  const owned = new Set<string>();
  const ownedRows = await db.select({ key: media.key, thumbnails: media.thumbnails }).from(media);
  for (const row of ownedRows) {
    if (row.key) owned.add(publicUrlForKey(row.key));
    for (const url of Object.values(row.thumbnails ?? {})) if (url) owned.add(url);
  }
  const recorded = await db
    .select({ thumbnails: mediaStorageMigrations.legacyThumbnails })
    .from(mediaStorageMigrations);
  for (const row of recorded)
    for (const url of Object.values(row.thumbnails ?? {})) if (url) owned.add(url);

  const orphans = new Map<string, string>();
  for (const column of await scannedColumns())
    for (const { value } of await rowsMentioningLegacy(column))
      for (const url of urlsIn(value)) {
        const key = legacyKeyOfUrl(url);
        if (key && !owned.has(url)) orphans.set(url, key);
      }

  const result = { found: orphans.size, created: 0, missing: 0 };
  if (!apply) return result;
  for (const [url, key] of orphans) {
    const object = await readFromSpaces(key);
    if (!object) {
      result.missing += 1;
      continue;
    }
    await db.insert(media).values({
      url,
      key,
      filename: path.basename(key),
      mimeType: object.contentType,
      size: object.buffer.length,
      folder: 'migrated',
      tags: ['migrated'],
      uploadedBy: 'oxy-files-migration',
    });
    result.created += 1;
  }
  return result;
}

/** Oxy meters an application's writes per minute; a 429 is waited out this long. */
export const RATE_LIMIT_WAIT_MS = 61_000;
/** Consecutive 429s one call waits out before it is the row's failure. */
const RATE_LIMIT_ATTEMPTS = 10;

let pause = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Tests replace the wait; production waits the full minute. */
export function setRateLimitPauseForTests(next: (ms: number) => Promise<void>): void {
  pause = next;
}

/**
 * Run an Oxy Files call, waiting out Oxy's per-minute budget: a 429 waits a
 * minute and makes the SAME call again, so a rate limit is never a row's
 * outcome (it was reported `unavailable`, and a run moved 30 rows a minute and
 * failed the rest).
 */
async function waitingOutRateLimits<T>(call: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await call();
    } catch (error) {
      const limited = error instanceof DomainError && error.kind === 'rate_limited';
      if (!limited || attempt >= RATE_LIMIT_ATTEMPTS) throw error;
      await pause(RATE_LIMIT_WAIT_MS);
    }
  }
}

/** Phase 2 for one row. Never throws: the outcome is the item. */
async function migrateRow(row: typeof media.$inferSelect, apply: boolean): Promise<MigrationItem> {
  const item: MigrationItem = { mediaId: row._id, status: 'failed' };
  const key = row.key;
  try {
    if (!key) throw new Error('the row has no legacy key');
    const object = await readFromSpaces(key);
    if (!object) {
      item.error = 'missing: the legacy object does not exist';
      return await record(row, item, apply);
    }
    item.legacySha256 = sha256Hex(object.buffer);
    // What the row IS comes from the bytes, never the type the legacy upload
    // recorded (a browser's guess: raster images were stored as
    // `application/octet-stream`, named `.bin`). The row takes that type, and a
    // name whose extension says otherwise is corrected with it.
    const type = sniffFileType(object.buffer);
    const filename = filenameForType(row.filename, type);
    if (!apply) {
      item.status = 'would_migrate';
      return item;
    }

    // An image or a video through the media upload, with its renditions; an
    // SVG through the same upload, stored sanitized; any other file (a PDF,
    // an icon, an archive) through the large upload.
    const svg = isSvgType(type);
    const isMedia = Boolean(sniffImageType(object.buffer) ?? sniffVideoType(object.buffer));
    let file: StoredFile;
    if (svg) {
      const stored = await waitingOutRateLimits(() => uploadSvgFile(object.buffer, filename));
      if (stored === SVG_NOT_ACCEPTED) {
        // The Oxy API predates stage 4c: the row stays on the legacy storage,
        // recorded as the SVG it is, and the next run carries it over.
        item.status = 'deferred';
        item.error = 'svg_not_accepted: the Oxy API does not take SVG yet (ADR 0043 stage 4c)';
        if (row.mimeType !== type || row.filename !== filename)
          await db
            .update(media)
            .set({ mimeType: type, filename, updatedAt: new Date() })
            .where(and(eq(media._id, row._id), isNull(media.oxyFileId)));
        return await record(row, item, apply);
      }
      file = stored;
    } else if (isMedia)
      file = await waitingOutRateLimits(() => uploadFile(object.buffer, type, filename));
    else file = await waitingOutRateLimits(() => uploadLargeFile(object.buffer, type, filename));
    item.oxySha256 = file.sha256;
    item.oxyFileId = file.fileId;
    // Oxy stores an SVG as its sanitized document, whose hash is Oxy's to
    // report: the stored document is read back and held to it instead.
    if (svg) await readBackSvg(file);
    else if (file.sha256 !== item.legacySha256)
      throw new Error('integrity: the SHA-256 values differ');
    await waitingOutRateLimits(() => addMediaReference(file.fileId, row._id));
    const switched = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(media)
        .set({
          ...oxyMediaUrls(file.fileId, type),
          oxyFileId: file.fileId,
          sha256: file.sha256,
          mimeType: type,
          filename,
          size: file.size,
          updatedAt: new Date(),
        })
        .where(and(eq(media._id, row._id), isNull(media.oxyFileId)))
        .returning({ id: media._id });
      if (!updated) return false;
      item.status = 'migrated';
      await upsertRecord(tx, row, item);
      return true;
    });
    if (!switched) {
      // Deleted or migrated by another run meanwhile: this run's reference is not needed.
      await removeReference(file.fileId, MEDIA_ENTITY_TYPE, row._id);
      item.status = 'failed';
      item.error = 'changed: the row was deleted or migrated meanwhile';
    }
    return item;
  } catch (error) {
    item.status = 'failed';
    item.error = causeOf(error);
    return await record(row, item, apply);
  }
}

async function record(
  row: typeof media.$inferSelect,
  item: MigrationItem,
  apply: boolean,
): Promise<MigrationItem> {
  if (apply) await upsertRecord(db, row, item);
  return item;
}

async function upsertRecord(
  executor: Pick<typeof db, 'insert'>,
  row: typeof media.$inferSelect,
  item: MigrationItem,
): Promise<void> {
  const values = {
    status: item.status,
    legacySha256: item.legacySha256 ?? null,
    oxySha256: item.oxySha256 ?? null,
    oxyFileId: item.oxyFileId ?? null,
    error: item.error ?? null,
    migratedAt: item.status === 'migrated' ? new Date() : null,
  };
  await executor
    .insert(mediaStorageMigrations)
    .values({
      mediaId: row._id,
      legacyKey: row.key ?? '',
      legacyUrl: row.url,
      legacyThumbnails: row.thumbnails,
      attempts: 1,
      ...values,
    })
    .onConflictDoUpdate({
      target: mediaStorageMigrations.mediaId,
      set: {
        ...values,
        attempts: sql`${mediaStorageMigrations.attempts} + 1`,
        updatedAt: new Date(),
      },
    });
}

/** Phase 3: rewrite every legacy URL a migrated row accounts for. */
async function rewriteCopies(apply: boolean): Promise<MigrationReport['rewrite']> {
  const map = new Map<string, string>();
  const migrated = await db
    .select({
      legacyUrl: mediaStorageMigrations.legacyUrl,
      legacyThumbnails: mediaStorageMigrations.legacyThumbnails,
      url: media.url,
      thumbnails: media.thumbnails,
    })
    .from(mediaStorageMigrations)
    .innerJoin(media, eq(media._id, mediaStorageMigrations.mediaId))
    .where(and(eq(mediaStorageMigrations.status, 'migrated'), isNotNull(media.oxyFileId)));
  for (const row of migrated) {
    map.set(row.legacyUrl, row.url);
    for (const size of ['sm', 'md', 'lg'] as const) {
      const legacy = row.legacyThumbnails?.[size];
      if (legacy) map.set(legacy, row.thumbnails[size] || row.url);
    }
  }

  const result: MigrationReport['rewrite'] = { rows: {}, replaced: 0, unmapped: 0, otherHosts: 0 };
  for (const column of await scannedColumns()) {
    for (const { id, value } of await rowsMentioningLegacy(column)) {
      for (const url of urlsIn(value)) {
        if (!url.includes(LEGACY_PATH_MARKER)) continue;
        if (map.has(url)) result.replaced += 1;
        else if (legacyKeyOfUrl(url)) result.unmapped += 1;
        else result.otherHosts += 1;
      }
      const next = rewriteUrls(value, map);
      if (JSON.stringify(next) === JSON.stringify(value)) continue;
      const label = `${column.table}.${column.column}`;
      result.rows[label] = (result.rows[label] ?? 0) + 1;
      if (!apply) continue;
      const target = sql.raw(`${quoted(column.table)}`);
      const field = sql.raw(quoted(column.column));
      const written =
        column.kind === 'jsonb'
          ? sql`${JSON.stringify(next)}::jsonb`
          : column.kind === 'array'
            ? textArray(next as string[])
            : sql`${next as string}`;
      // Only if the value is still the one read: an edit made meanwhile wins
      // and is picked up by the next run.
      const previous =
        column.kind === 'jsonb'
          ? sql`${field} = ${JSON.stringify(value)}::jsonb`
          : column.kind === 'array'
            ? sql`${field} = ${textArray(value as string[])}`
            : sql`${field} = ${value as string}`;
      await db.execute(
        sql`update ${target} set ${field} = ${written} where "_id" = ${id} and ${previous}`,
      );
    }
  }
  return result;
}

/** Run the migration. Preview reads and counts; apply writes. Never against a database not meant for it. */
export async function migrateLegacyStorage(options: {
  apply: boolean;
  limit?: number;
}): Promise<MigrationReport> {
  const mode = options.apply ? 'apply' : 'preview';
  const orphans = await adoptOrphans(options.apply);
  const items: MigrationItem[] = [];
  const limit = options.limit ?? Number.POSITIVE_INFINITY;
  let after = '';
  while (items.length < limit) {
    const page = await db
      .select()
      .from(media)
      .where(and(isNull(media.oxyFileId), isNotNull(media.key), gt(media._id, after)))
      .orderBy(asc(media._id))
      .limit(100);
    if (page.length === 0) break;
    after = page[page.length - 1]._id;
    for (const row of page) {
      if (items.length >= limit) break;
      if (!isLegacyRow(row)) continue;
      items.push(await migrateRow(row, options.apply));
    }
  }
  const counts: MigrationReport['media'] = {
    migrated: 0,
    would_migrate: 0,
    deferred: 0,
    failed: 0,
  };
  for (const item of items) counts[item.status] += 1;
  const rewrite = await rewriteCopies(options.apply);
  return { mode, orphans, media: counts, rewrite, items };
}

/** The configured legacy CDN, for the CLI's header line. */
export function legacyCdnHost(): string {
  return hostOf(config.s3.cdnBaseUrl);
}
