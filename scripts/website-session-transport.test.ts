import { test, expect } from 'bun:test';
import { createServer } from 'node:http';
import express from 'express';
import { OxyServices } from '@oxy.so/core';

const token = (account: string, generation = 0) =>
  `e30.${Buffer.from(JSON.stringify({ userId: account, sessionId: account, exp: 2_000_000_000, generation })).toString('base64url')}.sig`;

test('website public reads, private bodies and account changes share the Oxy transport', async () => {
  const calls: { path: string; auth?: string; body: string }[] = [];
  let arrived: (() => void) | undefined;
  let release: (() => void) | undefined;
  const app = express();
  app.post(
    '/api/json-write',
    express.json(),
    express.text(),
    express.raw({ type: 'multipart/form-data' }),
    (req, res) => {
      res.json({
        body: Buffer.isBuffer(req.body) ? req.body.toString() : req.body,
        contentType: req.headers['content-type'],
      });
    },
  );
  app.use(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    expect(req.headers.cookie).toBeUndefined();
    calls.push({ path: req.url ?? '', auth: req.headers.authorization, body });
    if (req.url === '/api/held') {
      arrived?.();
      await new Promise<void>((resolve) => {
        release = resolve;
      });
    }
    if (req.url === '/api/backup' && req.headers.authorization === `Bearer ${token('A')}`) {
      res.writeHead(401).end();
      return;
    }
    if (req.url === '/api/missing') {
      res.writeHead(404).end('{"error":"Missing item"}');
      return;
    }
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ data: { title: 'Public' }, auth: req.headers.authorization ?? null }));
  });
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No test server');
  const origin = `http://127.0.0.1:${address.port}`;
  process.env.VITE_API_URL = origin;
  const { apiFetch, apiResponse, errorStatus, setOxyServices, releaseOxyServices } = await import(
    '../src/api/client'
  );
  const oxy = new OxyServices({ baseURL: origin });
  try {
    setOxyServices(oxy);
    expect(await apiFetch<unknown>('/public', { locale: 'en US' })).toEqual({
      data: { title: 'Public' },
      auth: null,
    });
    expect(calls[0]?.path).toBe('/api/public?locale=en%20US');
    expect(
      await apiFetch('/json-write', { method: 'POST', body: JSON.stringify({ title: 'Saved' }) }),
    ).toEqual({ body: { title: 'Saved' }, contentType: 'application/json' });
    expect(
      await apiFetch('/json-write', {
        method: 'POST',
        headers: new Headers({ 'content-type': 'text/plain' }),
        body: 'Explicit text',
      }),
    ).toEqual({ body: 'Explicit text', contentType: 'text/plain' });
    const multipart = new FormData();
    multipart.append('file', new Blob(['picture']), 'picture.png');
    const upload = await apiFetch<{ body: string; contentType: string }>('/json-write', {
      method: 'POST',
      body: multipart,
    });
    expect(upload.contentType).toMatch(/^multipart\/form-data; boundary=/);
    expect(upload.body).toContain('picture.png');
    await expect(apiResponse(`${origin}/api/backup`)).rejects.toMatchObject({
      code: 'AUTH_REQUIRED',
    });
    oxy.session.setAccessToken(token('A'));
    oxy.http.setAuthRefreshHandler(async () => token('A', 1));
    const backup = await apiResponse(`${origin}/api/backup`, {
      method: 'POST',
      body: '{"version":1}',
    });
    expect(backup.ok).toBe(true);
    expect(calls.slice(-2).map(({ body }) => body)).toEqual(['{"version":1}', '{"version":1}']);
    const form = new FormData();
    form.append('file', new Blob(['picture']), 'picture.png');
    await apiResponse(`${origin}/api/upload`, { method: 'POST', body: form });
    expect(calls.at(-1)?.body).toContain('picture.png');
    const ready = new Promise<void>((resolve) => {
      arrived = resolve;
    });
    const held = apiFetch('/held');
    await ready;
    oxy.session.setAccessToken(token('B'));
    release?.();
    await expect(held).rejects.toMatchObject({ message: expect.any(String) });
    expect(await apiFetch('/public')).toMatchObject({ auth: `Bearer ${token('B')}` });
    try {
      await apiFetch('/missing');
      throw new Error('Expected refusal');
    } catch (error) {
      expect(errorStatus(error)).toBe(404);
      expect(String(error)).toContain('Missing item');
    }
    releaseOxyServices(oxy);
    await expect(apiFetch('/public')).rejects.toThrow('not initialized');
  } finally {
    release?.();
    releaseOxyServices(oxy);
    oxy.dispose();
    delete process.env.VITE_API_URL;
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
