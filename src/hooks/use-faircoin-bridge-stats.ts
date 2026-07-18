/**
 * Live bridge reserve stats for the FairCoin marketing pages.
 *
 * Pulls the bridge custody snapshot (WFAIR supply on Base vs FAIR custodied on
 * the FairCoin chain) so the landing/bridge pages can show a live peg health
 * indicator.
 *
 * The bridge `/api/bridge/reserves` endpoint can return 503 until the first
 * snapshot is recorded — we treat that as "no data yet" rather than an error
 * so the UI can render a graceful placeholder.
 */
import { useQuery } from '@tanstack/react-query'
import { getBridgeBaseUrl } from '../api/faircoin-buy'

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
