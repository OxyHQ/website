/**
 * Polling query for WFAIR redemption status.
 *
 * The bridge watcher takes a few seconds to index the burn after it lands on
 * Base, so the endpoint can return 404 for a while after the user signs the
 * tx. The query treats 404 as a transient (data: null) result and keeps
 * polling until either FINAL/FAILED, or the parent disables it.
 */
import { useQuery } from '@tanstack/react-query'
import {
  type WithdrawalStatusResponse,
  TERMINAL_WITHDRAWAL_STATUSES,
  getWithdrawalStatus,
} from '../api/faircoin-withdrawal'

const POLL_INTERVAL_MS = 5_000

export function useFaircoinWithdrawalStatus(
  burnTxHash: string | null,
  enabled = true,
) {
  return useQuery<WithdrawalStatusResponse | null, Error>({
    queryKey: ['faircoin-withdrawal-status', burnTxHash],
    queryFn: () => {
      if (!burnTxHash) {
        return Promise.reject(new Error('faircoin-withdrawal: missing burn tx hash'))
      }
      return getWithdrawalStatus(burnTxHash)
    },
    enabled: enabled && Boolean(burnTxHash),
    refetchInterval: (query) => {
      const data = query.state.data
      if (!data) return POLL_INTERVAL_MS
      if (TERMINAL_WITHDRAWAL_STATUSES.has(data.status)) return false
      return POLL_INTERVAL_MS
    },
    refetchIntervalInBackground: false,
    staleTime: 0,
    retry: Infinity,
    retryDelay: (attemptIndex) => Math.min(2_000 * 2 ** attemptIndex, 30_000),
  })
}
