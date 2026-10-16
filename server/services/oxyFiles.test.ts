import { beforeEach, describe, expect, test } from 'bun:test';
import { eq } from 'drizzle-orm';
import { db } from '../db/postgres.js';
import {
  media,
  mediaStorageMigrations,
  newsroomPosts,
  oxyFileReconciliations,
  pages,
  testimonials,
} from '../db/schema/index.js';
import { countRows, oxy, png, resetDatabase, storage } from '../test/helpers.js';
import { ingestUpload } from './media.js';
import { deleteLegacyObject } from './oxyFiles.js';
import { legacyStorageCensus, migrateLegacyStorage } from './oxyFilesMigration.js';
import { reconcileMediaFiles } from './oxyFilesReconcile.js';

beforeEach(resetDatabase);

const WEBM = Buffer.concat([
  Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x82, 0x84]),
  Buffer.from('webm', 'latin1'),
  Buffer.alloc(32, 7),
]);
const SVG = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>',
);

describe('an editor upload', () => {
  test('an image becomes a file of the application, with Oxy renditions and the editor as audit', async () => {
    const { media: row, reused } = await ingestUpload({
      buffer: await png(500, 400, 3),
      filename: 'Launch Photo.png',
      declaredType: 'image/png',
      folder: 'newsroom',
      uploadedBy: 'editor-1',
    });
    expect(reused).toBe(false);
    expect(row.oxyFileId).toBeTruthy();
    expect(row.key).toBeNull();
    expect(row.uploadedBy).toBe('editor-1');
    expect(row.filename).toBe('Launch-Photo.png');
    expect(row.thumbnails.lg).toBe(`https://cloud.test/${row.oxyFileId}?variant=w1280`);
    expect(row.sha256).toBe(oxy.files.get(row.oxyFileId ?? '')?.sha256 ?? 'missing');
    expect(oxy.references.has(`${row.oxyFileId}|media|${row._id}`)).toBe(true);
    expect(storage.objects.size).toBe(0);
  });

  test('the same bytes, name and folder again reuse the row', async () => {
    const input = {
      buffer: await png(64, 64, 8),
      filename: 'a.png',
      declaredType: 'image/png',
      folder: 'images',
      uploadedBy: 'editor-1',
    };
    const first = await ingestUpload(input);
    const second = await ingestUpload(input);
    expect(second.reused).toBe(true);
    expect(second.media._id).toBe(first.media._id);
    expect(await countRows('media')).toBe(1);
  });

  test('a video is stored in Oxy Files with no thumbnails (a still would replace the video)', async () => {
    const { media: row } = await ingestUpload({
      buffer: WEBM,
      filename: 'hero.webm',
      declaredType: 'video/webm',
      folder: 'hero',
      uploadedBy: 'editor-1',
    });
    expect(row.mimeType).toBe('video/webm');
    expect(row.oxyFileId).toBeTruthy();
    expect(row.thumbnails).toEqual({ sm: '', md: '', lg: '' });
  });

  test('a type Oxy Files cannot take yet stays in the legacy storage', async () => {
    const { media: row } = await ingestUpload({
      buffer: SVG,
      filename: 'logo.svg',
      declaredType: 'image/svg+xml',
      folder: 'products',
      uploadedBy: 'editor-1',
    });
    expect(row.oxyFileId).toBeNull();
    expect(row.key).toMatch(/^oxy-website\/products\/logo-[0-9a-f]{8}\.svg$/);
    expect(oxy.files.size).toBe(0);
    expect(storage.objects.has(row.key ?? '')).toBe(true);
  });

  test('a folder that is not one segment is refused before anything is stored', async () => {
    await expect(
      ingestUpload({
        buffer: await png(),
        filename: 'x.png',
        declaredType: 'image/png',
        folder: '../x',
        uploadedBy: 'editor-1',
      }),
    ).rejects.toThrow('folder must be one lower-case segment');
    expect(oxy.files.size + storage.objects.size).toBe(0);
  });

  test('bytes Oxy stores differently are refused and no row is written', async () => {
    oxy.corruptNextUpload = true;
    await expect(
      ingestUpload({
        buffer: await png(70, 70, 2),
        filename: 'x.png',
        declaredType: 'image/png',
        folder: 'images',
        uploadedBy: 'editor-1',
      }),
    ).rejects.toThrow('Oxy Files stored different bytes');
    expect(await countRows('media')).toBe(0);
    expect(oxy.references.size).toBe(0);
  });
});

