import { afterAll, afterEach, beforeAll, beforeEach, expect, spyOn, test } from 'bun:test';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import express from 'express';
import { eq, sql } from 'drizzle-orm';
import { config } from '../config.js';
import { db } from '../db/postgres.js';
import { faircoinApplications } from '../db/schema/index.js';
import {
  faircoinApplicationReceiptSchema,
  faircoinApplicationSchema,
} from '../contracts/faircoinApplication.js';
import { SITE_ADMIN_PERMISSION } from '../middleware/siteAdmin.js';
import { oxyService } from '../services/oxyService.js';
import { resetDatabase } from '../test/helpers.js';
import { ensureApp } from '../test/app.js';
import createFaircoinApplicationsRouter, {
  purgeExpiredFaircoinApplications,
} from './faircoinApplications.js';

const input = {
  projectName: 'Small workshop',
  website: 'https://example.test',
  contactName: 'Private person',
  contactEmail: 'private@example.test',
  offering: 'Repairs',
  needs: 'Design',
  capacity: 'Two jobs',
  availability: 'Next month',
  modality: 'remote',
  conditions: 'Scope agreed individually',
  contactConsent: true,
};
const environmentKeys = [
  'FAIRCOIN_APPLICATIONS_ENABLED',
  'FAIRCOIN_APPLICATION_REVIEWER',
  'FAIRCOIN_APPLICATION_RETENTION_DAYS',
  'FAIRCOIN_APPLICATION_PRIVACY_CONTACT',
] as const;
const previous = Object.fromEntries(environmentKeys.map((key) => [key, process.env[key]]));
let site: http.Server;
let fakeOxy: http.Server;
let base = '';

beforeAll(async () => {
  fakeOxy = http.createServer((req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (req.url !== `/applications/${config.oxyApplicationId}/roles/me`) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { 'content-type': 'application/json' }).end(
      JSON.stringify({
        applicationId: config.oxyApplicationId,
        userId: `person-${token}`,
        permissions: token === 'reviewer' ? [SITE_ADMIN_PERMISSION] : [],
      }),
    );
  });
  await new Promise<void>((resolve) =>
    fakeOxy.listen(Number(process.env.TEST_FAKE_OXY_PORT), 'localhost', resolve),
  );
});

beforeEach(async () => {
  await resetDatabase();
  process.env.FAIRCOIN_APPLICATIONS_ENABLED = 'true';
  process.env.FAIRCOIN_APPLICATION_REVIEWER = 'Assigned reviewer';
  process.env.FAIRCOIN_APPLICATION_RETENTION_DAYS = '90';
  process.env.FAIRCOIN_APPLICATION_PRIVACY_CONTACT = 'privacy@example.test';
  oxyService.invalidateAppPermissions();
  const app = express();
  // Represents the verified SDK session; the real app-permission gate still
  // calls fake Oxy for every write, as in siteAdmin.test.ts.
  app.use((req, _res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token)
      Object.assign(req, { userId: `user-${token}`, sessionId: `s-${token}`, accessToken: token });
    next();
  });
  app.use('/api/faircoin/applications', createFaircoinApplicationsRouter());
  site = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => site.once('listening', resolve));
  base = `http://127.0.0.1:${(site.address() as AddressInfo).port}/api/faircoin/applications`;
});

afterEach(async () => {
  site.closeAllConnections();
  await new Promise<void>((resolve) => site.close(() => resolve()));
  for (const key of environmentKeys) {
    if (previous[key] === undefined) delete process.env[key];
    else process.env[key] = previous[key];
  }
});
afterAll(async () => {
  fakeOxy.closeAllConnections();
  await new Promise<void>((resolve) => fakeOxy.close(() => resolve()));
});
const submit = (body: unknown = input, key = crypto.randomUUID()) =>
  fetch(base, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key },
    body: JSON.stringify(body),
  });
