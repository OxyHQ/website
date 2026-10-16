import { beforeAll, beforeEach, describe, expect, test } from 'bun:test';
import { createHmac } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { config } from '../config.js';
import { db } from '../db/postgres.js';
import { populateOne } from '../db/refs.js';
import { media, newsroomPosts, oxyFileEvents } from '../db/schema/index.js';
import { ensureApp } from '../test/app.js';
import { png, resetDatabase } from '../test/helpers.js';
import { ingestUpload } from '../services/media.js';

/* The file-events endpoint through the real app: its place before the JSON
   parser is what lets the signature cover the bytes Oxy sent. */

beforeAll(ensureApp);
beforeEach(resetDatabase);

const endpoint = () => `http://127.0.0.1:${config.port}/api/oxy/file-events`;

function signed(body: string, secret = 'whsec_test', at = Math.floor(Date.now() / 1000)) {
  const signature = createHmac('sha256', secret).update(`${at}.${body}`).digest('hex');
  return { 'content-type': 'application/json', 'oxy-signature': `t=${at},v1=${signature}` };
}

let sequence = 0;
function event(type: string, fileId: string, occurredAt: string, references: unknown[] = []) {
  sequence += 1;
  return JSON.stringify({
    id: `evt_${sequence}`,
    type,
    occurredAt,
    file: { id: fileId, ownerKind: 'application', visibility: 'public', status: 'blocked' },
    references,
  });
}

const send = (body: string, headers: Record<string, string>) =>
  fetch(endpoint(), { method: 'POST', body, headers });

async function storedImage() {
  const { media: row } = await ingestUpload({
    buffer: await png(40, 40, 6),
    filename: 'cover.png',
    folder: 'newsroom',
    uploadedBy: 'editor-1',
  });
  return row;
}

describe('the file-events endpoint', () => {
  test('answers the verification challenge, even before a secret is set', async () => {
    const saved = config.oxyFiles.webhookSecret;
    config.oxyFiles.webhookSecret = '';
    try {
      const response = await send(JSON.stringify({ type: 'webhook.challenge', challenge: 'c-1' }), {
        'content-type': 'application/json',
      });
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ challenge: 'c-1' });
      const unconfigured = await send(event('file.blocked', 'f1', new Date().toISOString()), {
        'content-type': 'application/json',
      });
      expect(unconfigured.status).toBe(503);
    } finally {
      config.oxyFiles.webhookSecret = saved;
    }
  });

  test('refuses a wrong or stale signature and records nothing', async () => {
    const body = event('file.blocked', 'f1', new Date().toISOString());
    expect((await send(body, signed(body, 'whsec_other'))).status).toBe(401);
    const stale = Math.floor(Date.now() / 1000) - 3600;
    expect((await send(body, signed(body, 'whsec_test', stale))).status).toBe(401);
    expect(await db.select().from(oxyFileEvents)).toHaveLength(0);
  });

  test('a blocked file is hidden wherever the site shows it, once, with an audit record', async () => {
    const row = await storedImage();
    const [post] = await db
      .insert(newsroomPosts)
      .values({ title: 'P', slug: 'p', coverImage: row._id })
      .returning();
    const body = event('file.blocked', row.oxyFileId ?? '', new Date().toISOString(), [
      { entityType: 'media', entityId: row._id },
    ]);
    expect((await send(body, signed(body))).status).toBe(204);
    // Delivered again (at least once): applied once.
    expect((await send(body, signed(body))).status).toBe(204);

    const [hidden] = await db.select().from(media).where(eq(media._id, row._id));
    expect(hidden.unavailableReason).toBe('file.blocked');
    const populated = await populateOne({ ...post }, { coverImage: media });
    expect(populated?.coverImage).toBeNull();
    const publicRead = await fetch(`http://127.0.0.1:${config.port}/api/media/${row._id}`);
    expect(publicRead.status).toBe(404);

    const audit = await db.select().from(oxyFileEvents);
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({ type: 'file.blocked', action: 'hidden', mediaIds: [row._id] });
  });

  test('events apply in the order they happened, and a deleted file never comes back', async () => {
    const row = await storedImage();
    const fileId = row.oxyFileId ?? '';
    const t0 = new Date(Date.now() - 3000).toISOString();
    const t1 = new Date(Date.now() - 2000).toISOString();
    const t2 = new Date(Date.now() - 1000).toISOString();

    const blocked = event('file.blocked', fileId, t1);
    const olderRestore = event('file.unblocked', fileId, t0);
    await send(blocked, signed(blocked));
    await send(olderRestore, signed(olderRestore));
    let [current] = await db.select().from(media).where(eq(media._id, row._id));
    expect(current.unavailableReason).toBe('file.blocked');

    const unblocked = event('file.unblocked', fileId, t2);
    await send(unblocked, signed(unblocked));
    [current] = await db.select().from(media).where(eq(media._id, row._id));
    expect(current.unavailableAt).toBeNull();

    const deleted = event('file.deleted', fileId, new Date().toISOString());
    const restored = event('file.restored', fileId, new Date(Date.now() + 1000).toISOString());
    await send(deleted, signed(deleted));
    await send(restored, signed(restored));
    [current] = await db.select().from(media).where(eq(media._id, row._id));
    expect(current.unavailableReason).toBe('file.deleted');
  });
});
