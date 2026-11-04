import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import express from 'express';
import { config } from '../config.js';
import { oxyService } from '../services/oxyService.js';
import {
  adminActorId,
  adminOnly,
  isSiteAdmin,
  SITE_ADMIN_PERMISSION,
  siteAdminErrors,
} from './siteAdmin.js';

/* The site-admin gate against a fake Oxy `GET /applications/:id/roles/me`:
   who holds the permission, what a refusal and an outage are answered with,
   and that only an answer is ever remembered. */

type Answer = { status: number; permissions?: string[] };

/** What the fake Oxy answers, per bearer. */
const answers = new Map<string, Answer>();
const asked = new Map<string, number>();

let fakeOxy: http.Server;
let site: http.Server;
let base = '';

beforeAll(async () => {
  fakeOxy = http.createServer((req, res) => {
    const bearer = req.headers.authorization?.replace(/^Bearer /, '') ?? '';
    if (req.url !== `/applications/${config.oxyApplicationId}/roles/me`) {
      res.writeHead(404).end();
      return;
    }
    asked.set(bearer, (asked.get(bearer) ?? 0) + 1);
    const answer = answers.get(bearer) ?? { status: 401 };
    if (answer.status !== 200) {
      res.writeHead(answer.status, { 'content-type': 'application/json' }).end('{}');
      return;
    }
    res.writeHead(200, { 'content-type': 'application/json' }).end(
      JSON.stringify({
        applicationId: config.oxyApplicationId,
        userId: `person-${bearer}`,
        permissions: answer.permissions ?? [],
      }),
    );
  });
  await new Promise<void>((resolve) =>
    fakeOxy.listen(Number(process.env.TEST_FAKE_OXY_PORT), 'localhost', resolve),
  );

  // Stands in for `middleware.auth()`: the verified session it leaves on the request.
  const app = express();
  app.use((req, _res, next) => {
    const bearer = req.headers.authorization?.replace(/^Bearer /, '');
    if (bearer)
      Object.assign(req, {
        userId: `user-${bearer}`,
        sessionId: `s-${bearer}`,
        accessToken: bearer,
      });
    next();
  });
  app.get('/admin', adminOnly, (req, res) => res.json({ actor: adminActorId(req) }));
  app.post('/admin', adminOnly, (req, res) => res.json({ actor: adminActorId(req) }));
  app.get('/drafts', async (req, res) => res.json({ admin: await isSiteAdmin(req) }));
  app.use(siteAdminErrors);
  site = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => site.once('listening', resolve));
  base = `http://127.0.0.1:${(site.address() as AddressInfo).port}`;
});

afterAll(async () => {
  site.closeAllConnections();
  fakeOxy.closeAllConnections();
  await Promise.all([
    new Promise<void>((resolve) => site.close(() => resolve())),
    new Promise<void>((resolve) => fakeOxy.close(() => resolve())),
  ]);
});

beforeEach(() => {
  answers.clear();
  asked.clear();
  oxyService.invalidateAppPermissions();
});

const call = (path: string, bearer?: string, method = 'GET') =>
  fetch(`${base}${path}`, {
    method,
    headers: bearer ? { authorization: `Bearer ${bearer}` } : {},
  });

describe('adminOnly', () => {
  test('admits a holder and records the person Oxy resolved as the actor', async () => {
    answers.set('admin', { status: 200, permissions: [SITE_ADMIN_PERMISSION] });
    const response = await call('/admin', 'admin');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ actor: 'person-admin' });
  });

  test('refuses a person without the permission', async () => {
    answers.set('reader', { status: 200, permissions: ['website.other.thing'] });
    const response = await call('/admin', 'reader');
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'Admin access required' });
  });

  test('an Oxy outage is 503, and is never remembered as a refusal', async () => {
    answers.set('admin', { status: 503 });
    expect((await call('/admin', 'admin')).status).toBe(503);
    expect((await call('/admin', 'admin')).status).toBe(503);
    expect(asked.get('admin')).toBe(2);

    answers.set('admin', { status: 200, permissions: [SITE_ADMIN_PERMISSION] });
    expect((await call('/admin', 'admin')).status).toBe(200);
  });

  test('a read reuses an answer; a write asks Oxy every time', async () => {
    answers.set('admin', { status: 200, permissions: [SITE_ADMIN_PERMISSION] });
    expect((await call('/admin', 'admin')).status).toBe(200);
    expect((await call('/admin', 'admin')).status).toBe(200);
    expect(asked.get('admin')).toBe(1);

    // Revoked in Oxy: the next write sees it at once.
    answers.set('admin', { status: 200, permissions: [] });
    expect((await call('/admin', 'admin', 'POST')).status).toBe(403);
    expect(asked.get('admin')).toBe(2);
  });
});

describe('isSiteAdmin', () => {
  test('an anonymous request is not asked about', async () => {
    expect(await (await call('/drafts')).json()).toEqual({ admin: false });
    expect(asked.size).toBe(0);
  });

  test('answers for a holder and for a person without the permission', async () => {
    answers.set('admin', { status: 200, permissions: [SITE_ADMIN_PERMISSION] });
    answers.set('reader', { status: 200, permissions: [] });
    expect(await (await call('/drafts', 'admin')).json()).toEqual({ admin: true });
    expect(await (await call('/drafts', 'reader')).json()).toEqual({ admin: false });
  });

  test('a session Oxy refuses is not an admin', async () => {
    answers.set('expired', { status: 401 });
    expect(await (await call('/drafts', 'expired')).json()).toEqual({ admin: false });
  });

  test('an outage is an error, not the public answer', async () => {
    answers.set('admin', { status: 502 });
    const response = await call('/drafts', 'admin');
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'Access could not be checked right now' });
  });
});
