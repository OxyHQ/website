/// <reference types="bun" />
import { describe, expect, test } from 'bun:test'
import type { AppCapabilityCatalog } from '@oxy.so/contracts'
import {
  INITIAL_ATTEMPTS,
  catalogHash,
  canonicalJson,
  createMcpCatalogRegistration,
  parseRetryAfter,
  sanitizeErrorMessage,
} from './mcpCatalogRegistration.js'

const SERVICE_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJvLXdlYnNpdGUifQ.c2VjcmV0LXNpZ25hdHVyZS12YWx1ZQ'

const catalog = {
  appId: 'website',
  version: '2026.09.17',
  tools: [{ name: 'list_posts' }, { name: 'create_post' }],
} as unknown as AppCapabilityCatalog

type Step = { status: number; body?: string; headers?: Record<string, string> } | Error

/**
 * A harness with a virtual clock: `sleep` advances time instead of waiting, so
 * an outage of hours runs in milliseconds and every delay is observable.
 */
function harness(steps: Step[], options: { random?: () => number } = {}) {
  let clock = Date.parse('2026-09-17T10:00:00Z')
  const sleeps: number[] = []
  const requests: Array<{ url: string; init: RequestInit }> = []
  const logs: string[] = []
  let invalidations = 0
  let token = SERVICE_TOKEN
  const oxy = {
    getServiceToken: async () => token,
    invalidateServiceToken: () => {
      invalidations += 1
      token = `${SERVICE_TOKEN}-rotated`
    },
  }
  const registration = createMcpCatalogRegistration({
    catalog,
    oxy: oxy as never,
    oxyApiBase: 'https://api.oxy.test',
    deps: {
      fetch: async (url, init) => {
        requests.push({ url, init })
        const step = steps.shift()
        if (!step) throw new Error('unexpected extra registration attempt')
        if (step instanceof Error) throw step
        return new Response(step.body ?? '', { status: step.status, headers: step.headers })
      },
      now: () => clock,
      sleep: async (ms) => {
        sleeps.push(ms)
        clock += ms
      },
      random: options.random ?? (() => 0.5),
      log: (message) => logs.push(message),
      error: (message) => logs.push(message),
    },
  })
  return { registration, sleeps, requests, logs, invalidations: () => invalidations, remaining: () => steps.length }
}

