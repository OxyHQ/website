import { mock } from 'bun:test';

/* ──────────────────────────────────────────────
 * Preload for the server integration suite (`bun run test:server`).
 *
 * Real PostgreSQL, because the defects this suite guards against — an insert
 * that returned nothing, a unique index racing a pre-check, a transaction that
 * did not hold — are exactly what a mocked database agrees with. Object storage
 * and remote downloads are replaced by in-memory doubles the tests control.
 *
 * The database is wiped between tests, so the URL must name a disposable
 * database on a local or CI host. Anything else is refused before a single
 * statement runs.
 * ──────────────────────────────────────────── */

const url = process.env.TEST_DATABASE_URL;
if (!url) {
  throw new Error(
    'TEST_DATABASE_URL is not set. Point it at a disposable PostgreSQL database, e.g. postgres://postgres@127.0.0.1:5432/website_test',
  );
}
const parsed = new URL(url);
if (
  !['127.0.0.1', 'localhost', '::1', 'postgres'].includes(parsed.hostname) ||
  !/test/.test(parsed.pathname)
) {
  throw new Error(
    `Refusing to run the destructive test suite against ${parsed.hostname}${parsed.pathname}: use a local database whose name contains "test"`,
  );
}
process.env.DATABASE_URL = url;
process.env.NODE_ENV = 'test';

// The app under test answers public reads by calling its own REST routes on
// `config.port`, and validates tokens against a fake Oxy — both ports are fixed
// here, before `config` is first imported.
const net = await import('node:net');
async function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const address = probe.address();
      probe.close(() => resolve(typeof address === 'object' && address ? address.port : 0));
    });
  });
}
process.env.PORT = String(await freePort());
process.env.TEST_FAKE_OXY_PORT = String(await freePort());
process.env.OXY_API_BASE = `http://localhost:${process.env.TEST_FAKE_OXY_PORT}`;
process.env.MCP_RESOURCE_URL = `http://localhost:${process.env.PORT}/mcp`;
process.env.CORS_ORIGIN = 'https://site.test';
process.env.CDN_BASE_URL = 'https://cdn.test';
process.env.OXY_CLOUD_URL = 'https://cloud.test';
process.env.OXY_FILES_WEBHOOK_SECRET = 'whsec_test';
process.env.OXY_ADMIN_USER_IDS = 'admin-account';

// ── Object storage double ──────────────────────────────────────────────────

export const storage = {
  objects: new Map<string, { size: number; contentType: string; buffer: Buffer }>(),
  failPuts: 0,
  failDeletes: new Set<string>(),
  failAllDeletes: false,
  reset() {
    this.objects.clear();
    this.failPuts = 0;
    this.failDeletes.clear();
    this.failAllDeletes = false;
  },
};
(globalThis as Record<string, unknown>).__testStorage = storage;

const real = await import('../services/s3.js');
mock.module('../services/s3.js', () => ({
  ...real,
  uploadToSpaces: async (buffer: Buffer, name: string, contentType: string, folder?: string) => {
    if (storage.failPuts > 0) {
      storage.failPuts -= 1;
      throw new Error('simulated storage outage');
    }
    const key = real.buildObjectKey(buffer, name, contentType, folder);
    storage.objects.set(key, { size: buffer.length, contentType, buffer });
    return real.publicUrlForKey(key);
  },
  readFromSpaces: async (key: string) => {
    const object = storage.objects.get(key);
    return object ? { buffer: object.buffer, contentType: object.contentType } : null;
  },
  deleteFromSpaces: async (key: string) => {
    if (storage.failAllDeletes || storage.failDeletes.has(key))
      throw new Error('simulated storage delete failure');
    storage.objects.delete(key);
  },
}));

// ── Oxy Files double ───────────────────────────────────────────────────────

const { createHash } = await import('node:crypto');

interface OxyFile {
  id: string;
  sha256: string;
  mime: string;
  size: number;
  bytes: Buffer;
  status: 'active' | 'trash' | 'blocked' | 'deleted';
}

function oxyError(status: number, code: string): Error {
  return Object.assign(new Error(code), { status, code });
}

/** The image types the double accepts on a declared type, like Oxy (which trusts the declaration). */
function declaredType(bytes: Buffer): string {
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return 'image/png';
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return 'image/jpeg';
  if (bytes.subarray(0, 3).toString('latin1') === 'GIF') return 'image/gif';
  return 'text/html';
}