const admin = (path = '', method = 'GET', body?: unknown, token = 'reviewer') =>
  fetch(`${base}${path}`, {
    method,
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

test('disabled intake exposes preparation only and accepts no private data', async () => {
  process.env.FAIRCOIN_APPLICATIONS_ENABLED = 'false';
  const response = await fetch(`${base}/status`);
  expect(response.headers.get('cache-control')).toBe('no-store');
  expect(await response.json()).toEqual({
    state: 'preparation',
    acceptingApplications: false,
    retentionDays: null,
    privacyContact: null,
  });
  const submission = await submit();
  expect(submission.status).toBe(503);
  expect(await submission.json()).toEqual({ code: 'APPLICATIONS_CLOSED' });
  expect(await db.select().from(faircoinApplications)).toHaveLength(0);
});

test('racing retries create one private application and return the original receipt', async () => {
  const key = crypto.randomUUID();
  const responses = await Promise.all([submit(input, key), submit(input, key)]);
  expect(responses.map((response) => response.status).sort()).toEqual([200, 201]);
  const receipts = await Promise.all(responses.map((response) => response.json()));
  expect(receipts[0]).toEqual(receipts[1]);
  expect(faircoinApplicationReceiptSchema.safeParse(receipts[0]).success).toBe(true);
  expect(JSON.stringify(receipts)).not.toContain(input.contactEmail);
  const rows = await db.select().from(faircoinApplications);
  expect(rows).toHaveLength(1);
  expect(rows[0].keyHash).not.toBe(key);
  expect(rows[0].updatesConsent).toBe(false);
  const duplicate = await submit({ ...input, contactEmail: ' PRIVATE@example.test ' }, key);
  expect(duplicate.status).toBe(200);
  expect(await duplicate.json()).toEqual(receipts[0]);
  expect((await submit({ ...input, offering: 'Changed scope' }, key)).status).toBe(409);
  expect((await submit({ ...input, updatesConsent: true }, key)).status).toBe(409);
});

test('shared validation refuses missing consent, secrets, unsafe URLs and missing local location', async () => {
  for (const body of [
    { ...input, contactConsent: false },
    { ...input, wallet: 'wallet-address' },
    { ...input, website: 'javascript:alert(1)' },
    { ...input, modality: 'local' },
    { ...input, offering: 'a'.repeat(2001) },
  ]) {
    expect(faircoinApplicationSchema.safeParse(body).success).toBe(false);
    expect((await submit(body)).status).toBe(400);
  }
  expect(await db.select().from(faircoinApplications)).toHaveLength(0);
});

test('malformed/large JSON stays bounded, redacted and uncached', async () => {
  const logged = spyOn(console, 'error').mockImplementation(() => undefined);
  try {
    for (const [body, status] of [
      ['{"secret":"private@example.test"', 400],
      [JSON.stringify({ text: 'x'.repeat(40_000) }), 413],
    ] as const) {
      const response = await fetch(base, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
      });
      expect(response.status).toBe(status);
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(await response.text()).not.toContain('private@example.test');
    }
    expect(logged).not.toHaveBeenCalled();
  } finally {
    logged.mockRestore();
  }
});

test('honeypot discards submissions and anonymous bursts are limited', async () => {
  for (let count = 0; count < 5; count++)
    expect((await submit({ ...input, website_confirm: 'spam' })).status).toBe(201);
  const limited = await submit();
  expect(limited.status).toBe(429);
  expect(await limited.json()).toEqual({ code: 'RATE_LIMITED' });
  expect(await db.select().from(faircoinApplications)).toHaveLength(0);
});

test('database failures never log or return the driver payload', async () => {
  const logged = spyOn(console, 'error').mockImplementation(() => undefined);
  // A real driver failure includes the row in its detail and SQL parameters.
  await db.execute(
    sql`alter table faircoin_applications add constraint faircoin_test_reject check (offering <> 'Repairs')`,
  );
  try {
    const response = await submit();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ code: 'TEMPORARILY_UNAVAILABLE' });
    expect(logged).toHaveBeenCalledWith('[faircoin-applications] request failed');
    expect(JSON.stringify(logged.mock.calls)).not.toContain(input.contactEmail);
  } finally {
    await db.execute(sql`alter table faircoin_applications drop constraint faircoin_test_reject`);
    logged.mockRestore();
  }
});

