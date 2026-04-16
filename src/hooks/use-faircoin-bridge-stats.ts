/**
 * Live bridge + chain stats for the FairCoin marketing pages.
 *
 * - Reserves: pulls the bridge custody snapshot (WFAIR supply on Base vs FAIR
 *   custodied on the FairCoin chain) so the landing/bridge pages can show a
 *   live peg health indicator.
 * - Health: hits the bridge `/health` probe so the bridge page can show
 *   uptime status on the dashboard tile.
 *
 * The bridge `/api/bridge/reserves` endpoint can return 503 until the first
 * snapshot is recorded — we treat that as "no data yet" rather than an error
 * so the UI can render a graceful placeholder.
 */
import { useQuery } from '@tanstack/react-query'

const DEFAULT_BRIDGE_BASE_URL = 'https://bridge.fairco.in'

function getBridgeBaseUrl(): string {
  const override = (import.meta.env.VITE_FAIRCOIN_BRIDGE_URL as string | undefined) ?? ''
  return override.length > 0 ? override : DEFAULT_BRIDGE_BASE_URL
}

const REFETCH_INTERVAL_MS = 30_000

export interface BridgeReserves {
  /** WFAIR supply on Base (in raw wei strings). */
  wfairSupplyWei: string
  /** Native FAIR held by the bridge (in raw sats strings). */
  fairCustodySats: string
  /** Snapshot wall-clock. */
  snapshotAt: string
  /** True when WFAIR supply ≤ FAIR custody (peg is fully backed). */
  pegHealthy: boolean
}

interface ReservesApiBody {
  wfairSupplyWei?: string
  fairCustodySats?: string
  snapshotAt?: string
  pegHealthy?: boolean
}

async function fetchReserves(): Promise<BridgeReserves | null> {
  const res = await fetch(`${getBridgeBaseUrl()}/api/bridge/reserves`)
  if (res.status === 503) return null
  if (!res.ok) throw new Error(`Reserves request failed: ${res.status}`)
  const body = (await res.json()) as ReservesApiBody
  if (
    typeof body.wfairSupplyWei !== 'string' ||
    typeof body.fairCustodySats !== 'string' ||
    typeof body.snapshotAt !== 'string'
  ) {
    return null
  }
  return {
    wfairSupplyWei: body.wfairSupplyWei,
    fairCustodySats: body.fairCustodySats,
    snapshotAt: body.snapshotAt,
    pegHealthy: body.pegHealthy === true,
  }
}

export function useBridgeReserves() {
  return useQuery<BridgeReserves | null, Error>({
    queryKey: ['faircoin-bridge-reserves'],
    queryFn: fetchReserves,
    refetchInterval: REFETCH_INTERVAL_MS,
    refetchIntervalInBackground: false,
    staleTime: 15_000,
    retry: 1,
  })
}

export interface BridgeHealth {
  ok: boolean
  service?: string
  uptimeSeconds?: number
}

interface HealthApiBody {
  ok?: boolean
  status?: string
  service?: string
  uptime?: number
  uptimeSeconds?: number
}

async function fetchHealth(): Promise<BridgeHealth> {
  try {
    const res = await fetch(`${getBridgeBaseUrl()}/health`)
    if (!res.ok) return { ok: false }
    const body = (await res.json()) as HealthApiBody
    return {
      ok: body.ok === true || body.status === 'ok',
      service: body.service,
      uptimeSeconds: body.uptimeSeconds ?? body.uptime,
    }
  } catch {
    return { ok: false }
  }
}

export function useBridgeHealth() {
  return useQuery<BridgeHealth, Error>({
    queryKey: ['faircoin-bridge-health'],
    queryFn: fetchHealth,
    refetchInterval: REFETCH_INTERVAL_MS,
    refetchIntervalInBackground: false,
    staleTime: 15_000,
    retry: 1,
  })
}
