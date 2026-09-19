import { describe, expect, test } from 'bun:test'
import { readInfrastructureStatus, type InfraStatusNode } from '../server/services/infrastructureStatus'

describe('dashboard infrastructure snapshot', () => {
  test('uses the live inventory, including an empty snapshot after removal', async () => {
    const nodes: InfraStatusNode[] = [{ region: 'eu-central-1', label: 'Frankfurt', coordinates: [8.68, 50.11], services: ['mention'], instances: 2, status: 'online' }]
    const fetcher = (async () => Response.json({ nodes, emittedAt: new Date().toISOString() })) as unknown as typeof fetch
    expect(await readInfrastructureStatus('https://api.oxy.so', fetcher)).toEqual(nodes)
    expect(await readInfrastructureStatus('https://api.oxy.so', (async () => Response.json({ nodes: [], emittedAt: new Date().toISOString() })) as unknown as typeof fetch)).toEqual([])
  })
  test('does not manufacture healthy nodes during an upstream outage', async () => {
    await expect(readInfrastructureStatus('https://api.oxy.so', (async () => new Response('', { status: 503 })) as unknown as typeof fetch)).rejects.toThrow('unavailable')
    await expect(readInfrastructureStatus('https://api.oxy.so', (async () => Response.json({})) as unknown as typeof fetch)).rejects.toThrow('Invalid')
  })
})

test('rejects invalid coordinates and duplicate regions from the upstream snapshot', async () => {
  const node = { region: 'us-west-2', label: 'Oregon', coordinates: [-122, 45], services: ['oxy-api'], instances: 1, status: 'online' }
  for (const nodes of [[{ ...node, coordinates: [0, 91] }], [node, node]]) {
    const fetcher = (async () => Response.json({ nodes, emittedAt: new Date().toISOString() })) as unknown as typeof fetch
    await expect(readInfrastructureStatus('https://api.oxy.so', fetcher)).rejects.toThrow('Invalid')
  }
})
