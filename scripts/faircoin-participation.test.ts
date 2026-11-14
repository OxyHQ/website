import { expect, spyOn, test } from 'bun:test';
import { onRequest } from '../functions/_middleware';
import {
  faircoinApexHref,
  faircoinParticipationRoute,
} from '../src/lib/faircoin-participation-routes';
import { SUPPORTED_LOCALES } from '../src/lib/i18n/types';
import en from '../src/lib/i18n/locales/en';
import { renderSEO } from '../src/entry-server';
import {
  renderFaircoinParticipation,
  renderFaircoinPreparationChapter,
} from './faircoin-participation-prerender';
import { localizedSeoCopy } from './localized-seo';

test('approved routes resolve to the same document on both hosts, retaining locale', () => {
  for (const locale of ['', '/es', '/ca', '/ar']) {
    for (const page of ['participate', 'pilot']) {
      expect(faircoinParticipationRoute(`${locale}/${page}/`)?.document).toBe(
        `${locale}/faircoin/${page}/`,
      );
      expect(faircoinParticipationRoute(`${locale}/faircoin/${page}/`)?.apex).toBe(
        `${locale}/${page}/`,
      );
      expect(faircoinApexHref(`https://oxy.so${locale}/faircoin/${page}/`)).toBe(
        `${locale}/${page}/`,
      );
    }
  }
  for (const path of ['/company/', '/exchange/', '/pilot/unknown/', '/zz/pilot/']) {
    expect(faircoinParticipationRoute(path)).toBeNull();
  }
  expect(faircoinApexHref('https://unrelated.example/faircoin/pilot/')).toBeNull();
  expect(faircoinApexHref('/company/')).toBeNull();
});

test('every supported locale has public, indexable preparation prose and matching metadata', async () => {
  for (const locale of SUPPORTED_LOCALES) {
    const dictionary = (await import(`../src/lib/i18n/locales/${locale}.ts`)).default;
    const copy = dictionary.faircoinParticipation;
    expect(Object.keys(copy).sort()).toEqual(Object.keys(en.faircoinParticipation).sort());
    for (const value of Object.values(copy))
      expect(typeof value === 'string' && value.trim().length > 0).toBe(true);
    for (const page of ['participate', 'pilot'] as const) {
      const html = renderFaircoinParticipation(page, copy, locale);
      expect(html).toContain('data-pagefind-body');
      expect(html).toContain(copy.state.replace(/&/g, '&amp;'));
      expect(html).not.toContain('<form');
      expect(html).not.toContain('/api/');
      expect(html).not.toContain('<input');
      expect(localizedSeoCopy(`/faircoin/${page}`, dictionary)).toEqual({
        title: copy[`${page}Title`],
        description: copy[`${page}Description`],
      });
    }
  }
});

test('public prerender escapes prose instead of treating it as executable markup', () => {
  const html = renderFaircoinParticipation('pilot', {
    ...en.faircoinParticipation,
    body: '<script>alert(1)</script>',
  });
  expect(html).not.toContain('<script>');
  expect(html).toContain('&lt;script&gt;');
});

test('FairCoin serves translated static prose, links and metadata without an application shell', async () => {
  const dictionary = (await import('../src/lib/i18n/locales/es')).default;
  const copy = dictionary.faircoinParticipation;
  const { head } = renderSEO(
    {
      title: copy.pilotTitle,
      description: copy.pilotDescription,
      canonicalPath: '/faircoin/pilot',
    },
    null,
    { locale: 'es', locales: [{ code: 'es', translationReady: true }] },
  );
  const visited: string[] = [];
  const fetchMock = spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'));
  try {
    const result = await onRequest({
      request: new Request('https://fairco.in/es/pilot/'),
      env: {},
      next: async (request?: Request) => {
        visited.push(request ? new URL(request.url).pathname : '/es/pilot/');
        return new Response(
          `<html><head>${head}</head><body>${renderFaircoinParticipation('pilot', copy, 'es')}</body></html>`,
          { headers: { 'Content-Type': 'text/html' } },
        );
      },
    } as unknown as Parameters<typeof onRequest>[0]);
    const html = await result.text();
    expect(visited).toEqual(['/es/faircoin/pilot/']);
    expect(html).toContain(copy.pilotTitle);
    expect(html).toContain('https://fairco.in/es/pilot/');
    expect(html).toContain('href="/es/participate/"');
    expect(html).toContain('hreflang="es"');
    expect(html).not.toContain('https://oxy.so/');
    expect(html).not.toContain(' | Oxy');
    expect(html).toContain(' | FairCoin');
  } finally {
    fetchMock.mockRestore();
  }
});

