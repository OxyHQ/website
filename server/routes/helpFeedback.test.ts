import { beforeAll, beforeEach, expect, test } from 'bun:test';
import { db } from '../db/postgres.js';
import { helpFeedback } from '../db/schema/index.js';
import { ensureApp } from '../test/app.js';
import { resetDatabase } from '../test/helpers.js';
import { config } from '../config.js';

beforeAll(ensureApp);
beforeEach(resetDatabase);
const vote = {
  slug: 'account/add-recovery-email',
  locale: 'en',
  token: '95126c4c-8c4c-4c90-9e2b-d2ee28c10b5d',
  helpful: true,
};
const submit = (body: unknown) =>
  fetch(`http://127.0.0.1:${config.port}/api/help/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

test('anonymous votes persist; concurrent retries and changed opinions update one row', async () => {
  const responses = await Promise.all([submit(vote), submit(vote)]);
  expect(responses.map((response) => response.status)).toEqual([200, 200]);
  expect((await db.select().from(helpFeedback)).length).toBe(1);
  expect((await submit({ ...vote, helpful: false })).status).toBe(200);
  const rows = await db.select().from(helpFeedback);
  expect(rows).toHaveLength(1);
  expect(rows[0].helpful).toBe(false);
  expect(rows[0]._id).toMatch(/^[a-f0-9]{24}$/);
  expect((await submit({ ...vote, slug: 'inbox/encryption' })).status).toBe(200);
  expect((await db.select().from(helpFeedback)).length).toBe(2);
});

test('malformed votes and injected identity fields do not write rows', async () => {
  for (const body of [
    { ...vote, token: 'bad' },
    { ...vote, slug: '../private' },
    { ...vote, helpful: 'yes' },
    { ...vote, accountId: 'other-user' },
  ]) {
    expect((await submit(body)).status).toBe(400);
  }
  expect(await db.select().from(helpFeedback)).toHaveLength(0);
});
