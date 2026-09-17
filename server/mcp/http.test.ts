import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test'
import http from 'node:http'
import type { AddressInfo } from 'node:net'
import { db } from '../db/postgres.js'
import { newsroomPosts } from '../db/schema/index.js'
import { ensureApp } from '../test/app.js'
import { config } from '../config.js'
import { invokeTool, oxyService } from '../mcp.js'
import { countRows, errorCode, reader, resetDatabase } from '../test/helpers.js'

/* The MCP endpoint through the real Express composition: site CORS, the SDK's
   own origin/host checks, token introspection against a fake Oxy, the
   authorization policy, and the public-read bridge back into the same app. */

const RESOURCE = config.mcp.resource
const ISSUER = config.oxyApiBase
const BASE = `http://localhost:${config.port}`

interface FakeClaims {
  active: boolean
  sub?: string
  account_id?: string
  aud?: string
  resource?: string
  scope?: string
  iat?: number
  exp?: number
  connection?: Record<string, unknown>
}

const tokens = new Map<string, FakeClaims>()
let introspections = 0

function claims(account: string, overrides: Partial<FakeClaims> = {}): FakeClaims {
  const now = Math.floor(Date.now() / 1000)
  return {
    active: true,
    iss: ISSUER,
    sub: account,
    account_id: account,
    aud: 'website-api',
    resource: RESOURCE,
    client_id: 'test-client',
    scope: 'website.read website.write',
    jti: `jti-${account}-${Math.random()}`,
    iat: now,
    exp: now + 600,
    ...overrides,
  } as FakeClaims
}

let fakeOxy: http.Server
let app: http.Server

beforeAll(async () => {
  fakeOxy = http.createServer((req, res) => {
    let body = ''
    req.on('data', (chunk) => (body += chunk))
    req.on('end', () => {
      if (req.url !== '/auth/mcp/oauth/introspect' || req.headers.authorization !== 'Bearer service-token') {
        res.writeHead(401).end()
        return
      }
      introspections += 1
      const { token } = JSON.parse(body) as { token: string }
      res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(tokens.get(token) ?? { active: false }))
    })
  })
  await new Promise<void>((resolve) => fakeOxy.listen(Number(process.env.TEST_FAKE_OXY_PORT), 'localhost', resolve))

  oxyService.getServiceToken = async () => 'service-token'
  oxyService.invalidateServiceToken = () => undefined

  // All interfaces, as in production: the public-read bridge calls 127.0.0.1,
  // while `localhost` may resolve to ::1 on the runner.
  app = await ensureApp()
})

afterAll(async () => {
  app.closeIdleConnections()
  fakeOxy.closeAllConnections()
  await new Promise<void>((resolve) => fakeOxy.close(() => resolve()))
})

beforeEach(async () => {
  await resetDatabase()
  tokens.clear()
  tokens.set('admin', claims('admin-account'))
  tokens.set('reader', claims('reader-account'))
  introspections = 0
})

let rpcId = 0
async function callTool(name: string, args: Record<string, unknown>, token?: string, headers: Record<string, string> = {}) {
  const response = await fetch(`${BASE}/mcp`, {
    method: 'POST',
    headers: {
      accept: 'application/json, text/event-stream',
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: ++rpcId, method: 'tools/call', params: { name, arguments: args } }),
  })
  const text = await response.text()
  let json: { result?: { isError?: boolean; content?: { text: string }[]; structuredContent?: Record<string, unknown> }; error?: { message: string } } | undefined
  try {
    json = JSON.parse(text)
  } catch {
    json = undefined
  }
  return { response, json, text }
}