/**
 * An in-memory Oxy Files: application files deduplicated by SHA-256, imports
 * remembered by URL, and the application's references. `oxy.fail*` makes the
 * next calls of a kind fail as an outage would.
 */
export const oxy = {
  files: new Map<string, OxyFile>(),
  imports: new Map<string, string>(),
  references: new Set<string>(),
  failUploads: 0,
  failReferenceAdds: 0,
  failReferenceRemovals: false,
  failDeletes: false,
  /** Store different bytes than were sent (an integrity failure). */
  corruptNextUpload: false,
  reconciliations: [] as { entityType: string; items: number; dryRun: boolean }[],
  busyReconcile: false,
  sequence: 0,
  reset() {
    this.files.clear();
    this.imports.clear();
    this.references.clear();
    this.failUploads = 0;
    this.failReferenceAdds = 0;
    this.failReferenceRemovals = false;
    this.failDeletes = false;
    this.corruptNextUpload = false;
    this.reconciliations = [];
    this.busyReconcile = false;
  },
  store(bytes: Buffer, mime: string): { file: OxyFile; deduplicated: boolean } {
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    for (const file of this.files.values())
      if (file.sha256 === sha256 && file.status !== 'deleted') {
        if (file.status === 'trash') file.status = 'active';
        return { file, deduplicated: true };
      }
    this.sequence += 1;
    const id = `f${String(this.sequence).padStart(23, '0')}`;
    const file: OxyFile = { id, sha256, mime, size: bytes.length, bytes, status: 'active' };
    this.files.set(id, file);
    return { file, deduplicated: false };
  },
  /** The bytes a public URL of this double serves, if it is one. */
  bytesAt(url: string): Buffer | undefined {
    const match = /^https:\/\/cloud\.test\/([^/?]+)/.exec(url);
    const file = match ? this.files.get(match[1]) : undefined;
    return file && file.status === 'active' ? file.bytes : undefined;
  },
  referencesOf(fileId: string): string[] {
    return [...this.references].filter((reference) => reference.startsWith(`${fileId}|`));
  },
};
(globalThis as Record<string, unknown>).__testOxy = oxy;