test('FairCoin sitemap uses the host-specific file; Oxy keeps its own sitemap', async () => {
  for (const host of ['fairco.in', 'oxy.so']) {
    const visited: string[] = [];
    await onRequest({
      request: new Request(`https://${host}/sitemap.xml`),
      env: {},
      next: async (request?: Request) => {
        visited.push(request ? new URL(request.url).pathname : '/sitemap.xml');
        return new Response('<xml/>', { headers: { 'Content-Type': 'application/xml' } });
      },
    } as unknown as Parameters<typeof onRequest>[0]);
    expect(visited).toEqual([host === 'fairco.in' ? '/faircoin-sitemap.xml' : '/sitemap.xml']);
  }
});

for (const path of ['/pilot', '/participate', '/faircoin/pilot/', '/es/faircoin/participate/']) {
  test(`FairCoin normalizes only approved participation aliases: ${path}`, async () => {
    const result = await onRequest({
      request: new Request(`https://fairco.in${path}?source=nav`),
      env: {},
      next: async () => {
        throw new Error('redirect must not fetch static content');
      },
    } as unknown as Parameters<typeof onRequest>[0]);
    expect(result.status).toBe(308);
    expect(result.headers.get('location')).toBe(
      `https://fairco.in${faircoinParticipationRoute(path)?.apex}?source=nav`,
    );
  });
}

test('FairCoin robots advertises its own sitemap', async () => {
  const result = await onRequest({
    request: new Request('https://fairco.in/robots.txt'),
    env: {},
    next: async () =>
      new Response('User-agent: *\nAllow: /\nSitemap: https://oxy.so/sitemap.xml', {
        headers: { 'Content-Type': 'text/plain' },
      }),
  } as unknown as Parameters<typeof onRequest>[0]);
  expect(await result.text()).toContain('Sitemap: https://fairco.in/sitemap.xml');
});

test('a missing FairCoin locale document probes the real base document before SPA fallback', async () => {
  const visited: string[] = [];
  const fetchMock = spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'));
  try {
    const result = await onRequest({
      request: new Request('https://fairco.in/es/pilot/'),
      env: {},
      next: async (request?: Request) => {
        const path = request ? new URL(request.url).pathname : '/es/pilot/';
        visited.push(path);
        return new Response('<html><head><title>Pilot</title></head><body></body></html>', {
          status: path === '/es/faircoin/pilot/' ? 404 : 200,
          headers: { 'Content-Type': 'text/html' },
        });
      },
    } as unknown as Parameters<typeof onRequest>[0]);
    expect(result.status).toBe(200);
    expect(visited).toEqual(['/es/faircoin/pilot/', '/faircoin/pilot/', '/app-shell']);
  } finally {
    fetchMock.mockRestore();
  }
});

test('FairCoin landing exposes the preparation chapter before JavaScript runs', async () => {
  const visited: string[] = [];
  const fetchMock = spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'));
  try {
    const result = await onRequest({
      request: new Request('https://fairco.in/'),
      env: {},
      next: async (request?: Request) => {
        visited.push(request ? new URL(request.url).pathname : '/');
        return new Response(
          `<html><head><title>FairCoin</title></head><body>${renderFaircoinPreparationChapter(en.faircoinParticipation)}</body></html>`,
          { headers: { 'Content-Type': 'text/html' } },
        );
      },
    } as unknown as Parameters<typeof onRequest>[0]);
    const html = await result.text();
    expect(visited).toEqual(['/faircoin/']);
    expect(html).toContain(en.faircoinParticipation.title);
    expect(html).toContain('href="/participate/"');
    expect(html).toContain('href="/pilot/"');
  } finally {
    fetchMock.mockRestore();
  }
});
