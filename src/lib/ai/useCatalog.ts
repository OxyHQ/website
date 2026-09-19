/**
 * The catalogue, as a React hook.
 *
 * Starts from the build-time snapshot — which is already in the prerendered
 * HTML — and asks the public endpoint for something newer after mount. The
 * initial value is never `undefined` and never an empty placeholder, so no page
 * has a loading state that flashes "no models" before it has asked.
 *
 * Deliberately not `useQuery`: react-query's cache would be a second copy of
 * the same data with its own staleness rules, and the fallback behaviour here
 * (keep the snapshot on any failure, including a valid-but-empty response) is
 * the whole feature rather than an error branch.
 */
import { useEffect, useState } from 'react'
import { BUILD_SNAPSHOT, refreshCatalog } from './snapshot'
import type { PublicCatalog } from './catalog'

export interface CatalogState {
  catalog: PublicCatalog
  /** True until the first refresh attempt settles. The snapshot is shown meanwhile. */
  refreshing: boolean
  /** Set when the refresh did not replace the snapshot, for diagnostics. */
  refreshError?: string
}

export function useCatalog(): CatalogState {
  const [state, setState] = useState<CatalogState>({
    catalog: BUILD_SNAPSHOT,
    refreshing: true,
  })

  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false
    refreshCatalog(BUILD_SNAPSHOT, controller.signal).then((result) => {
      if (cancelled) return
      setState({
        catalog: result.catalog,
        refreshing: false,
        refreshError: result.refreshed ? undefined : result.reason,
      })
    })
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [])

  return state
}