describe('the legacy storage', () => {
  test('a delete outside the site prefix is refused: the bucket is Oxy’s', async () => {
    await expect(deleteLegacyObject('f00000000000000000000001')).rejects.toThrow('refusing');
    await expect(deleteLegacyObject('oxy-website/../files/x')).rejects.toThrow('refusing');
  });
});

/** A media row and its objects as the site wrote them before Oxy Files. */
async function legacyRow(name: string, buffer: Buffer, contentType = 'image/png') {
  const key = `oxy-website/images/${name}`;
  const thumbKey = `oxy-website/images/thumbs/${name}-md.jpg`;
  storage.objects.set(key, { size: buffer.length, contentType, buffer });
  storage.objects.set(thumbKey, { size: 1, contentType: 'image/jpeg', buffer: Buffer.from([9]) });
  const [row] = await db
    .insert(media)
    .values({
      url: `https://cdn.test/${key}`,
      key,
      thumbnails: { sm: '', md: `https://cdn.test/${thumbKey}`, lg: '' },
      filename: name,
      mimeType: contentType,
      size: buffer.length,
      uploadedBy: 'editor-0',
    })
    .returning();
  return row;
}

describe('the migration', () => {
  test('preview reads and counts, and writes nothing anywhere', async () => {
    const row = await legacyRow('a.png', await png(300, 200, 1));
    await db.insert(testimonials).values({ quote: 'q', author: 'A', avatar: row.url });
    const report = await migrateLegacyStorage({ apply: false });
    expect(report.media).toEqual({ migrated: 0, would_migrate: 1, deferred: 0, failed: 0 });
    expect(report.rewrite.unmapped).toBe(1);
    expect(oxy.files.size).toBe(0);
    expect(await countRows('media_storage_migrations')).toBe(0);
    const [after] = await db.select().from(media);
    expect(after.oxyFileId).toBeNull();
  });

  test('apply carries each row over verified, rewrites every copy, and a second run changes nothing', async () => {
    const bytes = await png(300, 200, 1);
    const row = await legacyRow('a.png', bytes);
    const svg = await legacyRow('logo.svg', SVG, 'image/svg+xml');
    const [{ _id: testimonialId }] = await db
      .insert(testimonials)
      .values({ quote: 'q', author: 'A', avatar: row.url })
      .returning();
    const orphanBytes = await png(120, 90, 5);
    storage.objects.set('oxy-website/newsroom/inline.png', {
      size: orphanBytes.length,
      contentType: 'image/png',
      buffer: orphanBytes,
    });
    const [post] = await db
      .insert(newsroomPosts)
      .values({
        title: 'Post',
        slug: 'post',
        content: `![a](${row.url}) and ![b](https://cdn.test/oxy-website/newsroom/inline.png) and ${row.thumbnails.md}`,
      })
      .returning();
    await db.insert(pages).values({
      slug: 'home',
      title: 'Home',
      sections: [{ type: 'hero', image: row.url, gallery: [row.url, '/images/static.png'] }],
    });

    const report = await migrateLegacyStorage({ apply: true });
    expect(report.orphans).toEqual({ found: 1, created: 1, missing: 0 });
    expect(report.media).toEqual({ migrated: 2, would_migrate: 0, deferred: 1, failed: 0 });
    expect(JSON.stringify(report)).not.toContain('https://');

    const [migrated] = await db.select().from(media).where(eq(media._id, row._id));
    const fileId = migrated.oxyFileId ?? '';
    expect(oxy.files.get(fileId)?.bytes.equals(bytes)).toBe(true);
    expect(migrated.url).toBe(`https://cloud.test/${fileId}`);
    expect(migrated.key).toBe(row.key); // kept until the bucket is retired
    expect(oxy.references.has(`${fileId}|media|${row._id}`)).toBe(true);
    const [record] = await db
      .select()
      .from(mediaStorageMigrations)
      .where(eq(mediaStorageMigrations.mediaId, row._id));
    expect(record.legacySha256).toBe(record.oxySha256 ?? 'missing');
    expect(record.legacyThumbnails.md).toBe(row.thumbnails.md);

    const [deferred] = await db.select().from(media).where(eq(media._id, svg._id));
    expect(deferred.oxyFileId).toBeNull();

    const [testimonial] = await db
      .select()
      .from(testimonials)
      .where(eq(testimonials._id, testimonialId));
    expect(testimonial.avatar).toBe(migrated.url);
    const [rewritten] = await db
      .select()
      .from(newsroomPosts)
      .where(eq(newsroomPosts._id, post._id));
    expect(rewritten.content).not.toContain('cdn.test');
    expect(rewritten.content).toContain(`${migrated.url}?variant=w640`);
    const [page] = await db.select().from(pages);
    expect(page.sections).toEqual([
      { type: 'hero', image: migrated.url, gallery: [migrated.url, '/images/static.png'] },
    ]);

    const again = await migrateLegacyStorage({ apply: true });
    expect(again.orphans.found).toBe(0);
    expect(again.media).toEqual({ migrated: 0, would_migrate: 0, deferred: 1, failed: 0 });
    expect(again.rewrite.rows).toEqual({});

    const census = await legacyStorageCensus();
    expect(census.media).toMatchObject({ oxy: 2, legacy: 0, legacyAwaitingOxy4b: 1 });
    expect(census.legacyUrlRows).toEqual({});
    expect(census.migrations).toEqual({ migrated: 2, deferred: 1 });
  });

  test('a hash Oxy does not confirm leaves the row on the legacy storage', async () => {
    const row = await legacyRow('a.png', await png(300, 200, 1));
    oxy.corruptNextUpload = true;
    const report = await migrateLegacyStorage({ apply: true });
    expect(report.media.failed).toBe(1);
    const [after] = await db.select().from(media).where(eq(media._id, row._id));
    expect(after.oxyFileId).toBeNull();
    expect(after.url).toBe(row.url);
    expect(oxy.references.size).toBe(0);
    const [record] = await db.select().from(mediaStorageMigrations);
    expect(record.status).toBe('failed');
    expect(record.error).not.toContain('cdn.test');

    // Resumable: the next run carries it over.
    const retry = await migrateLegacyStorage({ apply: true });
    expect(retry.media.migrated).toBe(1);
    const [retried] = await db.select().from(mediaStorageMigrations);
    expect(retried).toMatchObject({ status: 'migrated', attempts: 2 });
  });

  test('a missing legacy object is reported, not invented', async () => {
    const row = await legacyRow('gone.png', await png());
    storage.objects.delete(row.key ?? '');
    const report = await migrateLegacyStorage({ apply: true });
    expect(report.items).toEqual([
      { mediaId: row._id, status: 'failed', error: 'missing: the legacy object does not exist' },
    ]);
  });
});

