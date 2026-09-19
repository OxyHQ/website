import type { PlatformActivityEvent } from './platformActivityStore'

export const ACTIVITY_WINDOW_MS = 60_000
const MAX_ACTIVITY_FLOWS = 512

// Keep each flow's latest aggregate. A busy service must not evict a quieter
// country's origin simply by sending twenty updates in a row.
export function activityWindow(
  events: PlatformActivityEvent[],
  now = Date.now(),
): PlatformActivityEvent[] {
  const flows = new Map<string, PlatformActivityEvent>()
  for (const event of events) {
    const emittedAt = Date.parse(event.emittedAt)
    if (!Number.isFinite(emittedAt) || now - emittedAt >= ACTIVITY_WINDOW_MS || emittedAt > now + 5_000) continue
    const key = JSON.stringify([event.sourceRegion ?? '', event.targetRegion ?? event.region, event.service ?? '', event.scope, event.direction, event.activityType, event.sourceService, event.targetService])
    const previous = flows.get(key)
    if (!previous || emittedAt >= Date.parse(previous.emittedAt)) flows.set(key, event)
  }
  return [...flows.values()]
    .sort((left, right) => Date.parse(left.emittedAt) - Date.parse(right.emittedAt))
    .slice(-MAX_ACTIVITY_FLOWS)
}
