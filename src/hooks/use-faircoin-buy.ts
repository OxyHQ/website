/**
 * React Query bindings for the bridge Buy-FAIR endpoints.
 *
 * - `useFaircoinBuyQuote` is a mutation (the user pulls the trigger from a
 *   form submission, so an imperative call site is the right shape).
 * - `useFaircoinBuyStatus` is a polling query that automatically backs off
 *   once the order reaches a terminal status — no manual cleanup required.
 */
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  type BuyQuoteRequest,
  type BuyQuoteResponse,
  type BuyStatusResponse,
  TERMINAL_BUY_STATUSES,
  getBuyStatus,
  requestBuyQuote,
} from '../api/faircoin-buy'

const STATUS_POLL_INTERVAL_MS = 5_000

/**
 * Mutation that asks the bridge for a fresh buy quote. On success the caller
 * receives a `BuyQuoteResponse` with the per-order payment address (or, for
 * CARD, a hosted checkout URL).
 */
export function useFaircoinBuyQuote() {
  return useMutation<BuyQuoteResponse, Error, BuyQuoteRequest>({
    mutationFn: (body) => requestBuyQuote(body),
  })
}

/**
 * Polls the lifecycle status of an open buy order. Polling stops when:
 *   - `id` is null/empty (returns disabled query, no fetches), OR
 *   - `enabled` is false (caller can pause polling explicitly), OR
 *   - the most recent status is one of `DELIVERED | FAILED | EXPIRED`.
 *
 * React Query's built-in retry handles transient network errors. We let it
 * retry indefinitely (`retry: Infinity`) with the default exponential backoff
 * so a brief connectivity blip doesn't surface a hard failure to the user —
 * the parent UI displays a "reconnecting" hint after a few failed fetches.
 */
export function useFaircoinBuyStatus(
  id: string | null,
  enabled = true,
) {
  return useQuery<BuyStatusResponse, Error>({
    queryKey: ['faircoin-buy-status', id],
    queryFn: () => {
      if (!id) {
        // `enabled` guards against this in practice, but TypeScript doesn't
        // know that, so we throw a typed error rather than fetch with empty.
        return Promise.reject(new Error('faircoin-buy: missing order id'))
      }
      return getBuyStatus(id)
    },
    enabled: enabled && Boolean(id),
    refetchInterval: (query) => {
      const data = query.state.data
      if (!data) return STATUS_POLL_INTERVAL_MS
      if (TERMINAL_BUY_STATUSES.has(data.status)) return false
      return STATUS_POLL_INTERVAL_MS
    },
    refetchIntervalInBackground: false,
    staleTime: 0,
    retry: Infinity,
    retryDelay: (attemptIndex) => Math.min(2_000 * 2 ** attemptIndex, 30_000),
  })
}
