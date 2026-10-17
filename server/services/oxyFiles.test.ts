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
import {
  legacyStorageCensus,
  migrateLegacyStorage,
  RATE_LIMIT_WAIT_MS,
  setRateLimitPauseForTests,
} from './oxyFilesMigration.js';
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
/** An SVG carrying active content, which Oxy's sanitizer removes (stage 4c). */
const ACTIVE_SVG = Buffer.from(
  '<?xml version="1.0"?>\n<!-- logo -->\n<svg xmlns="http://www.w3.org/2000/svg" width="24" height="12" onload="alert(1)"><script>alert(2)</script><rect width="24" height="12"/></svg>',
);
/** A real, decodable JPEG. */
async function sharpJpeg(): Promise<Buffer> {
  const sharp = (await import('sharp')).default;
  return sharp({
    create: { width: 48, height: 32, channels: 3, background: { r: 9, g: 80, b: 200 } },
  })
    .jpeg()
    .toBuffer();
}

const PDF = Buffer.from('%PDF-1.7\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n', 'latin1');

describe('an editor upload', () => {
  test('an image becomes a file of the application, with Oxy renditions and the editor as audit', async () => {
    const { media: row, reused } = await ingestUpload({
      buffer: await png(500, 400, 3),
      filename: 'Launch Photo.png',
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
      folder: 'hero',
      uploadedBy: 'editor-1',
    });
    expect(row.mimeType).toBe('video/webm');
    expect(row.oxyFileId).toBeTruthy();
    expect(row.thumbnails).toEqual({ sm: '', md: '', lg: '' });
  });

  test('an SVG becomes a file of the application, stored as Oxy’s sanitized document, with renditions', async () => {
    const { media: row, reused } = await ingestUpload({
      buffer: ACTIVE_SVG,
      filename: 'logo.bin',
      folder: 'products',
      uploadedBy: 'editor-1',
    });
    expect(reused).toBe(false);
    expect(row.oxyFileId).toBeTruthy();
    expect(row.key).toBeNull();
    expect(row.mimeType).toBe('image/svg+xml');
    expect(row.filename).toBe('logo.svg');
    const stored = oxy.files.get(row.oxyFileId ?? '');
    expect(stored?.mime).toBe('image/svg+xml');
    expect(stored?.bytes.toString()).not.toContain('script');
    expect(stored?.bytes.toString()).not.toContain('onload');
    // The row holds what Oxy stores: the sanitized document's hash and size.
    expect(row.sha256).toBe(stored?.sha256 ?? 'missing');
    expect(row.size).toBe(stored?.size ?? -1);
    expect(row.width).toBe(24);
    expect(row.height).toBe(12);
    expect(row.url).toBe(`https://cloud.test/${row.oxyFileId}`);
    expect(row.thumbnails.lg).toBe(`https://cloud.test/${row.oxyFileId}?variant=w1280`);
    expect(oxy.references.has(`${row.oxyFileId}|media|${row._id}`)).toBe(true);
    expect(oxy.largeUploads).toEqual([]);
    expect(storage.objects.size).toBe(0);
  });

  test('the same SVG again reuses its row, though Oxy stored different bytes than were sent', async () => {
    const input = { buffer: ACTIVE_SVG, filename: 'logo.svg', folder: 'products', uploadedBy: 'e' };
    const first = await ingestUpload(input);
    const second = await ingestUpload(input);
    expect(second.reused).toBe(true);
    expect(second.media._id).toBe(first.media._id);
    expect(await countRows('media')).toBe(1);
    expect(oxy.files.size).toBe(1);
  });

  test('an SVG Oxy cannot sanitize is refused, and no row is written', async () => {
    await expect(
      ingestUpload({
        buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><rect width="1"'),
        filename: 'broken.svg',
        folder: 'products',
        uploadedBy: 'editor-1',
      }),
    ).rejects.toThrow('not a well-formed UTF-8 SVG document');
    expect(await countRows('media')).toBe(0);
    expect(storage.objects.size).toBe(0);
    expect(oxy.references.size).toBe(0);
  });

  test('an Oxy API without stage 4c refuses SVG: it goes to the legacy storage as before', async () => {
    oxy.svgSupported = false;
    const { media: row } = await ingestUpload({
      buffer: Buffer.concat([Buffer.from('<?xml version="1.0"?>\n<!-- logo -->\n'), SVG]),
      filename: 'logo.bin',
      folder: 'products',
      uploadedBy: 'editor-1',
    });
    expect(row.oxyFileId).toBeNull();
    expect(row.mimeType).toBe('image/svg+xml');
    expect(row.key).toMatch(/^oxy-website\/products\/logo-[0-9a-f]{8}\.svg$/);
    expect(oxy.files.size).toBe(0);
    expect(storage.objects.get(row.key ?? '')?.contentType).toBe('image/svg+xml');
  });

  test('a PDF becomes a file of the application through the large upload, with no renditions', async () => {
    const { media: row } = await ingestUpload({
      buffer: PDF,
      filename: 'Press Kit.pdf',
      folder: 'resources',
      uploadedBy: 'editor-1',
    });
    expect(row.oxyFileId).toBeTruthy();
    expect(row.key).toBeNull();
    expect(row.mimeType).toBe('application/pdf');
    expect(row.filename).toBe('Press-Kit.pdf');
    expect(row.url).toBe(`https://cloud.test/${row.oxyFileId}`);
    expect(row.thumbnails).toEqual({ sm: '', md: '', lg: '' });
    expect(oxy.largeUploads).toEqual([{ mime: 'application/pdf', filename: 'Press-Kit.pdf' }]);
    expect(oxy.references.has(`${row.oxyFileId}|media|${row._id}`)).toBe(true);
    expect(storage.objects.size).toBe(0);
  });

  test('the type comes from the bytes, never the name or the browser', async () => {
    // A JPEG named `.bin` (how newsroom images were once recorded as
    // `application/octet-stream`) is an image, renamed to match.
    const jpeg = await sharpJpeg();
    const { media: image } = await ingestUpload({
      buffer: jpeg,
      filename: 'cover.bin',
      folder: 'newsroom',
      uploadedBy: 'editor-1',
    });
    expect(image.mimeType).toBe('image/jpeg');
    expect(image.filename).toBe('cover.jpg');
    // A PDF named `.png` is a PDF.
    const { media: pdf } = await ingestUpload({
      buffer: PDF,
      filename: 'chart.png',
      folder: 'resources',
      uploadedBy: 'editor-1',
    });
    expect(pdf.mimeType).toBe('application/pdf');
    expect(pdf.filename).toBe('chart.pdf');
    // Bytes that prove nothing are an octet stream that keeps its own extension.
    const { media: archive } = await ingestUpload({
      buffer: Buffer.from([0x50, 0x4b, 0x03, 0x04, 1, 2, 3, 4]),
      filename: 'brand assets.zip',
      folder: 'resources',
      uploadedBy: 'editor-1',
    });
    expect(archive.mimeType).toBe('application/octet-stream');
    expect(archive.filename).toBe('brand-assets.zip');
    expect(archive.oxyFileId).toBeTruthy();
  });

  test('a file Oxy refuses (an HTML page) is refused, and no row is written', async () => {
    await expect(
      ingestUpload({
        buffer: Buffer.from('<!doctype html><script>alert(1)</script>'),
        filename: 'page.html',
        folder: 'resources',
        uploadedBy: 'editor-1',
      }),
    ).rejects.toThrow('Oxy Files does not store this type of file');
    expect(await countRows('media')).toBe(0);
    expect(storage.objects.size).toBe(0);
  });

  test('a folder that is not one segment is refused before anything is stored', async () => {
    await expect(
      ingestUpload({
        buffer: await png(),
        filename: 'x.png',
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
    await db.insert(testimonials).values({ quote: 'logo', author: 'B', avatar: svg.url });
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
    expect(report.media).toEqual({ migrated: 3, would_migrate: 0, deferred: 0, failed: 0 });
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

    const [migratedSvg] = await db.select().from(media).where(eq(media._id, svg._id));
    expect(migratedSvg.oxyFileId).toBeTruthy();
    expect(migratedSvg.key).toBe(svg.key);
    expect(oxy.references.has(`${migratedSvg.oxyFileId}|media|${svg._id}`)).toBe(true);
    const [logo] = await db.select().from(testimonials).where(eq(testimonials.author, 'B'));
    expect(logo.avatar).toBe(migratedSvg.url);

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
    expect(again.media).toEqual({ migrated: 0, would_migrate: 0, deferred: 0, failed: 0 });
    expect(again.rewrite.rows).toEqual({});

    const census = await legacyStorageCensus();
    expect(census.media).toMatchObject({ oxy: 3, legacy: 0 });
    expect(census.legacyUrlRows).toEqual({});
    expect(census.migrations).toEqual({ migrated: 3 });
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

  test("waits out Oxy's per-minute budget and moves the same row, never failing it", async () => {
    const row = await legacyRow('a.png', await png(300, 200, 1));
    const waits: number[] = [];
    setRateLimitPauseForTests(async (ms) => {
      waits.push(ms);
    });
    oxy.rateLimitUploads = 2;

    const report = await migrateLegacyStorage({ apply: true });

    expect(report.media).toEqual({ migrated: 1, would_migrate: 0, deferred: 0, failed: 0 });
    expect(waits).toEqual([RATE_LIMIT_WAIT_MS, RATE_LIMIT_WAIT_MS]);
    const [after] = await db.select().from(media).where(eq(media._id, row._id));
    expect(after.oxyFileId).toBeTruthy();
  });

  test('each row takes the type its bytes prove: misrecorded images, documents and SVGs', async () => {
    const jpeg = await sharpJpeg();
    // How the newsroom's JPEGs were recorded: an octet stream named `.bin`.
    const image = await legacyRow('cover.bin', jpeg, 'application/octet-stream');
    const pdf = await legacyRow('kit.pdf', PDF, 'application/pdf');
    const svg = await legacyRow('logo.bin', ACTIVE_SVG, 'application/octet-stream');

    const preview = await migrateLegacyStorage({ apply: false });
    expect(preview.media).toEqual({ migrated: 0, would_migrate: 3, deferred: 0, failed: 0 });
    const [untouched] = await db.select().from(media).where(eq(media._id, svg._id));
    expect(untouched.mimeType).toBe('application/octet-stream'); // a preview writes nothing

    const report = await migrateLegacyStorage({ apply: true });
    expect(report.media).toEqual({ migrated: 3, would_migrate: 0, deferred: 0, failed: 0 });

    const [migratedImage] = await db.select().from(media).where(eq(media._id, image._id));
    expect(migratedImage.mimeType).toBe('image/jpeg');
    expect(migratedImage.filename).toBe('cover.jpg');
    expect(migratedImage.thumbnails.lg).toBe(
      `https://cloud.test/${migratedImage.oxyFileId}?variant=w1280`,
    );
    expect(oxy.files.get(migratedImage.oxyFileId ?? '')?.mime).toBe('image/jpeg');

    const [migratedPdf] = await db.select().from(media).where(eq(media._id, pdf._id));
    expect(migratedPdf.mimeType).toBe('application/pdf');
    expect(migratedPdf.thumbnails).toEqual({ sm: '', md: '', lg: '' });
    expect(oxy.largeUploads).toEqual([{ mime: 'application/pdf', filename: 'kit.pdf' }]);

    // The SVG is stored as Oxy's sanitized document: its hash is not the
    // legacy object's, and the row takes the stored document's hash and size.
    const [migratedSvg] = await db.select().from(media).where(eq(media._id, svg._id));
    const storedSvg = oxy.files.get(migratedSvg.oxyFileId ?? '');
    expect(migratedSvg.mimeType).toBe('image/svg+xml');
    expect(migratedSvg.filename).toBe('logo.svg');
    expect(storedSvg?.bytes.toString()).not.toContain('script');
    expect(migratedSvg.sha256).toBe(storedSvg?.sha256 ?? 'missing');
    expect(migratedSvg.size).toBe(storedSvg?.size ?? -1);
    expect(migratedSvg.thumbnails.md).toBe(
      `https://cloud.test/${migratedSvg.oxyFileId}?variant=w640`,
    );
    const [svgRecord] = await db
      .select()
      .from(mediaStorageMigrations)
      .where(eq(mediaStorageMigrations.mediaId, svg._id));
    expect(svgRecord.status).toBe('migrated');
    expect(svgRecord.oxySha256).toBe(storedSvg?.sha256 ?? 'missing');
    expect(svgRecord.legacySha256).not.toBe(svgRecord.oxySha256);
    const census = await legacyStorageCensus();
    expect(census.media).toMatchObject({ oxy: 3, legacy: 0 });
  });

  test('against an Oxy API without stage 4c an SVG is deferred, and the next run carries it over', async () => {
    const svg = await legacyRow('logo.bin', SVG, 'application/octet-stream');
    oxy.svgSupported = false;
    const report = await migrateLegacyStorage({ apply: true });
    expect(report.media).toEqual({ migrated: 0, would_migrate: 0, deferred: 1, failed: 0 });
    expect(report.items[0]?.error).toContain('svg_not_accepted');
    const [waiting] = await db.select().from(media).where(eq(media._id, svg._id));
    expect(waiting.oxyFileId).toBeNull();
    expect(waiting.url).toBe(svg.url);
    expect(waiting.mimeType).toBe('image/svg+xml'); // typed by its bytes meanwhile
    expect(waiting.filename).toBe('logo.svg');
    expect(oxy.files.size).toBe(0);
    expect((await legacyStorageCensus()).media).toMatchObject({ oxy: 0, legacy: 1 });

    oxy.svgSupported = true;
    const retry = await migrateLegacyStorage({ apply: true });
    expect(retry.media).toEqual({ migrated: 1, would_migrate: 0, deferred: 0, failed: 0 });
    const [record] = await db.select().from(mediaStorageMigrations);
    expect(record).toMatchObject({ status: 'migrated', attempts: 2, error: null });
    expect((await legacyStorageCensus()).media).toMatchObject({ oxy: 1, legacy: 0 });
  });

  test('an SVG Oxy serves differently than it reported is not switched', async () => {
    const svg = await legacyRow('logo.svg', SVG, 'image/svg+xml');
    oxy.serveDifferentBytes = true;
    const report = await migrateLegacyStorage({ apply: true });
    expect(report.media.failed).toBe(1);
    const [after] = await db.select().from(media).where(eq(media._id, svg._id));
    expect(after.oxyFileId).toBeNull();
    expect(oxy.references.size).toBe(0);
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
