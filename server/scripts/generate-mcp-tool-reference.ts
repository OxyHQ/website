/**
 * Rewrites the tool reference in src/content/mcp/tools.mdx from the MCP
 * catalog. The server modules open a Postgres pool lazily, so a placeholder URL
 * is enough: nothing here queries the database.
 */
process.env.DATABASE_URL ??= 'postgres://reference@127.0.0.1:1/unused'

const { readFile, writeFile } = await import('node:fs/promises')
const { withToolReference } = await import('../mcp/reference.js')
const { closeDatabase } = await import('../db/postgres.js')

const path = new URL('../../src/content/mcp/tools.mdx', import.meta.url)
const before = await readFile(path, 'utf8')
const after = withToolReference(before)
if (after !== before) await writeFile(path, after)
console.log(after === before ? 'tools.mdx is up to date' : 'tools.mdx tool reference regenerated')
await closeDatabase()