describe('mcp catalog registration', () => {
  test('recovers from an outage longer than the initial burst without a restart', async () => {
    const outage: Step[] = Array.from({ length: INITIAL_ATTEMPTS + 6 }, (_, index) =>
      index % 2 === 0 ? new Error('connect ECONNREFUSED 10.0.0.1:443') : { status: 502, body: 'Bad Gateway' })
    const h = harness([...outage, { status: 201, body: '{"registration":{}}' }])

    const done = h.registration.start()
    await done
    const status = h.registration.status()

    expect(h.remaining()).toBe(0)
    expect(status.state).toBe('registered')
    expect(status.attempts).toBe(INITIAL_ATTEMPTS + 7)
    expect(status.lastSuccessAt).not.toBeNull()
    expect(status.lastError).toBeNull()
    expect(status.nextAttemptAt).toBeNull()
    // Sustained backoff grows past the initial one-minute ceiling but stays bounded.
    expect(Math.max(...h.sleeps)).toBeGreaterThan(60_000)
    expect(Math.max(...h.sleeps)).toBeLessThanOrEqual(10 * 60_000)
    expect(h.sleeps.every((ms) => ms >= 1_000)).toBe(true)
  })

  test('reports retrying with a next attempt while the outage lasts', async () => {
    let clock = 0
    let release: () => void = () => {}
    const registration = createMcpCatalogRegistration({
      catalog,
      oxy: { getServiceToken: async () => SERVICE_TOKEN, invalidateServiceToken: () => {} } as never,
      oxyApiBase: 'https://api.oxy.test',
      deps: {
        fetch: async () => new Response('unavailable', { status: 500 }),
        now: () => clock,
        sleep: (ms) => new Promise<void>((resolve) => { clock += ms; release = resolve }),
        random: () => 0.5,
        log: () => {},
        error: () => {},
      },
    })
    expect(registration.status().state).toBe('pending')
    const done = registration.start()
    await Bun.sleep(0)
    const status = registration.status()
    expect(status.state).toBe('retrying')
    expect(status.nextAttemptAt).not.toBeNull()
    expect(status.lastError).toEqual({ status: 500, message: 'unavailable' })
    registration.stop()
    release()
    await done
    expect(registration.status().nextAttemptAt).toBeNull()
  })

  test('a 401 invalidates the service token and the next attempt succeeds', async () => {
    const h = harness([{ status: 401, body: '{"error":"invalid_token"}' }, { status: 201 }])
    await h.registration.start()

    expect(h.invalidations()).toBe(1)
    expect(h.registration.status().state).toBe('registered')
    const headers = h.requests.map((request) => (request.init.headers as Record<string, string>).authorization)
    expect(headers).toEqual([`Bearer ${SERVICE_TOKEN}`, `Bearer ${SERVICE_TOKEN}-rotated`])
  })

  test('a 429 with Retry-After in seconds waits at least that long', async () => {
    const h = harness([{ status: 429, headers: { 'retry-after': '120' } }, { status: 201 }], { random: () => 0 })
    await h.registration.start()
    expect(h.sleeps).toEqual([120_000])
    expect(h.registration.status().state).toBe('registered')
  })

  test('a 503 with Retry-After as an HTTP date waits until that date', async () => {
    const retryAt = new Date(Date.parse('2026-09-17T10:05:00Z')).toUTCString()
    const h = harness([{ status: 503, headers: { 'retry-after': retryAt } }, { status: 201 }], { random: () => 0 })
    await h.registration.start()
    expect(h.sleeps).toEqual([300_000])
  })

  test('a permanent 403 stops retrying and reports a sanitized refusal', async () => {
    const body = JSON.stringify({
      error: 'catalog_namespace_not_authorized',
      requiredCapability: 'catalog:website',
      echoed: `authorization: Bearer ${SERVICE_TOKEN}`,
      padding: 'x '.repeat(400),
    })
    const h = harness([{ status: 403, body }])
    await h.registration.start()
    const status = h.registration.status()

    expect(h.requests).toHaveLength(1)
    expect(h.sleeps).toEqual([])
    expect(status.state).toBe('refused')
    expect(status.lastError?.status).toBe(403)
    expect(status.lastError?.message).toContain('catalog_namespace_not_authorized')
    expect(status.lastError!.message.length).toBeLessThanOrEqual(200)
    expect(status.lastError?.message).not.toContain(SERVICE_TOKEN)
    expect(h.logs.join('\n')).not.toContain(SERVICE_TOKEN)
    expect(h.logs.some((line) => line.includes('refused by configuration'))).toBe(true)
  })

  test('408 is retried, not treated as a refusal', async () => {
    const h = harness([{ status: 408 }, { status: 201 }])
    await h.registration.start()
    expect(h.registration.status().state).toBe('registered')
  })

  test('the state never contains the service token, whatever the failure echoes', async () => {
    const h = harness([
      new Error(`request failed with header Authorization: Bearer ${SERVICE_TOKEN}`),
      { status: 500, body: `upstream said ${SERVICE_TOKEN}` },
      { status: 401, body: `token ${SERVICE_TOKEN} expired` },
      { status: 400, body: `bad request for ${SERVICE_TOKEN}-rotated` },
    ])
    const snapshots: string[] = []
    const registration = h.registration
    const done = registration.start()
    snapshots.push(JSON.stringify(registration.status()))
    await done
    snapshots.push(JSON.stringify(registration.status()))
    for (const snapshot of snapshots) {
      expect(snapshot).not.toContain(SERVICE_TOKEN)
      expect(snapshot).not.toContain('eyJ')
    }
    expect(registration.status().state).toBe('refused')
  })

  test('the body carries the catalog, the deployment time and the catalog hash', async () => {
    const h = harness([{ status: 201 }])
    await h.registration.start()
    const body = JSON.parse(String(h.requests[0].init.body))
    expect(body.catalog).toEqual(catalog)
    expect(body.catalogHash).toBe(catalogHash(catalog))
    expect(body.deployedAt).toBe('2026-09-17T10:00:00.000Z')
    expect(h.requests[0].url).toBe('https://api.oxy.test/capabilities/catalogs/register')
    expect(h.registration.status()).toMatchObject({ catalogVersion: '2026.09.17', toolCount: 2, catalogHash: catalogHash(catalog) })
  })

  test('two deploy versions report different hashes and each registers once, with no overwrite loop', async () => {
    const older = harness([{ status: 201 }])
    const newerCatalog = { ...catalog, version: '2026.09.18' } as AppCapabilityCatalog
    const newerRequests: string[] = []
    const newer = createMcpCatalogRegistration({
      catalog: newerCatalog,
      oxy: { getServiceToken: async () => SERVICE_TOKEN, invalidateServiceToken: () => {} } as never,
      oxyApiBase: 'https://api.oxy.test',
      deps: {
        fetch: async (url) => { newerRequests.push(url); return new Response('', { status: 201 }) },
        sleep: async () => {},
        log: () => {},
        error: () => {},
      },
    })
    await Promise.all([older.registration.start(), newer.start()])
    expect(older.registration.status().catalogHash).not.toBe(newer.status().catalogHash)
    expect(older.requests).toHaveLength(1)
    expect(newerRequests).toHaveLength(1)
    // start() is idempotent: a second call does not register again.
    await newer.start()
    expect(newerRequests).toHaveLength(1)
  })

  test('stop() ends a pending retry and start() never rejects', async () => {
    let clock = 0
    const registration = createMcpCatalogRegistration({
      catalog,
      oxy: { getServiceToken: async () => { throw new Error('credentials unavailable') }, invalidateServiceToken: () => {} } as never,
      oxyApiBase: 'https://api.oxy.test',
      deps: {
        now: () => clock,
        sleep: (ms, signal) => new Promise<void>((resolve) => {
          clock += ms
          signal.addEventListener('abort', () => resolve(), { once: true })
        }),
        log: () => {},
        error: () => {},
      },
    })
    const done = registration.start()
    await Bun.sleep(0)
    expect(registration.status().state).toBe('retrying')
    registration.stop()
    await expect(done).resolves.toBeUndefined()
  })
})

describe('helpers', () => {
  test('canonical JSON ignores key order', () => {
    expect(canonicalJson({ b: 1, a: { d: [1, { z: 1, y: 2 }], c: null } })).toBe('{"a":{"c":null,"d":[1,{"y":2,"z":1}]},"b":1}')
    expect(catalogHash({ a: 1, b: 2 })).toBe(catalogHash({ b: 2, a: 1 }))
  })

  test('Retry-After parsing', () => {
    const now = Date.parse('2026-09-17T10:00:00Z')
    expect(parseRetryAfter('30', now)).toBe(30_000)
    expect(parseRetryAfter('Thu, 17 Sep 2026 10:01:00 GMT', now)).toBe(60_000)
    expect(parseRetryAfter('Thu, 17 Sep 2026 09:00:00 GMT', now)).toBe(0)
    expect(parseRetryAfter('soon', now)).toBeNull()
    expect(parseRetryAfter(null, now)).toBeNull()
  })

  test('sanitizer masks bearer credentials and truncates', () => {
    const message = sanitizeErrorMessage(`Authorization: Bearer abc.def ${'y'.repeat(500)}`)
    expect(message).not.toContain('abc.def')
    expect(message.length).toBeLessThanOrEqual(200)
  })
})
