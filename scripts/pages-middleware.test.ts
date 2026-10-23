import { expect, spyOn, test } from 'bun:test';
import { onRequest } from '../functions/_middleware';
import { renderSEO } from '../src/entry-server';

test('static assets pass through the Pages middleware untouched', async () => {
  const response = new Response('original asset', {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000' },
  });
  const request = new Request('https://oxy.so/assets/private-test-name.png');
  const result = await onRequest({
    request,
    env: {},
    next: async () => response,
  } as unknown as Parameters<typeof onRequest>[0]);
  expect(result).toBe(response);
  expect(result.headers.get('Cache-Control')).toBe('public, max-age=31536000');
  expect(await result.text()).toBe('original asset');
});

for (const pathname of ['/es/pricing/', '/es/']) {
  test(`a missing locale document falls back only when the base exists: ${pathname}`, async () => {
    const visited: string[] = [];
    const result = await onRequest({
      request: new Request(`https://oxy.so${pathname}`),
      env: {},
      next: async (request?: Request) => {
        const path = request ? new URL(request.url).pathname : pathname;
        visited.push(path);
        return new Response(path === '/app-shell' ? 'application shell' : 'document', {
          status: path === pathname ? 404 : 200,
          headers: { 'Content-Type': 'text/html' },
        });
      },
    } as unknown as Parameters<typeof onRequest>[0]);
    expect(result.status).toBe(200);
    expect(await result.text()).toBe('application shell');
    expect(visited).toEqual([pathname, pathname === '/es/' ? '/' : '/pricing/', '/app-shell']);
  });
}

for (const pathname of ['/es/a-typo/', '/zz/pricing/', '/es/developers/docs/']) {
  test(`does not publish a soft 404 or untranslated mirror: ${pathname}`, async () => {
    const visited: string[] = [];
    const result = await onRequest({
      request: new Request(`https://oxy.so${pathname}`),
      env: {},
      next: async (request?: Request) => {
        visited.push(request ? new URL(request.url).pathname : pathname);
        return new Response('not found', { status: 404, headers: { 'Content-Type': 'text/html' } });
      },
    } as unknown as Parameters<typeof onRequest>[0]);
    expect(result.status).toBe(404);
    expect(visited).not.toContain('/app-shell');
  });
}

test('an existing locale document is never replaced by the application shell', async () => {
  const requests: Array<Request | undefined> = [];
  const response = new Response('translated document', {
    headers: { 'Content-Type': 'text/html' },
  });
  const result = await onRequest({
    request: new Request('https://oxy.so/es/pricing/'),
    env: {},
    next: async (request?: Request) => {
      requests.push(request);
      return response;
    },
  } as unknown as Parameters<typeof onRequest>[0]);
  expect(result).toBe(response);
  expect(requests).toEqual([undefined]);
});

test('FairCoin receives its own metadata and identity before JavaScript runs', async () => {
  const { head } = renderSEO(
    {
      title: 'Oxy',
      description: 'Oxy ecosystem',
      canonicalPath: '/',
    },
    null,
    { locales: [{ code: 'es', translationReady: true }] },
  );
  const fetchMock = spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response('{}', {
      headers: { 'Content-Type': 'application/json' },
    }),
  );
  try {
    const result = await onRequest({
      request: new Request('https://fairco.in/'),
      env: {},
      next: async () =>
        new Response(`<html><head>${head}</head><body></body></html>`, {
          headers: { 'Content-Type': 'text/html' },
        }),
    } as unknown as Parameters<typeof onRequest>[0]);
    const html = await result.text();
    expect(html).toContain('href="https://fairco.in/"');
    expect(html).toContain('"name":"FairCoin"');
    expect(html).toContain('"@id":"https://fairco.in/#website"');
    expect(html).not.toContain('"@type":"Organization"');
    expect(html).not.toContain('twitter:site');
    expect(html).not.toContain('hreflang');
    expect(html).not.toContain('https://oxy.so/');
  } finally {
    fetchMock.mockRestore();
  }
});
