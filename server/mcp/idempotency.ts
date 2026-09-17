import { createHash } from 'node:crypto'
import { and, eq, lt, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db, rootDb, runInUnitOfWork } from '../db/postgres.js'
import { mcpIdempotencyKeys } from '../db/schema/index.js'
import { canonicalJson } from '../services/mcpCatalogRegistration.js'
import { classifyError, errorOf, type ToolResult } from './results.js'

/* ──────────────────────────────────────────────
 * Idempotency keys for MCP writes.
 *
 * The catalog declares every write as `idempotency: 'supported'`, which in
 * Oxy's contract means "accepts an idempotency key". This is what makes that
 * declaration true.
 *
 * A call carrying `idempotencyKey` runs as ONE database transaction:
 *
 *   1. take a transaction-scoped advisory lock on (account, tool, key), so a
 *      concurrent duplicate — on this task or another — waits here;
 *   2. if a record exists, replay its stored result (or refuse it as an
 *      `idempotency_conflict` when the input differs);
 *   3. otherwise run the tool, and store its result in the same transaction.
 *
 * The record therefore exists exactly when the write committed. A task that
 * dies mid-call rolls back both, and the retry runs as if for the first time.
 * Scope is the ACTING account: the same key from another account is another
 * request, and authorization has already been checked again for this call.
 *
 * Side effects outside Postgres (uploaded objects) are not in the transaction;
 * the media pipeline compensates those itself.
 * ──────────────────────────────────────────── */

export const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000

export const idempotencyKeyInput = z
  .string()
  .min(8)
  .max(128)
  .regex(/^[A-Za-z0-9._:-]+$/, 'Letters, digits and . _ : - only')
  .describe('Optional. A unique value (e.g. a UUID) for this intended change. Retrying with the same key and the same input returns the original result without writing again; the same key with different input is refused. Kept for 24 hours.')

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

/** Results that must not be replayed: the retry deserves a fresh attempt. */
function isTransient(result: ToolResult): boolean {
  const error = (result.structuredContent as { error?: { retryable?: boolean } } | undefined)?.error
  return Boolean(result.isError && error?.retryable)
}

class RollbackWithResult extends Error {
  constructor(readonly result: ToolResult) {
    super('rollback')
  }
}

export async function withIdempotency(
  scope: { accountId: string; tool: string; key: string; input: Record<string, unknown> },
  run: () => Promise<ToolResult>,
): Promise<ToolResult> {
  const keyHash = sha256(scope.key)
  const requestHash = sha256(canonicalJson(scope.input))
  const lockKey = `${scope.accountId}|${scope.tool}|${keyHash}`

  try {
    return await runInUnitOfWork(async () => {
      await db.execute(sql`select pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))`)

      const [existing] = await db
        .select()
        .from(mcpIdempotencyKeys)
        .where(and(
          eq(mcpIdempotencyKeys.accountId, scope.accountId),
          eq(mcpIdempotencyKeys.tool, scope.tool),
          eq(mcpIdempotencyKeys.keyHash, keyHash),
        ))
        .limit(1)
      if (existing && existing.expiresAt > new Date()) {
        if (existing.requestHash !== requestHash) {
          return errorOf('idempotency_conflict', 'This idempotency key was already used with different input')
        }
        return existing.result as unknown as ToolResult
      }

      const result = await run()
      // A failure rolls back whatever the tool wrote before failing; a
      // deterministic one is still recorded below so a retry gets the same answer.
      if (result.isError) throw new RollbackWithResult(result)

      await store(db, scope, keyHash, requestHash, result, Boolean(existing))
      return result
    })
  } catch (error) {
    if (!(error instanceof RollbackWithResult)) throw error
    const { result } = error
    if (!isTransient(result)) {
      await store(rootDb, scope, keyHash, requestHash, result, false).catch((storeError) => {
        console.error('[mcp] could not record an idempotent failure:', classifyError(storeError).error)
      })
    }
    return result
  }
}

async function store(
  executor: Pick<typeof rootDb, 'insert'>,
  scope: { accountId: string; tool: string },
  keyHash: string,
  requestHash: string,
  result: ToolResult,
  replaceExpired: boolean,
): Promise<void> {
  const values = {
    accountId: scope.accountId,
    tool: scope.tool,
    keyHash,
    requestHash,
    result: result as unknown as Record<string, unknown>,
    expiresAt: new Date(Date.now() + IDEMPOTENCY_TTL_MS),
  }
  const insert = executor.insert(mcpIdempotencyKeys).values(values)
  await (replaceExpired
    ? insert.onConflictDoUpdate({
      target: [mcpIdempotencyKeys.accountId, mcpIdempotencyKeys.tool, mcpIdempotencyKeys.keyHash],
      set: { requestHash, result: values.result, expiresAt: values.expiresAt, updatedAt: new Date() },
    })
    : insert.onConflictDoNothing())
}

export async function purgeExpiredIdempotencyKeys(): Promise<number> {
  const removed = await rootDb.delete(mcpIdempotencyKeys).where(lt(mcpIdempotencyKeys.expiresAt, new Date())).returning({ id: mcpIdempotencyKeys._id })
  return removed.length
}

let purge: ReturnType<typeof setInterval> | null = null

/**
 * Started once after bootstrap, like the other intervals in `server/index.ts`.
 * Also drops rate-limit windows older than ten minutes.
 */
export function startIdempotencyPurge(intervalMs = 60 * 60 * 1000): void {
  if (purge) return
  const run = () => {
    purgeExpiredIdempotencyKeys().catch((error: unknown) => console.error('[mcp] idempotency purge failed:', error))
    import('./rateLimit.js')
      .then(({ purgeOldRateLimitWindows }) => purgeOldRateLimitWindows())
      .catch((error: unknown) => console.error('[mcp] rate limit purge failed:', error))
  }
  run()
  purge = setInterval(run, intervalMs)
  purge.unref()
}
