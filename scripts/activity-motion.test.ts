import { describe, expect, test } from 'bun:test'
import { activityMotion, activityFlows, activityFlowKey, retainFlowObjects } from '../src/data/dashboard/activity-motion'
import { activityRoute } from '../src/data/dashboard/activity-routes'
import type { PlatformActivityEvent } from '../src/api/platformActivityStore'

const emittedAt = '2026-09-10T00:00:02.000Z'
const windowStartedAt = '2026-09-10T00:00:00.000Z'
const base: PlatformActivityEvent = { service: 'oxy-api', region: 'us-west-2', sourceRegion: 'edge-mad', targetRegion: 'us-west-2', direction: 'inbound', scope: 'external', activityType: 'media', requests: 2, emittedAt, windowStartedAt }

describe('activityMotion', () => {
  test('makes higher request rates denser, shorter and faster in a single train', () => {
    const quiet = activityMotion({ ...base, requests: 1 })
    const busy = activityMotion({ ...base, requests: 10 })
    expect(busy.pulseGap).toBeLessThan(quiet.pulseGap)
    expect(busy.pulseLength).toBeLessThan(quiet.pulseLength)
    expect(busy.pulseDurationMs).toBeLessThan(quiet.pulseDurationMs)
  })
  test('bounds rendering work and handles malformed counts/windows', () => {
    const motion = activityMotion({ ...base, requests: 1_000_000 })
    expect(motion.pulseGap + motion.pulseLength).toBe(0.25)
    expect(motion.pulseLength).toBe(0.025)
    expect(motion.pulseDurationMs).toBe(420)
    const invalid = activityMotion({ ...base, requests: NaN, windowStartedAt: 'invalid' })
    expect(Object.values(invalid).every(Number.isFinite)).toBe(true)
  })
  test('uses stable flow identity and consolidates windows without creating a reverse flow', () => {
    const next = { ...base, requests: 3, emittedAt: '2026-09-10T00:00:04.000Z' }
    expect(activityFlowKey(base)).toBe(activityFlowKey(next))
    const flows = activityFlows([base, next])
    expect(flows).toHaveLength(1)
    expect(flows[0].requests).toBe(5)
    expect(flows[0].sourceRegion).toBe('edge-mad')
    expect(flows[0].targetRegion).toBe('us-west-2')
    expect(base.requests).toBe(2)
  })
  test('keeps real source to target orientation and staggers paired directions', () => {
    const response = { ...base, direction: 'outbound' as const, sourceRegion: base.targetRegion, targetRegion: base.sourceRegion }
    expect(activityRoute(base)?.source).toEqual(activityRoute(response)?.target)
    expect(activityRoute(base)?.target).toEqual(activityRoute(response)?.source)
    const now = Date.parse(emittedAt)
    const inbound = activityMotion(base, activityFlowKey(base), now)
    const outbound = activityMotion(response, activityFlowKey(response), now)
    const period = inbound.pulseLength + inbound.pulseGap
    const difference = Math.abs(inbound.initialPhase - outbound.initialPhase)
    expect(Math.min(difference, period - difference)).toBeGreaterThan(period * 0.25)
    expect(activityFlows([base, response])).toHaveLength(2)
  })
  test('phase advances with time and shader-bound objects survive new buckets', () => {
    const first = activityMotion(base, activityFlowKey(base), Date.parse(windowStartedAt))
    const second = activityMotion(base, activityFlowKey(base), Date.parse(windowStartedAt) + first.pulseDurationMs * 0.1)
    const period = first.pulseLength + first.pulseGap
    expect((second.initialPhase - first.initialPhase + period) % period).toBeCloseTo(0.1, 8)
    const cache = new Map<string, { id: string; requests: number; shaderPhase?: number }>()
    const [object] = retainFlowObjects(cache, [{ id: activityFlowKey(base), requests: 2 }])
    object.shaderPhase = 0.71
    const [updated] = retainFlowObjects(cache, [{ id: activityFlowKey(base), requests: 5 }])
    expect(updated).toBe(object)
    expect(updated.shaderPhase).toBe(0.71)
    expect(updated.requests).toBe(5)
    retainFlowObjects(cache, [])
    expect(cache.size).toBe(0)
  })
})
