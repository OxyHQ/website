import type { PlatformActivityEvent } from '../../api/hooks'

export interface ActivityMotion {
  pulseDurationMs: number
  pulseLength: number
  pulseGap: number
  initialPhase: number
}

export function activityFlowKey(event: PlatformActivityEvent): string {
  return JSON.stringify([event.sourceRegion, event.targetRegion, event.sourceService, event.targetService, event.service, event.scope, event.direction, event.activityType])
}

/** Multiple reporting windows form one visual flow; counts are summed, never mirrored. */
export function activityFlows(events: PlatformActivityEvent[]): PlatformActivityEvent[] {
  const flows = new Map<string, PlatformActivityEvent>()
  for (const event of events) {
    const key = activityFlowKey(event)
    const previous = flows.get(key)
    if (!previous) { flows.set(key, { ...event }); continue }
    previous.requests += event.requests
    if (Date.parse(event.windowStartedAt) < Date.parse(previous.windowStartedAt)) previous.windowStartedAt = event.windowStartedAt
    if (Date.parse(event.emittedAt) > Date.parse(previous.emittedAt)) previous.emittedAt = event.emittedAt
  }
  return [...flows.values()]
}

/** Phase staggering is visual deconfliction, not an inferred request/response timeline. */
export function activityMotion(event: Pick<PlatformActivityEvent, 'requests' | 'windowStartedAt' | 'emittedAt'> & Partial<PlatformActivityEvent>, flowKey = '', now = Date.now()): ActivityMotion {
  const elapsed = Date.parse(event.emittedAt) - Date.parse(event.windowStartedAt)
  const windowMs = Number.isFinite(elapsed) ? Math.max(250, elapsed) : 250
  const requests = Number.isFinite(event.requests) ? Math.max(0, event.requests) : 0
  const rate = Math.max(0.2, requests / (windowMs / 1_000))
  const scale = Math.sqrt(rate)
  const pulseDurationMs = Math.max(420, Math.min(2_200, 1_800 / scale))
  const pulseLength = Math.max(0.025, Math.min(0.14, 0.1 / scale))
  // A single dashed geometry carries a bounded train instead of cloning tubes.
  const period = 1 / Math.min(4, Math.max(1, Math.round(scale)))
  let hash = 2166136261
  for (const character of flowKey) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619)
  const seed = (event.direction === 'outbound' ? 0.6 : 0.1) + ((hash >>> 0) % 1_000) / 4_000
  const timestamp = Date.parse(event.windowStartedAt)
  const age = Number.isFinite(timestamp) ? Math.max(0, now - timestamp) / pulseDurationMs : 0
  return { pulseDurationMs, pulseLength, pulseGap: period - pulseLength, initialPhase: ((age + seed * period) % period + period) % period }
}

/** Preserve the objects bound by three-globe, including its running shader phase. */
export function retainFlowObjects<T extends { id: string }>(cache: Map<string, T>, next: T[]): T[] {
  const active = new Set(next.map(item => item.id))
  for (const key of cache.keys()) if (!active.has(key)) cache.delete(key)
  return next.map(item => {
    const previous = cache.get(item.id)
    if (previous) { Object.assign(previous, item); return previous }
    cache.set(item.id, item)
    return item
  })
}