test('the production composition admits FairCoin idempotency preflights and retains the small parser', async () => {
  await ensureApp();
  const endpoint = `http://127.0.0.1:${config.port}/api/faircoin/applications`;
  const headers = {
    origin: 'https://fairco.in',
    'access-control-request-method': 'POST',
    'access-control-request-headers': 'content-type,idempotency-key',
  };
  const response = await fetch(endpoint, { method: 'OPTIONS', headers });
  expect(response.status).toBe(204);
  expect(response.headers.get('access-control-allow-origin')).toBe('https://fairco.in');
  expect(response.headers.get('access-control-allow-headers')).toContain('idempotency-key');
  expect(
    (
      await fetch(endpoint, {
        method: 'OPTIONS',
        headers: { ...headers, origin: 'https://untrusted.example' },
      })
    ).status,
  ).toBe(403);
  const oversized = await fetch(endpoint, {
    method: 'POST',
    headers: { origin: 'https://fairco.in', 'content-type': 'application/json' },
    body: JSON.stringify({ text: 'x'.repeat(40_000) }),
  });
  expect(oversized.status).toBe(413);
  expect(await oversized.json()).toEqual({ code: 'BODY_TOO_LARGE' });
});

test('only site admins read, review and delete; approval never becomes a public offer', async () => {
  const receipt = (await (await submit()).json()) as { id: string };
  expect((await fetch(base)).status).toBe(401);
  expect((await fetch(`${base}/metrics`)).status).toBe(401);
  expect((await fetch(`${base}/${receipt.id}`)).status).toBe(404);
  expect((await admin('', 'GET', undefined, 'reader')).status).toBe(403);
  const list = await admin();
  expect(list.status).toBe(200);
  expect(list.headers.get('cache-control')).toBe('no-store');
  const payload = (await list.json()) as { applications: Record<string, unknown>[] };
  expect(payload.applications[0].contactEmail).toBe(input.contactEmail);
  expect(payload.applications[0]).not.toHaveProperty('keyHash');
  expect(
    (await admin(`/${receipt.id}`, 'PATCH', { fromStatus: 'submitted', status: 'approved' }))
      .status,
  ).toBe(409);
  expect(
    (await admin(`/${receipt.id}`, 'PATCH', { fromStatus: 'submitted', status: 'in_review' }))
      .status,
  ).toBe(200);
  expect(
    (await admin(`/${receipt.id}`, 'PATCH', { fromStatus: 'submitted', status: 'in_review' }))
      .status,
  ).toBe(409);
  expect(
    (await admin(`/${receipt.id}`, 'PATCH', { fromStatus: 'in_review', status: 'approved' }))
      .status,
  ).toBe(200);
  const [row] = await db.select().from(faircoinApplications);
  expect(row.statusChangedBy).toBe('person-reviewer');
  expect(await (await fetch(`${base}/status`)).json()).toMatchObject({ state: 'preparation' });
  expect((await admin(`/${receipt.id}`, 'DELETE', undefined, 'reader')).status).toBe(403);
  expect((await admin(`/${receipt.id}`, 'DELETE')).status).toBe(200);
  expect(await db.select().from(faircoinApplications)).toHaveLength(0);
});

test('expiry removes all private data even when approved or intake is disabled', async () => {
  const first = (await (await submit()).json()) as { id: string };
  await submit({ ...input, projectName: 'Another project' });
  await db
    .update(faircoinApplications)
    .set({ status: 'approved', deleteAfter: new Date(Date.now() - 1) })
    .where(eq(faircoinApplications._id, first.id));
  process.env.FAIRCOIN_APPLICATIONS_ENABLED = 'false';
  const beforePurge = (await (await admin()).json()) as { total: number };
  expect(beforePurge.total).toBe(1);
  expect(await purgeExpiredFaircoinApplications()).toBe(1);
  expect(await db.select().from(faircoinApplications)).toHaveLength(1);
});
