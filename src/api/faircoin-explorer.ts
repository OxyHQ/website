/**
 * Read-only client for the public FairCoin Explorer REST API.
 *
 * Used by the landing page "live network" tiles. The explorer exposes
 * lightweight cached endpoints at https://explorer.fairco.in/api — these are
 * suitable for client-side polling at 15-30s cadence. We do not authenticate.
 */
const DEFAULT_EXPLORER_BASE = 'https://explorer.fairco.in'

function getExplorerBase(): string {
  const override =
    (import.meta.env.VITE_FAIRCOIN_EXPLORER_URL as string | undefined) ?? ''
  return override.length > 0 ? override : DEFAULT_EXPLORER_BASE
}

export interface ExplorerStats {
  blockHeight: number
  difficulty: number
  /** Network hashrate in H/s. Undefined while < block 10000 (PoW phase only). */
  hashrate: number
  /** Total emitted FAIR (whole units). */
  totalSupply: number
  circulatingSupply: number
  avgBlockTimeSeconds: number
  memPoolSize: number
  totalTransactions: number
  masternodeCount: number
  /** Connections to the explorer's full node — proxy for liveness. */
  connections: number
  phase: string
  lastBlock: {
    height: number
    hash: string
    /** Unix seconds. */
    time: number
    size: number
  }
}

interface ExplorerStatsBody {
  stats?: {
    blockHeight?: number
    difficulty?: number
    hashrate?: number
    totalSupply?: number
    circulatingSupply?: number
    avgBlockTime?: number
    memPoolSize?: number
    totalTransactions?: number
    masternodeCount?: number
    connections?: number
    phase?: string
    lastBlock?: {
      height?: number
      hash?: string
      time?: number
      size?: number
    }
  }
}

function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback
}

export async function fetchExplorerStats(): Promise<ExplorerStats> {
  const res = await fetch(`${getExplorerBase()}/api/stats`)
  if (!res.ok) throw new Error(`Explorer stats request failed: ${res.status}`)
  const body = (await res.json()) as ExplorerStatsBody
  const s = body.stats ?? {}
  const last = s.lastBlock ?? {}
  return {
    blockHeight: num(s.blockHeight),
    difficulty: num(s.difficulty),
    hashrate: num(s.hashrate),
    totalSupply: num(s.totalSupply),
    circulatingSupply: num(s.circulatingSupply),
    avgBlockTimeSeconds: num(s.avgBlockTime, 120),
    memPoolSize: num(s.memPoolSize),
    totalTransactions: num(s.totalTransactions),
    masternodeCount: num(s.masternodeCount),
    connections: num(s.connections),
    phase: typeof s.phase === 'string' ? s.phase : 'PoW',
    lastBlock: {
      height: num(last.height),
      hash: typeof last.hash === 'string' ? last.hash : '',
      time: num(last.time),
      size: num(last.size),
    },
  }
}
