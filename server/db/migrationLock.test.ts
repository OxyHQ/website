import { afterAll, afterEach, describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import {
  MIGRATION_LOCK_KEY,
  MigrationLockTimeoutError,
  migrateUnderLock,
  type MigrationRun,
} from './migrationLock.js';

/* ──────────────────────────────────────────────
 * Two tasks booting at once, against real PostgreSQL.
 *
 * Each test gets a database of its own (the suite's shared one already holds
 * the real schema and is truncated between tests), created beside
 * TEST_DATABASE_URL — which `test/setup.ts` has already confined to a local,
 * disposable "*test*" database.
 * ──────────────────────────────────────────── */

const FIXTURES = path.join(import.meta.dir, '..', 'test', 'fixtures', 'migration-lock');
const REAL_MIGRATIONS = path.join(import.meta.dir, 'migrations');

const baseUrl = process.env.TEST_DATABASE_URL as string;
const admin = postgres(baseUrl, { max: 1, onnotice: () => {} });
const created: string[] = [];
const clients: postgres.Sql[] = [];

async function freshDatabase(): Promise<string> {
  const name = `website_test_migration_lock_${process.pid}_${created.length}`;
  await admin.unsafe(`drop database if exists "${name}" with (force)`);
  await admin.unsafe(`create database "${name}"`);
  created.push(name);
  const url = new URL(baseUrl);
  url.pathname = `/${name}`;
  return url.toString();
}

function connect(url: string): postgres.Sql {
  const client = postgres(url, { max: 1, onnotice: () => {} });
  clients.push(client);
  return client;
}

async function journal(url: string): Promise<{ hash: string; created_at: string }[]> {
  return connect(url)`select hash, created_at::text from drizzle.__drizzle_migrations order by id`;
}

async function lockHolders(url: string): Promise<number> {
  const [row] = await connect(url)<{ n: number }[]>`
    select count(*)::int as n from pg_locks
    where locktype = 'advisory'
      and database = (select oid from pg_database where datname = current_database())
      and classid::bigint = (${MIGRATION_LOCK_KEY.toString()}::bigint >> 32)
      and objid::bigint = (${MIGRATION_LOCK_KEY.toString()}::bigint & 4294967295)`;
  return row.n;
}

function disjoint(runs: MigrationRun[]): void {
  const [first, second] = [...runs].sort((a, b) => a.lockedAt - b.lockedAt);
  // The second holder was granted the lock only after the first finished migrating.
  expect(second.lockedAt).toBeGreaterThanOrEqual(first.migratedAt);
  expect(second.backendPid).not.toBe(first.backendPid);
}

afterEach(async () => {
  await Promise.all(clients.splice(0).map((client) => client.end({ timeout: 1 })));
  for (const name of created.splice(0))
    await admin.unsafe(`drop database if exists "${name}" with (force)`);
});

afterAll(() => admin.end({ timeout: 1 }));

describe('migrateUnderLock', () => {
  test('two concurrent boots run a pending data-only migration exactly once, one after the other', async () => {
    const url = await freshDatabase();
    await migrateUnderLock({
      connectionString: url,
      migrationsFolder: path.join(FIXTURES, 'applied'),
    });

    const logs: string[] = [];
    const boot = () =>
      migrateUnderLock({
        connectionString: url,
        migrationsFolder: path.join(FIXTURES, 'pending'),
        pollMs: 50,
        log: (line) => logs.push(line),
      });
    const runs = await Promise.all([boot(), boot()]);

    disjoint(runs);
    // One of them found the lock taken and said so, naming the holder.
    expect(runs.some((run) => run.waitedMs > 0)).toBe(true);
    expect(
      logs.some(
        (line) =>
          line.includes('waiting for the migration lock') &&
          line.includes('website-api migrations'),
      ),
    ).toBe(true);

    const [{ n }] = await connect(url)<
      { n: number }[]
    >`select count(*)::int as n from lock_test_runs`;
    expect(n).toBe(1);
    const rows = await journal(url);
    expect(rows.map((row) => row.created_at)).toEqual(['1700000000000', '1700000001000']);
    expect(await lockHolders(url)).toBe(0);
  });

  test('control: without the lock, the same two boots apply that migration twice', async () => {
    const url = await freshDatabase();
    await migrate(drizzle(connect(url)), { migrationsFolder: path.join(FIXTURES, 'applied') });

    const boot = () =>
      migrate(drizzle(connect(url)), { migrationsFolder: path.join(FIXTURES, 'pending') });
    await Promise.all([boot(), boot()]);

    const [{ n }] = await connect(url)<
      { n: number }[]
    >`select count(*)::int as n from lock_test_runs`;
    expect(n).toBe(2);
    expect((await journal(url)).length).toBe(3);
  });

  test('two concurrent boots on an empty database apply every real migration exactly once', async () => {
    const url = await freshDatabase();
    const boot = () =>
      migrateUnderLock({
        connectionString: url,
        migrationsFolder: REAL_MIGRATIONS,
        pollMs: 50,
        log: () => {},
      });
    const runs = await Promise.all([boot(), boot()]);

    disjoint(runs);
    const entries = (
      JSON.parse(readFileSync(path.join(REAL_MIGRATIONS, 'meta', '_journal.json'), 'utf8')) as {
        entries: { when: number }[];
      }
    ).entries;
    const rows = await journal(url);
    expect(rows.map((row) => row.created_at)).toEqual(entries.map((entry) => String(entry.when)));
    expect(new Set(rows.map((row) => row.hash)).size).toBe(entries.length);
  });

  test('waits while another session holds the lock, then migrates once it is released', async () => {
    const url = await freshDatabase();
    const holder = await connect(url).reserve();
    await holder`select pg_advisory_lock(${MIGRATION_LOCK_KEY.toString()}::bigint)`;

    const logs: string[] = [];
    let settled = false;
    const pending = migrateUnderLock({
      connectionString: url,
      migrationsFolder: path.join(FIXTURES, 'applied'),
      pollMs: 50,
      log: (line) => logs.push(line),
    }).finally(() => {
      settled = true;
    });
    await new Promise((resolve) => setTimeout(resolve, 750));

    expect(settled).toBe(false);
    const [{ exists }] = await connect(url)<
      { exists: boolean }[]
    >`select to_regclass('lock_test_runs') is not null as exists`;
    expect(exists).toBe(false);
    expect(logs.some((line) => line.includes('waiting for the migration lock'))).toBe(true);

    await holder`select pg_advisory_unlock(${MIGRATION_LOCK_KEY.toString()}::bigint)`;
    const run = await pending;
    expect(run.waitedMs).toBeGreaterThanOrEqual(700);
    expect((await journal(url)).length).toBe(1);
    holder.release();
  });

  test('gives up after maxWaitMs with the holder named, having migrated nothing', async () => {
    const url = await freshDatabase();
    const holder = await connect(url).reserve();
    await holder`select pg_advisory_lock(${MIGRATION_LOCK_KEY.toString()}::bigint)`;
    const [{ pid }] = await holder<{ pid: number }[]>`select pg_backend_pid() as pid`;

    const attempt = migrateUnderLock({
      connectionString: url,
      migrationsFolder: path.join(FIXTURES, 'applied'),
      maxWaitMs: 400,
      pollMs: 50,
      log: () => {},
    });
    const error = await attempt.catch((e: unknown) => e);
    expect(error).toBeInstanceOf(MigrationLockTimeoutError);
    expect(String((error as Error).message)).toContain(`pid ${pid}`);

    const [{ exists }] = await connect(url)<
      { exists: boolean }[]
    >`select to_regclass('lock_test_runs') is not null as exists`;
    expect(exists).toBe(false);
    holder.release();
  });

  test('releases the lock when a migration fails', async () => {
    const url = await freshDatabase();
    const failed = await migrateUnderLock({
      connectionString: url,
      migrationsFolder: path.join(FIXTURES, 'broken'),
      log: () => {},
    }).catch((e: unknown) => e);
    expect(failed).toBeInstanceOf(Error);
    expect(await lockHolders(url)).toBe(0);

    const run = await migrateUnderLock({
      connectionString: url,
      migrationsFolder: path.join(FIXTURES, 'applied'),
      maxWaitMs: 1000,
      log: () => {},
    });
    expect(run.waitedMs).toBeLessThan(500);
    expect((await journal(url)).length).toBe(1);
  });
});
