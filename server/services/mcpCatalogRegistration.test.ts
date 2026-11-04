/// <reference types="bun" />
import { describe, expect, test } from 'bun:test';
import type { AppCapabilityCatalog } from '@oxy.so/contracts';
import { capabilityCatalogDigest } from '@oxy.so/mcp';
import { WEBSITE_MCP_CATALOG } from '../mcp/catalog.js';
import {
  INITIAL_ATTEMPTS,
  createMcpCatalogRegistration,
  sanitizeErrorMessage,
} from './mcpCatalogRegistration.js';

/** Stands in for the callbacks these tests do not observe (logging, token invalidation). */
const ignore = (): void => undefined;

/** The shared Oxy transport, answering with `respond`. */
function transport(respond: (url: string, init?: RequestInit) => Promise<Response>): {
  fetch: typeof fetch;
} {
  return {
    fetch: Object.assign(
      (input: RequestInfo | URL, init?: RequestInit) => respond(String(input), init),
      { preconnect: fetch.preconnect },
    ),
  };
}

const SERVICE_TOKEN =
  'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJvLXdlYnNpdGUifQ.c2VjcmV0LXNpZ25hdHVyZS12YWx1ZQ';

const catalog = WEBSITE_MCP_CATALOG;

type Step = { status: number; body?: string } | Error;

/** Oxy's answer to a registration of `registered`: the binding it issues tickets for. */
function accepted(registered: AppCapabilityCatalog = catalog): { status: number; body: string } {
  return {
    status: 201,
    body: JSON.stringify({
      registration: {
        id: `reg-${registered.version}`,
        version: registered.version,
        digest: capabilityCatalogDigest(registered),
      },
    }),
  };
}

/**
 * A harness with a virtual clock: `sleep` advances time instead of waiting, so
 * an outage of hours runs in milliseconds and every delay is observable.
 */
function harness(steps: Step[]) {
  let clock = Date.parse('2026-09-17T10:00:00Z');
  const sleeps: number[] = [];
  const requests: Array<{ url: string; init: RequestInit }> = [];
  const logs: string[] = [];
  const registration = createMcpCatalogRegistration({
    catalog,
    oxyApiBase: 'https://api.oxy.test',
    transport: transport(async (url, init) => {
      requests.push({ url, init: init ?? {} });
      const step = steps.shift();
      if (!step) throw new Error('unexpected extra registration attempt');
      if (step instanceof Error) throw step;
      return new Response(step.body ?? '', { status: step.status });
    }),
    deps: {
      now: () => clock,
      sleep: async (ms) => {
        sleeps.push(ms);
        clock += ms;
      },
      random: () => 0.5,
      log: (message) => logs.push(message),
      error: (message) => logs.push(message),
    },
  });
  return {
    registration,
    sleeps,
    requests,
    logs,
    remaining: () => steps.length,
  };
}

