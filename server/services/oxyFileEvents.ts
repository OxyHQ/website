import { and, eq, isNull, lt, ne, or, sql } from 'drizzle-orm';
import type { FileEvent } from '@oxy.so/core/server';
import { db } from '../db/postgres.js';
import { media, oxyFileEvents } from '../db/schema/index.js';

/* ──────────────────────────────────────────────
 * What Oxy tells the site about its files (ADR 0043 D9).
 *
 * A file can stop being servable without the site doing anything: taken down
 * after a content claim (`file.blocked`), moved to trash or deleted. Oxy then
 * no longer serves it, so every media row holding it is marked unavailable and
 * every public read treats the row as missing (`db/refs.ts`): the page shows no
 * image instead of a broken one. A file coming back (`file.unblocked`,
 * `file.restored`) clears the mark. Each event is recorded once, with what was
 * done about it, in `oxy_file_events`.
 * ──────────────────────────────────────────── */

const HIDES = new Set(['file.blocked', 'file.trashed', 'file.deleted']);
const RESTORES = new Set(['file.unblocked', 'file.restored']);

export interface AppliedFileEvent {
  duplicate: boolean;
  action: 'hidden' | 'restored' | 'recorded';
  mediaIds: string[];
}

/** What an event does to the rows holding its file. */
function effectOf(event: FileEvent): { hide: boolean; restore: boolean } {
  if (HIDES.has(event.type)) return { hide: true, restore: false };
  if (RESTORES.has(event.type)) return { hide: false, restore: true };
  if (event.type === 'file.visibility_changed') {
    // The site's files are public; one that is not can no longer be shown by URL.
    const isPublic = event.file.visibility === 'public';
    return { hide: !isPublic, restore: isPublic };
  }
  return { hide: false, restore: false };
}

/**
 * Apply one verified event, once. Events arrive at least once and in any
 * order, so a row only takes an event newer than the last one it took, and a
 * deleted file never comes back.
 */
export async function applyFileEvent(event: FileEvent): Promise<AppliedFileEvent> {
  const occurredAt = new Date(event.occurredAt);
  if (Number.isNaN(occurredAt.getTime()))
    throw new Error(`file event ${event.id} has no valid time`);

  return db.transaction(async (tx) => {
    const [recorded] = await tx
      .insert(oxyFileEvents)
      .values({
        eventId: event.id,
        type: event.type,
        fileId: event.file.id,
        fileStatus: event.file.status,
        occurredAt,
        references: event.references.map(({ entityType, entityId }) => ({ entityType, entityId })),
        action: 'recorded',
      })
      .onConflictDoNothing({ target: oxyFileEvents.eventId })
      .returning({ _id: oxyFileEvents._id });
    if (!recorded) return { duplicate: true, action: 'recorded', mediaIds: [] };

    const { hide, restore } = effectOf(event);
    const newer = or(isNull(media.fileEventAt), lt(media.fileEventAt, occurredAt));
    let action: AppliedFileEvent['action'] = 'recorded';
    let changed: { id: string }[] = [];
    if (hide) {
      changed = await tx
        .update(media)
        .set({
          unavailableAt: sql`coalesce(${media.unavailableAt}, now())`,
          unavailableReason: event.type,
          fileEventAt: occurredAt,
          updatedAt: new Date(),
        })
        .where(and(eq(media.oxyFileId, event.file.id), newer))
        .returning({ id: media._id });
      action = 'hidden';
    } else if (restore) {
      changed = await tx
        .update(media)
        .set({
          unavailableAt: null,
          unavailableReason: null,
          fileEventAt: occurredAt,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(media.oxyFileId, event.file.id),
            newer,
            or(isNull(media.unavailableReason), ne(media.unavailableReason, 'file.deleted')),
          ),
        )
        .returning({ id: media._id });
      action = 'restored';
    }
    const mediaIds = changed.map((row) => row.id);
    if (mediaIds.length === 0) action = 'recorded';
    await tx
      .update(oxyFileEvents)
      .set({ action, mediaIds, updatedAt: new Date() })
      .where(eq(oxyFileEvents._id, recorded._id));
    return { duplicate: false, action, mediaIds };
  });
}
