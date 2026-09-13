import type { PlatformActivityEvent } from '../../api/platformActivityStore'
import type { InfraNode } from './infra-nodes'
import { activityRegionCoordinates } from './activity-regions'
import { ACTIVITY_CATEGORIES, activityCategory } from './activity-categories'

// Source and target always describe the actual movement. Direction is relative
// to the reporting service, independently of whether the peer is internal.
export function activityRoute(event: PlatformActivityEvent, infrastructure?: InfraNode[]) {
  if (!event.sourceRegion || !event.targetRegion || event.requests <= 0) return null
  const coordinates = (region: string, explicit?: [number, number]) => {
    if (region.startsWith('edge-')) return explicit ?? activityRegionCoordinates(region)
    if (infrastructure) return infrastructure.find(node => node.region === region)?.coordinates
    return explicit ?? activityRegionCoordinates(region)
  }
  const source = coordinates(event.sourceRegion, event.sourceCoordinates)
  const target = coordinates(event.targetRegion, event.targetCoordinates)
  if (!source || !target) return null
  return {
    source, target,
    local: source[0] === target[0] && source[1] === target[1],
    internal: event.scope === 'internal' || event.direction === 'internal',
    outbound: event.direction === 'outbound',
    category: ACTIVITY_CATEGORIES.find(category => category.id === event.activityType)?.id ?? activityCategory(event.service),
    key: JSON.stringify([event.sourceRegion, event.targetRegion, event.sourceService, event.targetService, event.service, event.scope, event.direction, event.activityType, event.emittedAt]),
  }
}
