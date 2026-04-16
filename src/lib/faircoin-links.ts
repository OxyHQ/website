import { isFairCoinHost } from './host'

/**
 * Resolve a FairCoin-surface path for the current host.
 *
 * On `fairco.in` the FairCoin pages are mounted at the apex, so an internal
 * link to the bridge is just `/bridge`. On `oxy.so` the same pages live under
 * `/faircoin`, so the same link must become `/faircoin/bridge`.
 *
 * Pass the path as it appears on fairco.in — this function adds the prefix
 * when the current host is oxy.so.
 */
export function fc(path: string): string {
  if (isFairCoinHost()) return path
  if (path === '/' || path === '') return '/faircoin'
  return `/faircoin${path.startsWith('/') ? path : `/${path}`}`
}
