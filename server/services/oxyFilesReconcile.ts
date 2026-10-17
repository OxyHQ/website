import { and, asc, eq, gt, isNotNull, or, sql } from 'drizzle-orm';
import type { ServiceReferenceInventoryItem } from '@oxy.so/core';
import { config } from '../config.js';
import { db } from '../db/postgres.js';
import { media, oxyFileReconciliations } from '../db/schema/index.js';
import { MEDIA_ENTITY_TYPE, reconcileMediaReferences } from './oxyFiles.js';
import { legacyStorageCensus } from './oxyFilesMigration.js';

/* ──────────────────────────────────────────────
 * The safety net under the reference writes (ADR 0043 D6).
 *
 * Every media row registers its reference before it is written and withdraws
 * it through a durable queue when it is deleted, but a crash, an old bug or an
 * operator's hand can still leave Oxy's view and the site's apart. Once a day
 * the full inventory of `media` rows holding an Oxy file is sent to Oxy, which
 * adds the references it is missing and removes the ones no row holds. An
 * application file that reads as unused is trashed by Oxy after 24 hours, so
 * this must have run — and reported `added: 0` — before Oxy's lifecycle sweep
 * is switched to enforce (docs/OXY-FILES.md).
 * ──────────────────────────────────────────── */

const INVENTORY_PAGE = 1000;
/** Any key will do as long as nothing else in this database uses it. */
const RECONCILE_LOCK_KEY = 4_107_011_903;
/** A run still `running` this long after it started crashed and no longer blocks the next. */
export const RECONCILE_STALE_AFTER_MS = 2 * 60 * 60 * 1000;
const CHECK_EVERY_MS = 60 * 60 * 1000;
const FIRST_CHECK_AFTER_MS = 5 * 60 * 1000;

/** Every `(fileId, mediaId)` the site uses, streamed in `_id` order, a page at a time. */
export async function* mediaInventory(): AsyncGenerator<ServiceReferenceInventoryItem> {
  let after = '';
  for (;;) {
    const page = await db
      .select({ id: media._id, fileId: media.oxyFileId })
      .from(media)
      .where(and(isNotNull(media.oxyFileId), gt(media._id, after)))
      .orderBy(asc(media._id))
      .limit(INVENTORY_PAGE);
    for (const row of page) if (row.fileId) yield { fileId: row.fileId, entityId: row.id };
    if (page.length < INVENTORY_PAGE) return;
    after = page[page.length - 1].id;
  }
}

export type ReconcileOutcome =
  | { status: 'skipped' }
  | { status: 'busy'; runId: string }
  | {
      status: 'done';
      runId: string;
      dryRun: boolean;
      inventory: number;
      added: number;
      removed: number;
      unchanged: number;
      refused: number;
    };

/**
 * Claim a run: one at a time across every task (an advisory lock around the
 * check), and — unless `force` — none when a real run finished within
 * `intervalMs` or one is still in flight.
 */
async function claimRun(
  dryRun: boolean,
  force: boolean,
  intervalMs: number,
): Promise<string | null> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${RECONCILE_LOCK_KEY})`);
    if (!force) {
      const [recent] = await tx
        .select({ id: oxyFileReconciliations._id })
        .from(oxyFileReconciliations)
        .where(
          and(
            eq(oxyFileReconciliations.entityType, MEDIA_ENTITY_TYPE),
            or(
              and(
                eq(oxyFileReconciliations.status, 'done'),
                eq(oxyFileReconciliations.dryRun, false),
                gt(oxyFileReconciliations.startedAt, new Date(Date.now() - intervalMs)),
              ),
              and(
                eq(oxyFileReconciliations.status, 'running'),
                gt(
                  oxyFileReconciliations.startedAt,
                  new Date(Date.now() - RECONCILE_STALE_AFTER_MS),
                ),
              ),
            ),
          ),
        )
        .limit(1);
      if (recent) return null;
    }
    const [run] = await tx
      .insert(oxyFileReconciliations)
      .values({ entityType: MEDIA_ENTITY_TYPE, dryRun, status: 'running' })
      .returning({ id: oxyFileReconciliations._id });
    return run.id;
  });
}

/** Reconcile the site's `media` references with Oxy, recording the run. */
export async function reconcileMediaFiles(
  options: { dryRun?: boolean; force?: boolean; intervalMs?: number } = {},
): Promise<ReconcileOutcome> {
  const dryRun = options.dryRun === true;
  const runId = await claimRun(
    dryRun,
    options.force === true || dryRun,
    options.intervalMs ?? config.oxyFiles.reconcileIntervalHours * 60 * 60 * 1000,
  );
  if (!runId) return { status: 'skipped' };

  let inventory = 0;
  async function* counted() {
    for await (const item of mediaInventory()) {
      inventory += 1;
      yield item;
    }
  }
  try {
    const result = await reconcileMediaReferences(counted(), { dryRun });
    if (result === 'busy') {
      await db
        .update(oxyFileReconciliations)
        .set({ status: 'busy', finishedAt: new Date(), updatedAt: new Date() })
        .where(eq(oxyFileReconciliations._id, runId));
      return { status: 'busy', runId };
    }
    const counts = {
      inventory,
      added: result.added,
      removed: result.removed,
      unchanged: result.unchanged,
      refused: result.refused,
    };
    await db
      .update(oxyFileReconciliations)
      .set({ status: 'done', ...counts, finishedAt: new Date(), updatedAt: new Date() })
      .where(eq(oxyFileReconciliations._id, runId));
    return { status: 'done', runId, dryRun, ...counts };
  } catch (error) {
    await db
      .update(oxyFileReconciliations)
      .set({
        status: 'failed',
        inventory,
        error: (error instanceof Error ? error.message : String(error)).slice(0, 300),
        finishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(oxyFileReconciliations._id, runId));
    throw error;
  }
}

let timer: ReturnType<typeof setInterval> | null = null;

/**
 * Started once after bootstrap. Every task checks hourly; the claim makes it
 * one real run per interval across all of them. After each run the legacy
 * census is logged as one line, the series the bucket's retirement is gated on.
 */
export function startReferenceReconciliation(): void {
  if (timer) return;
  if (!config.oxyServiceApiKey || !config.oxyServiceApiSecret) {
    console.warn('[oxy-files] no Oxy service credential: references are not reconciled');
    return;
  }
  const run = () => {
    reconcileMediaFiles()
      .then(async (outcome) => {
        if (outcome.status === 'skipped') return;
        console.log(`[oxy-files:reconcile] ${JSON.stringify(outcome)}`);
        console.log(`[oxy-files:census] ${JSON.stringify(await legacyStorageCensus())}`);
      })
      .catch((error: unknown) => console.error('[oxy-files] reconciliation failed:', error));
  };
  setTimeout(run, FIRST_CHECK_AFTER_MS).unref();
  timer = setInterval(run, CHECK_EVERY_MS);
  timer.unref();
}
