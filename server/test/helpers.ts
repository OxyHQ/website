import { sql } from 'drizzle-orm'
import { db } from '../db/postgres.js'
import { invalidateLocaleCache } from '../middleware/locale.js'
import type { ToolContext } from '../mcp.js'
import type { ToolResult } from '../mcp/results.js'

export interface TestStorage {
  objects: Map<string, { size: number; contentType: string }>
  failPuts: number
  failDeletes: Set<string>
  failAllDeletes: boolean
  reset(): void
}

export interface TestRemote {
  files: Map<string, Buffer>
  requested: string[]
  onDownload: null | ((source: string) => Promise<void>)
  reset(): void
}

/** The doubles installed by `setup.ts`. */
export const storage = (globalThis as Record<string, unknown>).__testStorage as TestStorage
export const remote = (globalThis as Record<string, unknown>).__testRemote as TestRemote

export const admin: ToolContext = { actorId: 'admin-account', requestId: 'test' }
export const reader: ToolContext = { actorId: 'reader-account', requestId: 'test' }

/** Empties every table the migrations created, keeping the migration journal. */
export async function resetDatabase(): Promise<void> {
  const rows = await db.execute<{ tablename: string }>(sql`select tablename from pg_tables where schemaname = 'public'`)
  const tables = [...rows].map((row) => `"${row.tablename}"`)
  if (tables.length > 0) await db.execute(sql.raw(`truncate ${tables.join(', ')} restart identity cascade`))
  storage.reset()
  remote.reset()
  // The public routes cache the locale list for a few seconds; a wiped database
  // must not be answered from the previous test's locales.
  invalidateLocaleCache()
}

export function data<T = Record<string, unknown>>(result: ToolResult): T {
  if (result.isError) throw new Error(`Expected success, got ${result.content[0]?.text}`)
  return JSON.parse(result.content[0].text) as T
}

export function errorCode(result: ToolResult): string | undefined {
  if (!result.isError) return undefined
  return (result.structuredContent as { error: { code: string } }).error.code
}

export async function countRows(table: string): Promise<number> {
  const rows = await db.execute<{ n: number }>(sql.raw(`select count(*)::int as n from "${table}"`))
  return Number([...rows][0].n)
}

/** A real, decodable PNG of the given size, distinct per `seed`. */
export async function png(width = 64, height = 64, seed = 0): Promise<Buffer> {
  const sharp = (await import('sharp')).default
  return sharp({ create: { width, height, channels: 3, background: { r: seed % 256, g: (seed * 7) % 256, b: 90 } } }).png().toBuffer()
}

/** A copy of `value` without the named keys. */
export function omit<T extends Record<string, unknown>, K extends string>(value: T, ...keys: K[]): Omit<T, K> {
  const copy: Record<string, unknown> = { ...value }
  for (const key of keys) delete copy[key]
  return copy as Omit<T, K>
}
