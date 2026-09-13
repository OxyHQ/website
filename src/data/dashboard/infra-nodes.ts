export interface InfraNode {
  region: string
  label: string
  coordinates: [number, number] // [lon, lat]
  services: string[]
}

export const INFRA_NODES: InfraNode[] = [
  {
    region: "us-west-2",
    label: "Oregon",
    coordinates: [-122.6765, 45.5231],
    services: [],
  },
]

// A received snapshot is authoritative, including an empty one (all nodes
// removed). Defaults are only the initial, unconfirmed infrastructure map.
export function infrastructureNodes(snapshot?: Array<{
  region: string
  label?: string
  coordinates?: [number, number]
  services?: string[]
}>): InfraNode[] {
  if (!snapshot) return INFRA_NODES
  return snapshot.flatMap(node => {
    const known = INFRA_NODES.find(candidate => candidate.region === node.region)
    const coordinates = node.coordinates ?? known?.coordinates
    if (!coordinates || !coordinates.every(Number.isFinite) || Math.abs(coordinates[0]) > 180 || Math.abs(coordinates[1]) > 90) return []
    return [{ region: node.region, label: node.label ?? known?.label ?? node.region, coordinates, services: node.services ?? known?.services ?? [] }]
  })
}