describe('transport composition', () => {
  test('no token: 401 with a challenge that points at the resource metadata', async () => {
    const { response } = await callTool('list_pages', {})
    expect(response.status).toBe(401)
    expect(response.headers.get('www-authenticate')).toContain('resource_metadata=')
  })

  test('a Claude browser origin reaches the MCP transport, gets CORS headers and can read the challenge', async () => {
    const { response } = await callTool('list_pages', {}, undefined, { origin: 'https://claude.ai' })
    expect(response.status).toBe(401)
    expect(response.headers.get('access-control-allow-origin')).toBe('https://claude.ai')
    expect(response.headers.get('access-control-expose-headers')).toContain('WWW-Authenticate')
  })

  test('preflight from a Claude origin is answered by the MCP policy', async () => {
    const response = await fetch(`${BASE}/mcp`, {
      method: 'OPTIONS',
      headers: { origin: 'https://claude.ai', 'access-control-request-method': 'POST', 'access-control-request-headers': 'authorization, content-type, mcp-protocol-version' },
    })
    expect(response.status).toBe(204)
    expect(response.headers.get('access-control-allow-origin')).toBe('https://claude.ai')
    expect(response.headers.get('access-control-allow-headers')).toContain('Authorization')
  })

  test('a forbidden origin is refused with 403 on MCP and on the site API, never a 500', async () => {
    const mcp = await callTool('list_pages', {}, 'admin', { origin: 'https://evil.test' })
    expect(mcp.response.status).toBe(403)
    const site = await fetch(`${BASE}/api/hero`, { headers: { origin: 'https://evil.test' } })
    expect(site.status).toBe(403)
    const preflight = await fetch(`${BASE}/api/hero`, { method: 'OPTIONS', headers: { origin: 'https://evil.test', 'access-control-request-method': 'PUT' } })
    expect(preflight.status).toBe(403)
  })

  test('the site API keeps serving its own origins', async () => {
    const response = await fetch(`${BASE}/api/hero`, { headers: { origin: 'https://site.test' } })
    expect(response.status).toBe(200)
    expect(response.headers.get('access-control-allow-origin')).toBe('https://site.test')
  })

  test('protected resource metadata names this resource and Oxy', async () => {
    const response = await fetch(`${BASE}/.well-known/oauth-protected-resource/mcp`)
    expect(response.status).toBe(200)
    const body = await response.json() as { resource: string; authorization_servers: string[] }
    expect(body.resource).toBe(RESOURCE)
    expect(body.authorization_servers).toContain(ISSUER)
  })

  test('calls are stateless: consecutive calls need no session and each is introspected', async () => {
    const first = await callTool('create_course', { title: 'One' }, 'admin')
    const second = await callTool('create_course', { title: 'Two' }, 'admin')
    expect(first.response.status).toBe(200)
    expect(second.response.status).toBe(200)
    expect(first.response.headers.get('mcp-session-id')).toBeNull()
    expect(introspections).toBe(2)
    expect(await countRows('courses')).toBe(2)
  })
})

describe('authorization never runs the handler for a refused call', () => {
  const refusedTokens: [string, Partial<FakeClaims>][] = [
    ['revoked', { active: false }],
    ['expired', { iat: Math.floor(Date.now() / 1000) - 1000, exp: Math.floor(Date.now() / 1000) - 400 }],
    ['wrong resource', { resource: 'https://elsewhere.test/mcp' }],
    ['wrong audience', { aud: 'another-app' }],
  ]

  for (const [label, overrides] of refusedTokens) {
    test(`${label} token → 401, nothing written`, async () => {
      tokens.set('bad', claims('admin-account', overrides))
      const { response } = await callTool('create_course', { title: 'Nope' }, 'bad')
      expect(response.status).toBe(401)
      expect(await countRows('courses')).toBe(0)
    })
  }

  test('an admin token without website.write cannot write', async () => {
    tokens.set('read-only', claims('admin-account', { scope: 'website.read' }))
    const { json } = await callTool('create_course', { title: 'Nope' }, 'read-only')
    expect(json?.result?.isError ?? Boolean(json?.error)).toBe(true)
    expect(await countRows('courses')).toBe(0)
  })

  test('a non-admin with both scopes cannot write', async () => {
    const { json } = await callTool('create_course', { title: 'Nope' }, 'reader')
    expect(json?.result?.isError ?? Boolean(json?.error)).toBe(true)
    expect(JSON.stringify(json)).toContain('only available to website admins')
    expect(await countRows('courses')).toBe(0)
  })

  test('a connection judged on its ACTIVE account: admin origin acting as a reader cannot write', async () => {
    tokens.set('switched', claims('admin-account', {
      connection: {
        connection_id: 'conn-1',
        origin_account_id: 'admin-account',
        active_account_id: 'reader-account',
        accounts: [
          { account_id: 'admin-account', is_origin: true, linked_at: new Date().toISOString() },
          { account_id: 'reader-account', is_origin: false, linked_at: new Date().toISOString() },
        ],
      },
    }))
    const { json } = await callTool('create_course', { title: 'Nope' }, 'switched')
    expect(json?.result?.isError ?? Boolean(json?.error)).toBe(true)
    expect(await countRows('courses')).toBe(0)
  })

  test('the admin with both scopes writes, and the tool result is structured', async () => {
    const { json } = await callTool('create_course', { title: 'Yes' }, 'admin')
    expect(json?.result?.isError).toBeUndefined()
    expect(json?.result?.structuredContent?._id).toMatch(/^[0-9a-f]{24}$/)
    expect(await countRows('courses')).toBe(1)
  })
})

