import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { objectId, timestamps } from './columns.js';

/* ──────────────────────────────────────────────
 * The site's side of Oxy Files (ADR 0043, `docs/OXY-FILES.md`).
 *
 * Oxy owns the bytes and garbage-collects an application's file nobody
 * references. What the site keeps is what only it can know: which of its rows
 * still use a file (owed reference removals), what Oxy told it about a file
 * (events), and how each legacy object was carried over (the migration).
 * ──────────────────────────────────────────── */

/**
 * Reference removals still owed to Oxy. A media row is deleted in the same
 * transaction that records its reference here, so an Oxy outage after the
 * commit leaves a durable to-do rather than a reference that keeps an unused
 * file alive. `purge` also deletes the file once no media row uses it (an
 * editor deleted the image: it should stop being served now, not after Oxy's
 * 24-hour grace). The nightly reconciliation is the net under this queue.
 */
export const oxyFileReferenceRemovals = pgTable(
  'oxy_file_reference_removals',
  {
    _id: objectId(),
    fileId: text().notNull(),
    entityType: text().notNull(),
    entityId: text().notNull(),
    purge: boolean().notNull().default(false),
    /** 'media_deleted' | 'upload_compensation' | 'diagnostic' */
    reason: text().notNull(),
    attempts: integer().notNull().default(0),
    lastError: text(),
    nextAttemptAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('oxy_file_reference_removals_reference_idx').on(
      table.fileId,
      table.entityType,
      table.entityId,
    ),
    index('oxy_file_reference_removals_next_attempt_idx').on(table.nextAttemptAt),
  ],
);

/**
 * Every file event Oxy delivered, once: the dedupe (delivery is at least once)
 * and the audit of what the site did about it.
 */
export const oxyFileEvents = pgTable(
  'oxy_file_events',
  {
    _id: objectId(),
    eventId: text().notNull(),
    type: text().notNull(),
    fileId: text().notNull(),
    fileStatus: text().notNull(),
    occurredAt: timestamp({ withTimezone: true }).notNull(),
    /** This application's references to the file, as Oxy listed them. */
    references: jsonb().$type<{ entityType: string; entityId: string }[]>().notNull(),
    /** 'hidden' | 'restored' | 'recorded' (nothing to change) */
    action: text().notNull(),
    /** The media rows the action changed. */
    mediaIds: text().array().notNull().default([]),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('oxy_file_events_event_id_idx').on(table.eventId),
    index('oxy_file_events_file_id_idx').on(table.fileId),
  ],
);

/**
 * One row per media row the migration carried from the legacy storage into
 * Oxy Files: the resumable state, the evidence (both hashes) and the legacy
 * URLs the rewrite replaces. Kept after the bucket is retired as the record of
 * what moved where.
 */
export const mediaStorageMigrations = pgTable(
  'media_storage_migrations',
  {
    _id: objectId(),
    mediaId: text().notNull(),
    legacyKey: text().notNull(),
    legacyUrl: text().notNull(),
    legacyThumbnails: jsonb().$type<{ sm: string; md: string; lg: string }>().notNull(),
    /** 'migrated' | 'failed' | 'deferred' (an SVG, which Oxy Files cannot hold yet — TODO(oxy-svg)) */
    status: text().notNull(),
    /** SHA-256 of the bytes read from the legacy storage. */
    legacySha256: text(),
    /** SHA-256 Oxy reported for the stored file; equal to `legacySha256` or the row failed. */
    oxySha256: text(),
    oxyFileId: text(),
    error: text(),
    attempts: integer().notNull().default(0),
    migratedAt: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (table) => [uniqueIndex('media_storage_migrations_media_id_idx').on(table.mediaId)],
);

/**
 * Every reconciliation of the site's references with Oxy (ADR 0043 D6): the
 * claim that keeps several tasks from running one each, and the record of
 * what each run found. A run still `running` after `RECONCILE_STALE_AFTER`
 * crashed and no longer blocks the next.
 */
export const oxyFileReconciliations = pgTable(
  'oxy_file_reconciliations',
  {
    _id: objectId(),
    entityType: text().notNull(),
    dryRun: boolean().notNull(),
    /** 'running' | 'done' | 'failed' | 'busy' (Oxy had one open for this application already) */
    status: text().notNull(),
    inventory: integer(),
    added: integer(),
    removed: integer(),
    unchanged: integer(),
    refused: integer(),
    error: text(),
    startedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (table) => [index('oxy_file_reconciliations_started_at_idx').on(table.startedAt)],
);