describe('mcp catalog registration', () => {
  test('recovers from an outage longer than the initial burst without a restart', async () => {
    const outage: Step[] = Array.from({ length: INITIAL_ATTEMPTS + 6 }, (_, index) =>
      index % 2 === 0
        ? new Error('connect ECONNREFUSED 10.0.0.1:443')
        : { status: 502, body: 'Bad Gateway' },
    );
    const h = harness([...outage, accepted()]);

    const done = h.registration.start();
    await done;
    const status = h.registration.status();

    expect(h.remaining()).toBe(0);
    expect(status.state).toBe('registered');
    expect(status.attempts).toBe(INITIAL_ATTEMPTS + 7);
    expect(status.lastSuccessAt).not.toBeNull();
    expect(status.lastError).toBeNull();
    expect(status.nextAttemptAt).toBeNull();
    // Sustained backoff grows past the initial one-minute ceiling but stays bounded.
    expect(Math.max(...h.sleeps)).toBeGreaterThan(60_000);
    expect(Math.max(...h.sleeps)).toBeLessThanOrEqual(10 * 60_000);
    expect(h.sleeps.every((ms) => ms >= 1_000)).toBe(true);
  });

  test('reports retrying with a next attempt while the outage lasts', async () => {
    let clock = 0;
    let release: () => void = ignore;
    const registration = createMcpCatalogRegistration({
      catalog,
      oxyApiBase: 'https://api.oxy.test',
      transport: transport(async () => new Response('unavailable', { status: 500 })),
      deps: {
        now: () => clock,
        sleep: (ms) =>
          new Promise<void>((resolve) => {
            clock += ms;
            release = resolve;
          }),
        random: () => 0.5,
        log: ignore,
        error: ignore,
      },
    });
    expect(registration.status().state).toBe('pending');
    const done = registration.start();
    await Bun.sleep(0);
    const status = registration.status();
    expect(status.state).toBe('retrying');
    expect(status.nextAttemptAt).not.toBeNull();
    expect(status.lastError).toEqual({ status: 500, message: 'Oxy MCP request failed (500)' });
    registration.stop();
    release();
    await done;
    expect(registration.status().nextAttemptAt).toBeNull();
  });

  test('a remaining 401 uses bounded recovery after the shared transport has refreshed', async () => {
    const h = harness([{ status: 401, body: '{"error":"invalid_token"}' }, accepted()]);
    await h.registration.start();

    expect(h.registration.status().state).toBe('registered');
    expect(h.sleeps.length).toBe(1);
    expect(h.requests.every(({ init }) => !new Headers(init.headers).has('authorization'))).toBe(
      true,
    );
  });

  test('a permanent 403 stops retrying and reports a sanitized refusal', async () => {
    const body = JSON.stringify({
      error: 'catalog_namespace_not_authorized',
      requiredCapability: 'catalog:website',
      echoed: `authorization: Bearer ${SERVICE_TOKEN}`,
      padding: 'x '.repeat(400),
    });
    const h = harness([{ status: 403, body }]);
    await h.registration.start();
    const status = h.registration.status();

    expect(h.requests).toHaveLength(1);
    expect(h.sleeps).toEqual([]);
    expect(status.state).toBe('refused');
    expect(status.lastError?.status).toBe(403);
    expect(status.lastError?.message).toContain('catalog_namespace_not_authorized');
    expect(status.lastError!.message.length).toBeLessThanOrEqual(200);
    expect(status.lastError?.message).not.toContain(SERVICE_TOKEN);
    expect(h.logs.join('\n')).not.toContain(SERVICE_TOKEN);
    expect(h.logs.some((line) => line.includes('refused by configuration'))).toBe(true);
  });

  test('408 is retried, not treated as a refusal', async () => {
    const h = harness([{ status: 408 }, accepted()]);
    await h.registration.start();
    expect(h.registration.status().state).toBe('registered');
  });

  test('the state never contains the service token, whatever the failure echoes', async () => {
    const h = harness([
      new Error(`request failed with header Authorization: Bearer ${SERVICE_TOKEN}`),
      { status: 500, body: `upstream said ${SERVICE_TOKEN}` },
      { status: 401, body: `token ${SERVICE_TOKEN} expired` },
      { status: 400, body: `bad request for ${SERVICE_TOKEN}-rotated` },
    ]);
    const snapshots: string[] = [];
    const registration = h.registration;
    const done = registration.start();
    snapshots.push(JSON.stringify(registration.status()));
    await done;
    snapshots.push(JSON.stringify(registration.status()));
    for (const snapshot of snapshots) {
      expect(snapshot).not.toContain(SERVICE_TOKEN);
      expect(snapshot).not.toContain('eyJ');
    }
    expect(registration.status().state).toBe('refused');
  });

  test('the body carries the catalog and the deployment time; the status reports its digest', async () => {
    const h = harness([accepted()]);
    await h.registration.start();
    const body = JSON.parse(String(h.requests[0].init.body));
    expect(body.catalog).toEqual(catalog);
    expect(body.deployedAt).toBe('2026-09-17T10:00:00.000Z');
    expect(h.requests[0].url).toBe('https://api.oxy.test/capabilities/catalogs/register');
    expect(h.registration.status()).toMatchObject({
      catalogVersion: catalog.version,
      toolCount: catalog.tools.length,
      catalogHash: capabilityCatalogDigest(catalog),
    });
  });

  test('an answer naming another catalogue is not taken as registered', async () => {
    const h = harness([accepted({ ...catalog, version: '0.0.1' }), accepted()]);
    await h.registration.start();
    expect(h.requests).toHaveLength(2);
    expect(h.registration.status().state).toBe('registered');
  });

  test('two deploy versions report different hashes and each registers once, with no overwrite loop', async () => {
    const older = harness([accepted()]);
    const newerCatalog: AppCapabilityCatalog = { ...catalog, version: '1.1.99' };
    const newerRequests: string[] = [];
    const newer = createMcpCatalogRegistration({
      catalog: newerCatalog,
      oxyApiBase: 'https://api.oxy.test',
      transport: transport(async (url) => {
        newerRequests.push(url);
        const answer = accepted(newerCatalog);
        return new Response(answer.body, { status: answer.status });
      }),
      deps: {
        sleep: async () => undefined,
        log: ignore,
        error: ignore,
      },
    });
    await Promise.all([older.registration.start(), newer.start()]);
    expect(older.registration.status().catalogHash).not.toBe(newer.status().catalogHash);
    expect(older.requests).toHaveLength(1);
    expect(newerRequests).toHaveLength(1);
    // start() is idempotent: a second call does not register again.
    await newer.start();
    expect(newerRequests).toHaveLength(1);
  });

  test('stop() ends a pending retry and start() never rejects', async () => {
    let clock = 0;
    const registration = createMcpCatalogRegistration({
      catalog,
      transport: transport(async () => {
        throw new Error('credentials unavailable');
      }),
      oxyApiBase: 'https://api.oxy.test',
      deps: {
        now: () => clock,
        sleep: (ms, signal) =>
          new Promise<void>((resolve) => {
            clock += ms;
            signal.addEventListener('abort', () => resolve(), { once: true });
          }),
        log: ignore,
        error: ignore,
      },
    });
    const done = registration.start();
    await Bun.sleep(0);
    expect(registration.status().state).toBe('retrying');
    registration.stop();
    await expect(done).resolves.toBeUndefined();
  });
});

describe('helpers', () => {
  test('sanitizer masks bearer credentials and truncates', () => {
    const message = sanitizeErrorMessage(`Authorization: Bearer abc.def ${'y'.repeat(500)}`);
    expect(message).not.toContain('abc.def');
    expect(message.length).toBeLessThanOrEqual(200);
  });
});