function view(file: OxyFile) {
  return {
    id: file.id,
    sha256: file.sha256,
    size: file.size,
    mime: file.mime,
    ext: file.mime.split('/')[1] ?? 'bin',
    ownerApplicationId: 'website-app',
    status: file.status === 'deleted' ? 'trash' : file.status,
    visibility: 'public' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

mock.module('../services/oxyFilesApi.js', () => ({
  oxyFilesApi: () => ({
    publicUrl: (fileId: string, variant?: string) =>
      `https://cloud.test/${fileId}${variant ? `?variant=${variant}` : ''}`,
    uploadAppFile: async (bytes: Uint8Array, mime: string) => {
      if (oxy.failUploads > 0) {
        oxy.failUploads -= 1;
        throw oxyError(503, 'SERVICE_UNAVAILABLE');
      }
      let stored = Buffer.from(bytes);
      if (oxy.corruptNextUpload) {
        oxy.corruptNextUpload = false;
        stored = Buffer.concat([stored, Buffer.from([0])]);
      }
      const { file, deduplicated } = oxy.store(stored, mime);
      return { file: view(file), deduplicated };
    },
    importAppFile: async (sourceUrl: string) => {
      if (oxy.failUploads > 0) {
        oxy.failUploads -= 1;
        throw oxyError(503, 'SERVICE_UNAVAILABLE');
      }
      remote.requested.push(sourceUrl);
      await remote.onDownload?.(sourceUrl);
      const known = oxy.imports.get(sourceUrl);
      const existing = known ? oxy.files.get(known) : undefined;
      if (existing && existing.status === 'active')
        return {
          file: view(existing),
          outcome: 'existing' as const,
          deduplicated: true,
          source: { host: new URL(sourceUrl).host, fetchedAt: new Date().toISOString() },
        };
      const bytes = remote.files.get(sourceUrl);
      if (!bytes) throw oxyError(502, 'SOURCE_FETCH_FAILED');
      const mime = declaredType(bytes);
      if (!mime.startsWith('image/')) throw oxyError(415, 'UNSUPPORTED_MEDIA_TYPE');
      const { file, deduplicated } = oxy.store(bytes, mime);
      oxy.imports.set(sourceUrl, file.id);
      return {
        file: view(file),
        outcome: 'downloaded' as const,
        deduplicated,
        source: { host: new URL(sourceUrl).host, fetchedAt: new Date().toISOString() },
      };
    },
    deleteAppFile: async (fileId: string) => {
      if (oxy.failDeletes) throw oxyError(503, 'SERVICE_UNAVAILABLE');
      const file = oxy.files.get(fileId);
      if (!file || file.status === 'deleted') throw oxyError(404, 'NOT_FOUND');
      if (oxy.referencesOf(fileId).length > 0) throw oxyError(409, 'FILE_IN_USE');
      file.status = 'deleted';
    },
    references: {
      add: async (items: { fileId: string; entityType: string; entityId: string }[]) => {
        if (oxy.failReferenceAdds > 0) {
          oxy.failReferenceAdds -= 1;
          throw oxyError(503, 'SERVICE_UNAVAILABLE');
        }
        return items.map((item) => {
          const file = oxy.files.get(item.fileId);
          if (!file || file.status === 'deleted' || file.status === 'blocked')
            return { ...item, result: 'not_found' as const };
          const key = `${item.fileId}|${item.entityType}|${item.entityId}`;
          if (oxy.references.has(key)) return { ...item, result: 'exists' as const };
          oxy.references.add(key);
          if (file.status === 'trash') file.status = 'active';
          return { ...item, result: 'created' as const };
        });
      },
      remove: async (items: { fileId: string; entityType: string; entityId: string }[]) => {
        if (oxy.failReferenceRemovals) throw oxyError(503, 'SERVICE_UNAVAILABLE');
        return items.map((item) => {
          const key = `${item.fileId}|${item.entityType}|${item.entityId}`;
          return {
            ...item,
            result: oxy.references.delete(key) ? ('removed' as const) : ('not_found' as const),
          };
        });
      },
      reconcile: async (
        entityType: string,
        items: AsyncIterable<{ fileId: string; entityId: string }>,
        options: { dryRun?: boolean } = {},
      ) => {
        if (oxy.busyReconcile) throw oxyError(409, 'RECONCILIATION_IN_PROGRESS');
        const wanted = new Set<string>();
        let refused = 0;
        let sent = 0;
        for await (const item of items) {
          sent += 1;
          const file = oxy.files.get(item.fileId);
          if (!file || file.status === 'deleted') refused += 1;
          else wanted.add(`${item.fileId}|${entityType}|${item.entityId}`);
        }
        const held = [...oxy.references].filter((key) => key.split('|')[1] === entityType);
        const added = [...wanted].filter((key) => !oxy.references.has(key));
        const removed = held.filter((key) => !wanted.has(key));
        if (!options.dryRun) {
          for (const key of added) oxy.references.add(key);
          for (const key of removed) oxy.references.delete(key);
        }
        oxy.reconciliations.push({ entityType, items: sent, dryRun: options.dryRun === true });
        return {
          sessionId: 'session',
          entityType,
          dryRun: options.dryRun === true,
          added: added.length,
          removed: removed.length,
          unchanged: held.length - removed.length,
          refused,
        };
      },
    },
  }),
}));

// ── Remote download double ─────────────────────────────────────────────────

export const remote = {
  files: new Map<string, Buffer>(),
  requested: [] as string[],
  /** Runs while a download is "in flight", after the tool validated its target. */
  onDownload: null as null | ((source: string) => Promise<void>),
  reset() {
    this.files.clear();
    this.requested = [];
    this.onDownload = null;
  },
};
(globalThis as Record<string, unknown>).__testRemote = remote;

const realDownload = await import('../services/remoteDownload.js');
const { UpstreamError } = await import('@oxy.so/core/server');
mock.module('../services/remoteDownload.js', () => ({
  ...realDownload,
  downloadRemote: async (source: string) => {
    // Reading back a file from the Oxy double is not a download from a source.
    const fromOxy = oxy.bytesAt(source);
    if (fromOxy)
      return { buffer: fromOxy, declaredContentType: 'application/octet-stream', finalUrl: source };
    remote.requested.push(source);
    await remote.onDownload?.(source);
    const buffer = remote.files.get(source);
    if (!buffer) throw new UpstreamError('Upstream returned 404');
    return { buffer, declaredContentType: 'application/octet-stream', finalUrl: source };
  },
}));

// ── Schema ─────────────────────────────────────────────────────────────────

const { migrateUnderLock } = await import('../db/migrationLock.js');
const path = await import('node:path');
await migrateUnderLock({
  connectionString: url,
  migrationsFolder: path.join(import.meta.dir, '..', 'db', 'migrations'),
});
