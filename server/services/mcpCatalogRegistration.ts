import { createHash } from 'node:crypto'
import type { AppCapabilityCatalog } from '@oxy.so/contracts'
import type { OxyServices } from '@oxy.so/core'

/**
 * Register the MCP catalog with Oxy, which is what makes Oxy recognise
 * `website-api.oxy.so/mcp` as a resource it can issue tokens for.
 *
 * Runs after `listen()` and never throws: an Oxy outage at boot must not take
 * the site down, it only delays MCP sign-in until a retry lands. And it never
 * gives up on a failure that can heal — a registry outage longer than the
 * initial burst used to leave MCP sign-in broken until the next deploy.
 *
 * Retry policy:
 * - An initial burst of {@link INITIAL_ATTEMPTS} attempts backs off to a one
 *   minute ceiling, then sustained recovery continues with the ceiling raised
 *   to {@link SUSTAINED_MAX_DELAY_MS}. Every delay is full jitter (uniform
 *   between a small floor and the ceiling) so a fleet of tasks booted together
 *   does not retry in lockstep.
 * - `Retry-After` on a 429 or 503 is honoured (seconds or an HTTP date) when it
 *   asks for longer than the computed delay.
 * - 401 invalidates the cached service token and retries: a rotated credential
 *   heals on its own.
 * - Any other 4xx except 408 and 429 is a configuration refusal (the
 *   credential lacks `catalogs:write` or `catalog:website`, the schema was
 *   rejected). Retrying cannot fix it, so it stops, logs once and reports
 *   `refused` until someone fixes the configuration and redeploys.
 * - Once registered it stops. There is no periodic re-registration: that would
 *   be an overwrite loop between task versions during a deploy.
 *
 * Deploy coexistence: Oxy keeps ONE active registration per app and the last
 * successful register call wins — it does not compare `version`, `deployedAt`
 * or digests to reject an older catalog. During a rolling deploy an old task
 * whose registration is still retrying can therefore land AFTER the new task
 * registered and reactivate the older catalog. That is a known limitation until
 * Oxy compares versions; the body carries `deployedAt` and `catalogHash` so the
 * registry has what it needs to do so, and so the stored row says which build
 * sent it. Each task reports its own hash at `GET /api/mcp/status`, which is how
 * the mismatch is spotted.
 */

export const INITIAL_ATTEMPTS = 6
export const INITIAL_MAX_DELAY_MS = 60_000
export const SUSTAINED_MAX_DELAY_MS = 10 * 60_000
export const BASE_DELAY_MS = 5_000
export const MIN_DELAY_MS = 1_000
/** A `Retry-After` longer than this is capped: a misconfigured proxy must not park MCP for a day. */
export const MAX_RETRY_AFTER_MS = 60 * 60_000
export const REQUEST_TIMEOUT_MS = 15_000
const MAX_ERROR_MESSAGE_LENGTH = 200

export type McpCatalogRegistrationState = 'pending' | 'registered' | 'retrying' | 'refused' | 'disabled'

export interface McpCatalogRegistrationStatus {
  state: McpCatalogRegistrationState
  catalogVersion: string | null
  catalogHash: string | null
  toolCount: number
  attempts: number
  lastAttemptAt: string | null
  lastSuccessAt: string | null
  lastError: { status: number | null; message: string } | null
  nextAttemptAt: string | null
}

export interface McpCatalogRegistrationDeps {
  fetch: (url: string, init: RequestInit) => Promise<Response>
  now: () => number
  /** Resolves after `ms`, or early when `signal` aborts. Must not keep the process alive. */
  sleep: (ms: number, signal: AbortSignal) => Promise<void>
  random: () => number
  log: (message: string) => void
  error: (message: string) => void
}

export interface McpCatalogRegistration {
  /** Runs until registered, refused or stopped. Never rejects. */
  start(): Promise<void>
  stop(): void
  status(): McpCatalogRegistrationStatus
}

type OxyTokenSource = Pick<OxyServices, 'getServiceToken' | 'invalidateServiceToken'>

function unrefSleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) return resolve()
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    timer.unref?.()
    const onAbort = () => {
      clearTimeout(timer)
      resolve()
    }
    signal.addEventListener('abort', onAbort, { once: true })
  })
}

const defaultDeps: McpCatalogRegistrationDeps = {
  fetch: (url, init) => fetch(url, init),
  now: () => Date.now(),
  sleep: unrefSleep,
  random: Math.random,
  log: (message) => console.log(message),
  error: (message) => console.error(message),
}

/** JSON with object keys sorted at every depth, so equal catalogs hash equally. */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null'
  if (Array.isArray(value)) return `[${value.map((item) => canonicalJson(item === undefined ? null : item)).join(',')}]`
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, item]) => item !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(',')}}`
}

export function catalogHash(catalog: unknown): string {
  return createHash('sha256').update(canonicalJson(catalog)).digest('hex')
}

/**
 * Reduce an error to something safe to log and to serve from a public
 * endpoint: bearer credentials, JWTs and long opaque strings are masked, and
 * the result is short.
 */
export function sanitizeErrorMessage(raw: string, secrets: readonly string[] = []): string {
  let message = raw
  for (const secret of secrets) {
    if (secret) message = message.split(secret).join('[redacted]')
  }
  message = message
    .replace(/bearer\s+[^\s"',;]+/gi, 'Bearer [redacted]')
    .replace(/eyJ[\w-]+\.[\w-]+(?:\.[\w-]*)?/g, '[redacted]')
    .replace(/\b[A-Za-z0-9+/_-]{40,}={0,2}/g, '[redacted]')
    .replace(/\s+/g, ' ')
    .trim()
  return message.length > MAX_ERROR_MESSAGE_LENGTH ? `${message.slice(0, MAX_ERROR_MESSAGE_LENGTH - 1)}…` : message
}

/** Parse `Retry-After` as delta-seconds or an HTTP date; null when absent or unusable. */
export function parseRetryAfter(header: string | null, nowMs: number): number | null {
  if (!header) return null
  const trimmed = header.trim()
  if (/^\d+$/.test(trimmed)) return Number(trimmed) * 1000
  const at = Date.parse(trimmed)
  if (Number.isNaN(at)) return null
  return Math.max(0, at - nowMs)
}

function isPermanentRefusal(status: number): boolean {
  return status >= 400 && status < 500 && status !== 401 && status !== 408 && status !== 429
}

export function createMcpCatalogRegistration(input: {
  catalog: AppCapabilityCatalog
  oxy: OxyTokenSource
  oxyApiBase: string
  deps?: Partial<McpCatalogRegistrationDeps>
}): McpCatalogRegistration {
  const deps: McpCatalogRegistrationDeps = { ...defaultDeps, ...input.deps }
  const hash = catalogHash(input.catalog)
  // The build's start, not each attempt's: a retry that lands an hour later is
  // still the same deployment.
  const deployedAt = new Date(deps.now()).toISOString()
  const stopController = new AbortController()
  const knownTokens = new Set<string>()
  let running: Promise<void> | null = null

  const current: McpCatalogRegistrationStatus = {
    state: 'pending',
    catalogVersion: input.catalog.version,
    catalogHash: hash,
    toolCount: input.catalog.tools.length,
    attempts: 0,
    lastAttemptAt: null,
    lastSuccessAt: null,
    lastError: null,
    nextAttemptAt: null,
  }

  const iso = (ms: number) => new Date(ms).toISOString()
  const recordError = (status: number | null, raw: string) => {
    current.lastError = { status, message: sanitizeErrorMessage(raw, [...knownTokens]) }
  }

  const backoffDelay = (attempt: number) => {
    const ceiling = attempt < INITIAL_ATTEMPTS ? INITIAL_MAX_DELAY_MS : SUSTAINED_MAX_DELAY_MS
    const exponential = Math.min(ceiling, BASE_DELAY_MS * 2 ** Math.min(attempt - 1, 20))
    return Math.max(MIN_DELAY_MS, Math.floor(deps.random() * exponential))
  }

  /** One attempt. Returns the delay before the next one, or null to stop. */
  const attemptOnce = async (): Promise<number | null> => {
    current.attempts += 1
    const attempt = current.attempts
    current.lastAttemptAt = iso(deps.now())
    current.nextAttemptAt = null
    try {
      const token = await input.oxy.getServiceToken()
      if (token) knownTokens.add(token)
      const response = await deps.fetch(`${input.oxyApiBase}/capabilities/catalogs/register`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ catalog: input.catalog, deployedAt, catalogHash: hash }),
        signal: AbortSignal.any([AbortSignal.timeout(REQUEST_TIMEOUT_MS), stopController.signal]),
      })
      if (response.ok) {
        current.state = 'registered'
        current.lastSuccessAt = iso(deps.now())
        current.lastError = null
        deps.log(`[mcp] registered capability catalog ${input.catalog.version} (${input.catalog.tools.length} tools, hash ${hash.slice(0, 12)}, attempt ${attempt})`)
        return null
      }
      // The body names the refusal (a scope the credential lacks, a schema the
      // API rejected); it is logged and kept, sanitized and short.
      const detail = await response.text().catch(() => '')
      recordError(response.status, detail || response.statusText || `HTTP ${response.status}`)
      if (response.status === 401) input.oxy.invalidateServiceToken()
      if (isPermanentRefusal(response.status)) {
        current.state = 'refused'
        deps.error(`[mcp] catalog registration refused by configuration (status=${response.status}); not retrying: ${current.lastError?.message}`)
        return null
      }
      current.state = 'retrying'
      let delay = backoffDelay(attempt)
      if (response.status === 429 || response.status === 503) {
        const retryAfter = parseRetryAfter(response.headers.get('retry-after'), deps.now())
        if (retryAfter !== null) delay = Math.max(delay, Math.min(retryAfter, MAX_RETRY_AFTER_MS))
      }
      deps.error(`[mcp] catalog registration failed (status=${response.status}, attempt ${attempt}), retrying in ${delay}ms: ${current.lastError?.message}`)
      return delay
    } catch (error) {
      if (stopController.signal.aborted) return null
      recordError(null, error instanceof Error ? error.message : String(error))
      current.state = 'retrying'
      const delay = backoffDelay(attempt)
      deps.error(`[mcp] catalog registration failed (attempt ${attempt}), retrying in ${delay}ms: ${current.lastError?.message}`)
      return delay
    }
  }

  const run = async () => {
    try {
      while (!stopController.signal.aborted) {
        const delay = await attemptOnce()
        if (delay === null || stopController.signal.aborted) break
        current.nextAttemptAt = iso(deps.now() + delay)
        await deps.sleep(delay, stopController.signal)
      }
    } catch (error) {
      // Defensive: nothing above should throw, and this must never become an
      // unhandled rejection that takes the process down.
      recordError(null, error instanceof Error ? error.message : String(error))
      deps.error(`[mcp] catalog registration loop stopped unexpectedly: ${current.lastError?.message}`)
    } finally {
      current.nextAttemptAt = null
    }
  }

  return {
    start() {
      running ??= run()
      return running
    },
    stop() {
      stopController.abort()
    },
    status() {
      return { ...current, lastError: current.lastError ? { ...current.lastError } : null }
    },
  }
}

/** What `/api/mcp/status` reports for a process that does not register (local runs, missing credentials). */
export function disabledMcpCatalogRegistrationStatus(catalog?: AppCapabilityCatalog): McpCatalogRegistrationStatus {
  return {
    state: 'disabled',
    catalogVersion: catalog?.version ?? null,
    catalogHash: catalog ? catalogHash(catalog) : null,
    toolCount: catalog?.tools.length ?? 0,
    attempts: 0,
    lastAttemptAt: null,
    lastSuccessAt: null,
    lastError: null,
    nextAttemptAt: null,
  }
}
