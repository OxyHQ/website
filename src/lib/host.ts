/**
 * Hostname-based surface detection.
 *
 * The oxy.so single-page app is also served on the fairco.in apex. When the
 * browser URL is on a FairCoin host, the root route and chrome swap from the
 * Oxy site to the FairCoin landing. No redirect, no iframe — one SPA, two
 * brands, decided at render time from `window.location.hostname`.
 */

const FAIRCOIN_HOSTS: ReadonlySet<string> = new Set([
  'fairco.in',
  'www.fairco.in',
])

/**
 * `true` when the current document is served from the FairCoin apex or its
 * `www` subdomain. Returns `false` during SSR / in non-browser contexts so
 * the default Oxy chrome is assumed. The hostname is fixed for the life of
 * the document, so this is a plain synchronous read — no subscription needed.
 */
export function isFairCoinHost(): boolean {
  if (typeof window === 'undefined') return false
  return FAIRCOIN_HOSTS.has(window.location.hostname)
}
