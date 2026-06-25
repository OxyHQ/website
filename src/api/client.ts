import type { OxyServices, LinkedHttpClient } from '@oxyhq/core'

export const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api'

let oxyServices: OxyServices | null = null

/**
 * Session-linked HTTP client for the website's own backend.
 *
 * Built once per OxyServices instance via `oxyServices.createLinkedClient`. The
 * linked client keeps its bearer token in lockstep with the SDK session, and
 * its 401 path delegates refresh back to the session owner (and invalidates the
 * owner when a linked 401 can't be refreshed). We do NOT hand-roll
 * `Authorization` headers or read `getAccessToken()` per request anymore.
 */
let linked: LinkedHttpClient | null = null

export function setOxyServices(oxy: OxyServices) {
  if (oxyServices === oxy && linked) return
  // Tear down the previous linked client before re-linking to a new session
  // owner so its token subscription / refresh handler don't leak.
  linked?.dispose()
  oxyServices = oxy
  linked = oxy.createLinkedClient({ baseURL: API_BASE })
}

/**
 * Auth headers for the few raw `fetch`/upload/download call sites that bypass
 * `apiFetch` (media upload, backup download). They read the SDK session token —
 * not a hand-rolled credential.
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = oxyServices ? oxyServices.getAccessToken() : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

function normalizeMethod(method: RequestInit['method']): HttpMethod {
  const m = (method ?? 'GET').toUpperCase()
  if (m === 'POST' || m === 'PUT' || m === 'PATCH' || m === 'DELETE') return m
  return 'GET'
}

/**
 * Parse a `RequestInit.body` back into the structured payload the linked
 * client's `request({ data })` expects. Call sites pass `JSON.stringify(data)`,
 * so a string body is parsed back to its object; non-string bodies (FormData,
 * Blob, …) and `undefined` pass through unchanged.
 */
function toRequestData(body: RequestInit['body']): unknown {
  if (body == null) return undefined
  if (typeof body === 'string') {
    if (body.length === 0) return undefined
    try {
      return JSON.parse(body)
    } catch {
      // Not JSON — send the raw string through as-is.
      return body
    }
  }
  return body
}

/**
 * Fetch the website's own backend through the session-linked SDK client.
 *
 * Preserves the original `apiFetch` contract exactly:
 * - same `?locale=` query-param injection,
 * - same `body.error || 'API error <status>'` thrown-Error message,
 * - same raw JSON return shape (the website backend never wraps in `{ data }`),
 * - no SDK-level timeout / retry / dedup (React Query owns retries) — matching
 *   the prior bare-`fetch` behavior.
 *
 * The only thing that changes is the transport: token lockstep and 401-refresh
 * are now owned by the SDK linked client instead of a per-call `getAccessToken()`
 * + hand-rolled `Authorization` header.
 */
export async function apiFetch<T>(path: string, options?: RequestInit & { locale?: string }): Promise<T> {
  if (!linked) {
    throw new Error('API client not initialized: setOxyServices() must run before apiFetch()')
  }

  let url = path
  if (options?.locale) {
    const separator = url.includes('?') ? '&' : '?'
    url += `${separator}locale=${options.locale}`
  }

  const method = normalizeMethod(options?.method)
  const data = toRequestData(options?.body)

  try {
    return await linked.client.request<T>({
      method,
      url,
      data,
      headers: options?.headers as Record<string, string> | undefined,
      signal: options?.signal ?? undefined,
      // Match the original bare-fetch behavior: no client-side timeout, no SDK
      // retry (React Query owns retry policy per hook), no request dedup.
      timeout: 0,
      retry: false,
      deduplicate: false,
    })
  } catch (err) {
    // Preserve the original error contract: `body.error || 'API error <status>'`,
    // thrown as an `Error`. The SDK normalizes HTTP failures into an `ApiError`
    // ({ message, code, status }) — a plain object, not an `Error` — whose
    // `message` is the backend's `{ error }` text when present, or a generic
    // `HTTP <status>: …` fallback when the error body carried no JSON `error`.
    // We rewrite only that generic fallback back to the website's historical
    // `API error <status>` wording; a real `{ error }` message passes through
    // unchanged. (The website backend always sends `{ error }`, so the rewrite
    // is a safety net for the no-JSON-body edge.)
    const status = (err as { status?: number } | null)?.status
    const message = err instanceof Error
      ? err.message
      : ((err as { message?: string } | null)?.message ?? String(err))
    if (typeof status === 'number' && message.startsWith(`HTTP ${status}:`)) {
      throw new Error(`API error ${status}`)
    }
    throw err instanceof Error ? err : new Error(message)
  }
}
