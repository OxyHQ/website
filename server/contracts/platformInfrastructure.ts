export interface InfrastructureSnapshot {
  emittedAt: string
  nodes: Array<{
    region: string
    label: string
    coordinates: [number, number]
    services: string[]
    instances: number
    status: 'online' | 'degraded' | 'offline' | 'unknown'
  }>
}

export function parseInfrastructureSnapshot(value: unknown): InfrastructureSnapshot | null {
  if (!value || typeof value !== 'object') return null
  const snapshot = value as InfrastructureSnapshot
  if (typeof snapshot.emittedAt !== 'string' || !Number.isFinite(Date.parse(snapshot.emittedAt))
    || !Array.isArray(snapshot.nodes) || snapshot.nodes.length > 512) return null
  const regions = new Set<string>()
  for (const node of snapshot.nodes) {
    if (!node || typeof node.region !== 'string' || regions.has(node.region)
      || typeof node.label !== 'string' || !Array.isArray(node.coordinates) || node.coordinates.length !== 2
      || !node.coordinates.every(Number.isFinite) || Math.abs(node.coordinates[0]) > 180 || Math.abs(node.coordinates[1]) > 90
      || !Array.isArray(node.services) || !node.services.every(service => typeof service === 'string')
      || !Number.isSafeInteger(node.instances) || node.instances < 0
      || !['online', 'degraded', 'offline', 'unknown'].includes(node.status)) return null
    regions.add(node.region)
  }
  return snapshot
}
