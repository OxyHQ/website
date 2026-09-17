import { afterAll, beforeAll, describe, expect, setSystemTime, spyOn, test } from 'bun:test'
import type { JobPosting } from '@clarity.surf/sdk'
import { getCareerJob, listCareerJobs } from './careers.js'
import { oxyService } from './oxyService.js'

/* The careers page's only source is Clarity. These pin what the site asks for,
   what it refuses to show even when Clarity returns it, and what a visitor sees
   while Clarity is down. */

function listing(id: string, overrides: Partial<JobPosting> = {}): JobPosting {
  const source = { type: 'first_party' as const, domain: 'mention.earth', canonicalUrl: `https://mention.earth/jobs/${id}`, documentId: `doc-${id}`, firstSeenAt: '2026-09-01T00:00:00Z', lastSeenAt: '2026-09-01T00:00:00Z', status: 'active' as const }
  return {
    id,
    documentId: `doc-${id}`,
    canonicalUrl: source.canonicalUrl,
    title: `Role ${id}`,
    description: '## About\n\n- Build things',
    employer: { name: 'Oxy' },
    locations: [],
    applicantLocationRequirements: [],
    workplaceType: 'remote',
    employmentTypes: ['full_time'],
    skills: [],
    firstSeenAt: source.firstSeenAt,
    lastSeenAt: source.lastSeenAt,
    status: 'active',
    source,
    otherSources: [],
    evidence: {},
    ...overrides,
  }
}

const requests: Array<{ method: string; url: string; body?: Record<string, unknown>; authorization?: string | null }> = []
let respond: (url: URL, body?: Record<string, unknown>) => Response
const realFetch = globalThis.fetch
const start = new Date('2026-09-17T10:00:00Z')

beforeAll(() => {
  setSystemTime(start)
  spyOn(oxyService, 'getServiceToken').mockResolvedValue('service-token')
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input))
    const body = init?.body ? JSON.parse(String(init.body)) as Record<string, unknown> : undefined
    requests.push({ method: init?.method ?? 'GET', url: url.toString(), body, authorization: new Headers(init?.headers).get('authorization') })
    return respond(url, body)
  }) as typeof fetch
})

afterAll(() => {
  globalThis.fetch = realFetch
  setSystemTime()
})

const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } })

describe('careers from Clarity Jobs', () => {
  test('lists every page of Oxy openings and drops anything that is not one', async () => {
    respond = (_url, body) => body?.cursor
      ? json({ data: [listing('b'), listing('closed', { status: 'closed' })], mode: 'lexical' })
      : json({ data: [listing('a'), listing('impostor', { source: { ...listing('x').source, domain: 'evil.example' } })], nextCursor: 'page-2', mode: 'lexical' })

    const jobs = await listCareerJobs()

    expect(jobs.map((job) => job.id)).toEqual(['a', 'b'])
    expect(jobs[0]).not.toHaveProperty('evidence')
    expect(requests).toHaveLength(2)
    expect(requests[0]).toMatchObject({
      method: 'POST',
      url: 'https://api.clarity.surf/v1/jobs/search',
      authorization: 'Bearer service-token',
      body: { employers: ['Oxy'], sourceDomains: ['mention.earth'], limit: 50 },
    })
    expect(requests[1].body).toMatchObject({ cursor: 'page-2' })
  })

  test('serves the shared list without spending quota again', async () => {
    requests.length = 0
    expect((await listCareerJobs()).map((job) => job.id)).toEqual(['a', 'b'])
    expect(await getCareerJob('a')).toMatchObject({ id: 'a', title: 'Role a' })
    expect(requests).toHaveLength(0)
  })

  test('keeps serving the last list while Clarity is down', async () => {
    setSystemTime(new Date(start.getTime() + 6 * 60_000))
    requests.length = 0
    respond = () => json({ error: { code: 'unavailable', message: 'down', requestId: 'r' } }, 503)
    expect((await listCareerJobs()).map((job) => job.id)).toEqual(['a', 'b'])
    expect(requests).toHaveLength(1)
  })

  test('a single role is looked up by id and must still be an active Oxy opening', async () => {
    respond = (url) => {
      const id = url.pathname.split('/').pop()
      if (id === 'gone') return json({ error: { code: 'job_not_found', message: 'Job posting not found', requestId: 'r' } }, 404)
      if (id === 'foreign') return json(listing('foreign', { employer: { name: 'Someone Else' } }))
      return json(listing(id!))
    }
    expect(await getCareerJob('fresh')).toMatchObject({ id: 'fresh', canonicalUrl: 'https://mention.earth/jobs/fresh' })
    expect(await getCareerJob('gone')).toBeNull()
    expect(await getCareerJob('foreign')).toBeNull()
  })
})