describe('reconciliation', () => {
  test('sends every row holding an Oxy file, once per interval across tasks', async () => {
    const { media: row } = await ingestUpload({
      buffer: await png(50, 50, 1),
      filename: 'a.png',
      declaredType: 'image/png',
      folder: 'images',
      uploadedBy: 'e',
    });
    await legacyRow('old.png', await png(50, 50, 2));
    // A reference lost on the way (a crash, an old bug).
    oxy.references.clear();

    const first = await reconcileMediaFiles();
    expect(first).toMatchObject({ status: 'done', inventory: 1, added: 1, removed: 0 });
    expect(oxy.references.has(`${row.oxyFileId}|media|${row._id}`)).toBe(true);
    expect(await reconcileMediaFiles()).toEqual({ status: 'skipped' });
    expect(oxy.reconciliations).toHaveLength(1);
  });

  test('a dry run reports and changes nothing; a busy Oxy is recorded, not failed', async () => {
    oxy.references.add('f-stale|media|gone');
    oxy.files.set('f-stale', {
      id: 'f-stale',
      sha256: 'x',
      mime: 'image/png',
      size: 1,
      bytes: Buffer.from([1]),
      status: 'active',
    });
    expect(await reconcileMediaFiles({ dryRun: true })).toMatchObject({
      status: 'done',
      removed: 1,
    });
    expect(oxy.references.has('f-stale|media|gone')).toBe(true);

    oxy.busyReconcile = true;
    expect((await reconcileMediaFiles({ force: true })).status).toBe('busy');
    const runs = await db.select().from(oxyFileReconciliations);
    expect(runs.map((run) => run.status).sort()).toEqual(['busy', 'done']);
  });
});
