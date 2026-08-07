import { defineConfig } from 'drizzle-kit'

/**
 * Migrations are generated from the schema and committed; nothing pushes a
 * schema straight at a database. `DATABASE_URL` decides which one the CLI
 * talks to, exactly as the server does.
 */
export default defineConfig({
  schema: './server/db/schema/index.ts',
  out: './server/db/migrations',
  dialect: 'postgresql',
  casing: 'snake_case',
  dbCredentials: { url: process.env.DATABASE_URL ?? '' },
  strict: true,
  verbose: true,
})
