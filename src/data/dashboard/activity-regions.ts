import { INFRA_NODES } from './infra-nodes'

type Coordinates = [number, number]

// Coarse locations of network edge datacentres. These describe the serving
// PoP encoded in CF-Ray; they are not inferred from or tied to a user's IP.
const EDGE_COORDINATES: Record<string, Coordinates> = {
  ams: [4.9041, 52.3676], bcn: [2.1734, 41.3851], bom: [72.8777, 19.076],
  cdg: [2.3522, 48.8566], del: [77.1025, 28.7041], dub: [-6.2603, 53.3498],
  dxb: [55.2708, 25.2048], eze: [-58.3816, -34.6037], fra: [8.6821, 50.1109],
  gru: [-46.6333, -23.5505], hkg: [114.1694, 22.3193], iad: [-77.0369, 38.9072],
  jnb: [28.0473, -26.2041], lax: [-118.2437, 34.0522], lhr: [-0.1276, 51.5072],
  lis: [-9.1393, 38.7223], mad: [-3.7038, 40.4168], mel: [144.9631, -37.8136],
  mex: [-99.1332, 19.4326], mia: [-80.1918, 25.7617], mrs: [5.3698, 43.2965],
  nrt: [139.6917, 35.6895], ord: [-87.6298, 41.8781], sea: [-122.3321, 47.6062],
  otp: [26.1025, 44.4268],
  sfo: [-122.4194, 37.7749], sin: [103.8198, 1.3521], sof: [23.3219, 42.6977],
  syd: [151.2093, -33.8688],
}

export function activityRegionCoordinates(region: string): Coordinates | undefined {
  const infrastructure = INFRA_NODES.find((node) => node.region === region)
  if (infrastructure) return infrastructure.coordinates
  if (!region.startsWith('edge-')) return undefined
  return EDGE_COORDINATES[region.slice(5).toLowerCase()]
}