describe('readers get exactly what the public site serves', () => {
  test('drafts are refused, not silently dropped', async () => {
    expect(errorCode(await invokeTool('list_posts', { status: 'draft' }, reader))).toBe('permission_denied')
  })

  test('a draft post is invisible to a reader and visible to an admin', async () => {
    await db.insert(newsroomPosts).values({ title: 'Secret', slug: 'secret', status: 'draft' })
    expect(errorCode(await invokeTool('get_post', { slug: 'secret' }, reader))).toBe('not_found')
    const { json } = await callTool('get_post', { slug: 'secret' }, 'admin')
    expect(json?.result?.isError).toBeUndefined()
  })

  test('admin-only reads are refused to readers over the transport', async () => {
    const { json } = await callTool('list_media', {}, 'reader')
    expect(json?.result?.isError ?? Boolean(json?.error)).toBe(true)
  })
})

describe('protocol revisions', () => {
  // The installed transport (@modelcontextprotocol/sdk 1.30) speaks up to
  // 2025-11-25. 2026-07-28 is not supported yet; a client announcing it must get
  // a clear refusal, not a half-working session.
  for (const version of ['2025-11-25', '2025-06-18', '2025-03-26']) {
    test(`${version} is accepted`, async () => {
      const { response, json } = await callTool('describe_access', {}, 'reader', { 'mcp-protocol-version': version })
      expect(response.status).toBe(200)
      expect(json?.result?.isError).toBeUndefined()
    })
  }

  test('an unsupported revision is refused with 400', async () => {
    const { response, text } = await callTool('describe_access', {}, 'reader', { 'mcp-protocol-version': '2026-07-28' })
    expect(response.status).toBe(400)
    expect(text).toMatch(/protocol version/i)
  })
})

describe('structured results through the transport', () => {
  test('a paginated read passes the SDK\'s own output schema check', async () => {
    const { json } = await callTool('list_posts', { limit: 5 }, 'admin')
    expect(json?.result?.isError).toBeUndefined()
    expect(json?.result?.structuredContent).toMatchObject({ posts: [], total: 0, page: 1, pages: 0 })
  })

  test('an array read arrives as { items }', async () => {
    const { json } = await callTool('list_jobs', {}, 'reader')
    expect(Array.isArray((json?.result?.structuredContent as { items: unknown[] }).items)).toBe(true)
  })
})

