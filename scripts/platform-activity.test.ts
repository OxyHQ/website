import { describe, expect, test } from 'bun:test'
import { activityWindow } from '../src/api/platformActivityWindow'
import type { PlatformActivityEvent } from '../src/api/platformActivityStore'

const now = Date.parse('2026-09-13T10:00:00Z')
const event = (origin: string, age = 0): PlatformActivityEvent => ({
  region: 'us-west-2', targetRegion: 'us-west-2', sourceRegion: origin,
  service: 'dashboard', requests: 1, activeClients: 1,
  windowStartedAt: new Date(now - age - 2_000).toISOString(),
  emittedAt: new Date(now - age).toISOString(),
})

describe('dashboard activity window', () => {
  test('keeps a quiet VPN origin when another origin sends more than 20 updates', () => {
    const events = [event('edge-nrt', 30_000), ...Array.from({ length: 50 }, (_, i) => event('edge-mad', i * 100))]
    expect(activityWindow(events, now).map(e => e.sourceRegion)).toEqual(['edge-nrt', 'edge-mad'])
  })
  test('expires old origins without requiring new network traffic', () => {
    const events = [event('edge-mad')]
    expect(activityWindow(events, now + 59_999)).toHaveLength(1)
    expect(activityWindow(events, now + 60_000)).toHaveLength(0)
  })
  test('deduplicates replays and ignores out-of-order updates', () => {
    const latest = event('edge-nrt')
    expect(activityWindow([latest, latest, event('edge-nrt', 5_000)], now)).toEqual([latest])
  })
  test('retains different services and destinations and rejects invalid dates', () => {
    const first = event('edge-mad')
    expect(activityWindow([first, { ...first, service: 'messages' }, { ...first, targetRegion: 'eu-west-1' }, { ...first, emittedAt: 'invalid' }], now)).toHaveLength(3)
  })
})

import { activityRoute } from '../src/data/dashboard/activity-routes'
import { activityCategory } from '../src/data/dashboard/activity-categories'

describe('world traffic lines', () => {
  test('draws only the observed direction rather than fabricating a return trip', () => {
    const inbound = activityRoute({ ...event('edge-mad'), direction: 'inbound', scope: 'external' })!
    const outbound = activityRoute({ ...event('us-west-2'), targetRegion: 'edge-mad', direction: 'outbound', scope: 'external' })!
    expect(inbound.source).toEqual(outbound.target)
    expect(inbound.target).toEqual(outbound.source)
    expect(inbound.outbound).toBe(false)
    expect(outbound.outbound).toBe(true)
  })
  test('keeps internal movement between services in the same region', () => {
    const route = activityRoute({ ...event('us-west-2'), scope: 'internal', direction: 'outbound', sourceService: 'alia', targetService: 'oxy-api', activityType: 'ai' })!
    expect(route.local).toBe(true)
    expect(route.internal).toBe(true)
    expect(route.outbound).toBe(true)
    expect(route.category).toBe('ai')
  })
  test('preserves inbound/outbound, scope and media as independent flows', () => {
    const first = { ...event('us-west-2'), activityType: 'media' as const, scope: 'internal' as const, direction: 'inbound' as const }
    const events = activityWindow([first, { ...first, direction: 'outbound' }, { ...first, scope: 'external' }], now)
    expect(events).toHaveLength(3)
    expect(activityRoute(events[0])?.category).toBe('media')
    expect(new Set(events.map(e => activityRoute(e)!.key)).size).toBe(3)
  })
  test('recognizes file and media routes and does not invent an unknown location', () => {
    for (const service of ['files', 'assets', 'cdn', 'uploads', 'images', 'videos', 'audio']) expect(activityCategory(service)).toBe('media')
    expect(activityRoute(event('unknown'))).toBeNull()
  })
})

import { infrastructureNodes } from '../src/data/dashboard/infra-nodes'

describe('live infrastructure on the world map', () => {
  test('adds a new region from the received snapshot without a frontend release', () => {
    const nodes = infrastructureNodes([{ region: 'new-region-1', label: 'New region', coordinates: [25, 50], services: ['mention'] }])
    expect(nodes).toHaveLength(1)
    expect(activityRoute({ ...event('edge-mad'), targetRegion: 'new-region-1' }, nodes)?.target).toEqual([25, 50])
  })
  test('removes infrastructure and its stale lines after an empty snapshot', () => {
    const nodes = infrastructureNodes([])
    expect(nodes).toEqual([])
    expect(activityRoute(event('edge-mad'), nodes)).toBeNull()
  })
})
