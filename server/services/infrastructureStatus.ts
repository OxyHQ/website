import { parseInfrastructureSnapshot } from '../contracts/platformInfrastructure.js'
import type { InfrastructureSnapshot } from '../contracts/platformInfrastructure.js'
export type InfraStatusNode = InfrastructureSnapshot['nodes'][number]

/** The same authoritative snapshot sent over the platform's public socket. */
export async function readInfrastructureStatus(baseURL: string, fetcher: typeof fetch = fetch): Promise<InfraStatusNode[]> {
  const response = await fetcher(new URL('/platform-infrastructure', baseURL), { signal: AbortSignal.timeout(4_000), cache: 'no-store' })
  if (!response.ok) throw new Error('Infrastructure snapshot unavailable')
  const snapshot = parseInfrastructureSnapshot(await response.json())
  if (!snapshot) throw new Error('Invalid infrastructure snapshot')
  return snapshot.nodes
}
