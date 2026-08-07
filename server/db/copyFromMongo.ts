import { MongoClient, ObjectId } from 'mongodb'
import { sql as raw } from 'drizzle-orm'
import { closeDatabase, db } from './postgres.js'
import * as schema from './schema/index.js'

/* ──────────────────────────────────────────────
 * Copies the Mongo database into Postgres, collection by collection.
 *
 * Idempotent and re-runnable: every row is written by `_id`, so a second pass
 * over an unchanged Mongo produces an unchanged Postgres, and a pass after
 * more editing in /admin updates exactly what moved. That matters because the
 * real cutover is two runs — one days before to prove it works, one during the
 * window to catch what changed since.
 *
 *   MONGODB_URI=… DATABASE_URL=… bun run db:copy
 *
 * It never deletes: a row removed in Mongo stays in Postgres until someone
 * removes it deliberately. Reconciling deletions during a copy is how a bad
 * connection string turns into an empty site.
 * ──────────────────────────────────────────── */

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is not set. Point it at the database to copy FROM.')
}

/** Collections in dependency order: media and categories are referenced by the rest. */
const COLLECTIONS: Array<{ collection: string; table: keyof typeof schema }> = [
  { collection: 'media', table: 'media' },
  { collection: 'categories', table: 'categories' },
  { collection: 'products', table: 'products' },
  { collection: 'pages', table: 'pages' },
  { collection: 'newsroomposts', table: 'newsroomPosts' },
  { collection: 'jobs', table: 'jobs' },
  { collection: 'courses', table: 'courses' },
  { collection: 'helparticles', table: 'helpArticles' },
  { collection: 'resources', table: 'resources' },
  { collection: 'changelogentries', table: 'changelogEntries' },
  { collection: 'teammembers', table: 'teamMembers' },
  { collection: 'testimonials', table: 'testimonials' },
  { collection: 'pricingplans', table: 'pricingPlans' },
  { collection: 'seos', table: 'seoEntries' },
  { collection: 'translations', table: 'translations' },
  { collection: 'locales', table: 'locales' },
  { collection: 'sitesettings', table: 'siteSettings' },
  { collection: 'navigations', table: 'navigationDropdowns' },
  { collection: 'footers', table: 'footers' },
  { collection: 'herocontents', table: 'heroContents' },
  { collection: 'trackedrepos', table: 'trackedRepos' },
  { collection: 'comments', table: 'comments' },
  { collection: 'likes', table: 'likes' },
  { collection: 'votes', table: 'votes' },
  { collection: 'featureproposals', table: 'featureProposals' },
  { collection: 'userbadges', table: 'userBadges' },
  { collection: 'userprofileextras', table: 'userProfileExtras' },
  { collection: 'referrals', table: 'referrals' },
  { collection: 'mcptokens', table: 'mcpTokens' },
]

/** Mongo hands back ObjectIds and Dates; Postgres wants strings and Dates. */
function normalise(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (value instanceof ObjectId) return value.toHexString()
  if (value instanceof Date) return value
  if (Array.isArray(value)) return value.map(normalise)
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      if (key === '__v') continue
      out[key] = normalise(item)
    }
    return out
  }
  return value
}

/**
 * Keeps only the columns the table actually declares. A Mongo document that
 * grew a field the schema does not know about would otherwise fail the insert
 * and take the whole collection with it.
 */
function projectOntoTable(doc: Record<string, unknown>, columns: Set<string>): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(doc)) {
    if (columns.has(key)) row[key] = value
  }
  return row
}

async function copyCollection(collectionName: string, tableKey: keyof typeof schema): Promise<{ read: number; written: number }> {
  const table = schema[tableKey] as never
  const columns = new Set(Object.keys(table as unknown as Record<string, unknown>))
  const docs = await mongo.db().collection(collectionName).find({}).toArray()

  let written = 0
  for (const doc of docs) {
    const normalised = normalise(doc) as Record<string, unknown>
    const row = projectOntoTable(normalised, columns)
    if (!row._id) continue
    // Everything but the key is refreshed, so a re-run picks up edits made in
    // /admin since the previous pass.
    const updates = Object.fromEntries(Object.entries(row).filter(([key]) => key !== '_id'))
    await db
      .insert(table)
      .values(row as never)
      .onConflictDoUpdate({ target: (table as Record<string, never>)._id, set: updates as never })
    written += 1
  }
  return { read: docs.length, written }
}

const mongo = new MongoClient(MONGODB_URI)
await mongo.connect()
console.log(`[copy] connected to ${new URL(MONGODB_URI).host}`)

const summary: Array<{ collection: string; read: number; written: number; error?: string }> = []

for (const { collection, table } of COLLECTIONS) {
  try {
    const { read, written } = await copyCollection(collection, table)
    summary.push({ collection, read, written })
    console.log(`[copy] ${collection.padEnd(20)} ${String(read).padStart(5)} read  ${String(written).padStart(5)} written`)
  } catch (err) {
    summary.push({ collection, read: 0, written: 0, error: (err as Error).message })
    console.error(`[copy] ${collection.padEnd(20)} FAILED: ${(err as Error).message}`)
  }
}

// Row counts read back from Postgres, not from what the loop believes it did:
// the point of the check is to catch a write that silently did nothing.
console.log('\n[copy] verifying against Postgres')
for (const { collection, table } of COLLECTIONS) {
  const tableName = (schema[table] as unknown as { _: { name: string } })._.name
  const [{ count }] = await db.execute<{ count: string }>(raw`select count(*)::text as count from ${raw.identifier(tableName)}`)
  const expected = summary.find((entry) => entry.collection === collection)
  const mark = expected && Number(count) >= expected.written ? ' ' : '!'
  console.log(`${mark} ${tableName.padEnd(22)} ${count}`)
}

const failed = summary.filter((entry) => entry.error)
await mongo.close()
await closeDatabase()

if (failed.length > 0) {
  console.error(`\n[copy] ${failed.length} collection(s) failed`)
  process.exit(1)
}
console.log('\n[copy] done')
