/**
 * Bridge service client for the WFAIR redemption flow (`/unwrap`).
 *
 * Mirrors the bridge `GET /api/bridge/withdrawal/status/:burnTxHash` endpoint
 * defined in services/bridge/src/api/withdrawal.ts. The user burns WFAIR
 * client-side via the wagmi contract write, then we poll this endpoint until
 * the bridge releases native FAIR.
 */
import { getBridgeBaseUrl } from './faircoin-buy'

export const WITHDRAWAL_STATUSES = [
  'DETECTED',
  'CONFIRMED',
  'SIGNING',
  'BROADCAST',
  'FINAL',
  'FAILED',
] as const

export type WithdrawalStatus = (typeof WITHDRAWAL_STATUSES)[number]

export interface WithdrawalStatusResponse {
  id: string
  baseBurnTxHash: string
  baseBlockNumber: number
  logIndex: number
  fromBaseAddress: string
  destinationFairAddress: string
  amountWei: string
  amountSats: string
  status: WithdrawalStatus
  fairTxid: string | null
  fairConfirmations: number
  fairBroadcastAt: string | null
  createdAt: string
  updatedAt: string
}

export class WithdrawalApiError extends Error {
  readonly status: number
  readonly code: string | null
  constructor(message: string, status: number, code: string | null) {
    super(message)
    this.name = 'WithdrawalApiError'
    this.status = status
    this.code = code
  }
}

interface BridgeErrorBody {
  error?: string
  code?: string
  message?: string
}

async function parseErrorBody(res: Response): Promise<BridgeErrorBody> {
  try {
    return (await res.json()) as BridgeErrorBody
  } catch {
    return {}
  }
}

/**
 * Get the current state of a redemption identified by the burn tx hash.
 *
 * Returns `null` if the bridge has not yet seen the burn — useful for
 * polling immediately after the user signs the burn transaction, while the
 * bridge watcher is still indexing.
 */
export async function getWithdrawalStatus(
  burnTxHash: string,
): Promise<WithdrawalStatusResponse | null> {
  let res: Response
  try {
    res = await fetch(
      `${getBridgeBaseUrl()}/api/bridge/withdrawal/status/${encodeURIComponent(burnTxHash)}`,
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'network_error'
    throw new WithdrawalApiError(message, 0, 'network_error')
  }
  if (res.status === 404) return null
  if (!res.ok) {
    const body = await parseErrorBody(res)
    const code = body.code ?? body.error ?? null
    const msg = body.message ?? body.error ?? `Bridge API error: ${res.status}`
    throw new WithdrawalApiError(msg, res.status, code)
  }
  return (await res.json()) as WithdrawalStatusResponse
}

/** Bridge stops emitting updates once a withdrawal reaches one of these. */
export const TERMINAL_WITHDRAWAL_STATUSES: ReadonlySet<WithdrawalStatus> = new Set<
  WithdrawalStatus
>(['FINAL', 'FAILED'])
