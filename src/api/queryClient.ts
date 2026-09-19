import { QueryClient } from '@tanstack/react-query'

/**
 * The browser owns one query cache for the lifetime of the SPA.
 *
 * Keeping it outside `App.tsx` lets the entry point seed build-time Newsroom
 * data before React mounts. That is the important part: a prerendered article
 * stays readable while its route chunk loads, then React's very first render
 * already has the same post instead of replacing useful HTML with "Loading".
 */
export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
})
