import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { closeDatabase, db } from './postgres.js'

/**
 * Applies every pending migration, then exits. Run by `bun run db:migrate` and
 * by the container at boot, so a deploy can never serve a schema older than the
 * code that shipped with it.
 */
const migrationsFolder = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations')

await migrate(db, { migrationsFolder })
console.log('[db] migrations applied')
await closeDatabase()
