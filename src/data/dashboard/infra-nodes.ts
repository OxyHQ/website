export interface InfraNode {
  region: string
  label: string
  coordinates: [number, number] // [lon, lat]
  services: string[]
}

export const INFRA_NODES: InfraNode[] = [
  {
    region: "ams3",
    label: "Amsterdam",
    coordinates: [4.9041, 52.3676],
    services: ["oxy-api", "mention", "allo", "tnp", "homiio", "db-oxy", "db-mention", "db-allo"],
  },
  {
    region: "lon1",
    label: "London",
    coordinates: [-0.1275, 51.5072],
    services: ["cdn-eu"],
  },
  {
    region: "nyc1",
    label: "New York",
    coordinates: [-74.006, 40.7128],
    services: ["cdn-us"],
  },
]
