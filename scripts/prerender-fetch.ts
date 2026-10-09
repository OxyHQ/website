/** Bound both response headers and body reads; callers retain their existing
 * fallbacks, including unknown locale readiness rather than "no locales". */
export function fetchPrerender(url: string, timeoutMs = 30_000): Promise<Response> {
  return fetch(url, { signal: AbortSignal.timeout(timeoutMs) })
}
