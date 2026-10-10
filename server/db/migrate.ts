import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrateUnderLock } from './migrationLock.js';
import { closeDatabase, databaseUrl } from './postgres.js';

/**
 * Applies every pending migration, then exits. Run by `bun run db:migrate`, under the
 * same lock the server takes at boot, so it cannot race a task that is starting.
 */
const migrationsFolder = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations');

await migrateUnderLock({ connectionString: databaseUrl, migrationsFolder });
console.log('[db] migrations applied');
await closeDatabase();
