import { lt, sql } from 'drizzle-orm'
import { rootDb } from '../db/postgres.js'
import { mcpRateLimits } from '../db/schema/index.js'
import { config } from '../config.js'
import { ToolError } from './results.js'

/* ──────────────────────────────────────────────
 * Per-account usage limits for the MCP endpoint.
 *
 * A fixed one-minute window per account, counted with one upsert in Postgres,
 * so every task sees the same count. Each call spends a cost by what it does;
 * a call that would go over is refused with `rate_limited` and the seconds
 * until the window resets. The counter is written on the pool, outside any
 * unit of work, so a tool that fails still counts.
 *
 * If the counter itself cannot be written the call proceeds: the database is
 * what every tool needs anyway, and refusing all traffic because a counter
 * failed would turn a metering problem into an outage.
 * ──────────────────────────────────────────── */

export const TOOL_COST = { read: 1, write: 5, heavy: 25 } as const

const HEAVY_TOOLS = new Set(['upload_image', 'upload_and_set_post_cover', 'upload_and_set_team_avatar', 'bulk_upload_post_covers', 'sync_repo', 'sync_all_repos', 'debug_upload_test'])

export function costOf(tool: string, writes: boolean): number {
  if (HEAVY_TOOLS.has(tool)) return TOOL_COST.heavy
  return writes ? TOOL_COST.write : TOOL_COST.read
}

export async function spend(accountId: string, cost: number, limit = config.mcp.rateLimitPerMinute, now = new Date()): Promise<void> {
  const windowStart = new Date(Math.floor(now.getTime() / 60_000) * 60_000)
  let spent: number
  try {
    const [row] = await rootDb
      .insert(mcpRateLimits)
      .values({ accountId, windowStart, cost })
      .onConflictDoUpdate({
        target: [mcpRateLimits.accountId, mcpRateLimits.windowStart],
        set: { cost: sql`${mcpRateLimits.cost} + ${cost}` },
      })
      .returning({ cost: mcpRateLimits.cost })
    spent = row.cost
  } catch (error) {
    console.error('[mcp] rate limit counter unavailable; allowing the call:', error instanceof Error ? error.message : error)
    return
  }
  if (spent > limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((windowStart.getTime() + 60_000 - now.getTime()) / 1000))
    throw new ToolError('rate_limited', `This account has used its MCP allowance for this minute; retry in ${retryAfterSeconds}s`, {
      retryAfterSeconds,
      limitPerMinute: limit,
    })
  }
}

export async function purgeOldRateLimitWindows(now = new Date()): Promise<number> {
  const removed = await rootDb.delete(mcpRateLimits).where(lt(mcpRateLimits.windowStart, new Date(now.getTime() - 10 * 60_000))).returning({ accountId: mcpRateLimits.accountId })
  return removed.length
}