describe('two tasks, no session affinity', () => {
  let second: http.Server

  beforeAll(async () => {
    const { createApp } = await import('../app.js')
    const { disabledMcpCatalogRegistrationStatus } = await import('../services/mcpCatalogRegistration.js')
    second = createApp({ catalogRegistrationStatus: () => disabledMcpCatalogRegistrationStatus() }).listen(0)
    await new Promise<void>((resolve) => second.once('listening', resolve))
  })

  afterAll(async () => {
    second.closeAllConnections()
    await new Promise<void>((resolve) => second.close(() => resolve()))
  })

  /** A call to either task, addressed to the public resource host as a load balancer would. */
  function callOn(server: http.Server, name: string, args: Record<string, unknown>, token: string) {
    return new Promise<{ status: number; body: { result?: { isError?: boolean; structuredContent?: Record<string, unknown> } } }>((resolve, reject) => {
      const payload = JSON.stringify({ jsonrpc: '2.0', id: ++rpcId, method: 'tools/call', params: { name, arguments: args } })
      const req = http.request({
        host: '127.0.0.1',
        port: (server.address() as AddressInfo).port,
        path: '/mcp',
        method: 'POST',
        agent: false,
        headers: {
          host: new URL(RESOURCE).host,
          authorization: `Bearer ${token}`,
          accept: 'application/json, text/event-stream',
          'content-type': 'application/json',
          'content-length': Buffer.byteLength(payload),
          connection: 'close',
        },
      }, (res) => {
        let text = ''
        res.on('data', (chunk) => (text += chunk))
        res.on('end', () => resolve({ status: res.statusCode ?? 0, body: JSON.parse(text) }))
      })
      req.on('error', reject)
      req.end(payload)
    })
  }

  test('consecutive calls alternate between tasks and all succeed', async () => {
    for (const [index, server] of [app, second, app, second].entries()) {
      const { status, body } = await callOn(server, 'create_course', { title: `Course ${index}` }, 'admin')
      expect([index, status, body.result?.isError]).toEqual([index, 200, undefined])
    }
    expect(await countRows('courses')).toBe(4)
  })

  test('a retry that lands on the other task replays instead of writing twice', async () => {
    const first = await callOn(app, 'create_course', { title: 'Once', idempotencyKey: 'cross-task-0001' }, 'admin')
    const retry = await callOn(second, 'create_course', { title: 'Once', idempotencyKey: 'cross-task-0001' }, 'admin')
    expect(retry.body.result?.structuredContent?._id).toBe(first.body.result?.structuredContent?._id)
    expect(await countRows('courses')).toBe(1)
  })

  test('the usage limit is shared by both tasks', async () => {
    const previous = config.mcp.rateLimitPerMinute
    config.mcp.rateLimitPerMinute = 3
    try {
      const results = []
      for (const server of [app, second, app, second]) results.push(await callOn(server, 'list_jobs', {}, 'reader'))
      expect(results.map((result) => result.body.result?.isError ?? false)).toEqual([false, false, false, true])
      expect(JSON.stringify(results[3].body)).toContain('rate_limited')
      // Another account has its own allowance.
      expect((await callOn(second, 'list_jobs', {}, 'admin')).body.result?.isError).toBeUndefined()
    } finally {
      config.mcp.rateLimitPerMinute = previous
    }
  })
})

// Last: responses sent before the request body is read, or for a foreign Host,
// can leave a pooled client connection unusable for the next test.
describe('connection-level refusals', () => {
  test('an oversized body is refused before any tool runs', async () => {
    const response = await fetch(`${BASE}/mcp`, {
      method: 'POST',
      headers: { authorization: 'Bearer admin', 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'create_course', arguments: { title: 'x'.repeat(5 * 1024 * 1024) } } }),
    })
    expect(response.status).toBe(413)
    expect(await countRows('courses')).toBe(0)
  })

  test('a request for another host is refused', async () => {
    const status = await new Promise<number>((resolve, reject) => {
      const address = app.address() as AddressInfo
      const req = http.request({ host: '127.0.0.1', port: address.port, path: '/mcp', method: 'POST', agent: false, headers: { host: 'other.test', 'content-type': 'application/json', 'content-length': '2', connection: 'close' } }, (res) => {
        res.resume()
        resolve(res.statusCode ?? 0)
      })
      req.on('error', reject)
      req.end('{}')
    })
    expect(status).toBe(421)
  })
})
