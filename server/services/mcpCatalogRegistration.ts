import type { AppCapabilityCatalog } from '@oxy.so/contracts';
import {
  capabilityCatalogDigest,
  OxyMcpRequestError,
  registerCapabilityCatalog,
} from '@oxy.so/mcp';

/**
 * Register the MCP catalog with Oxy, which is what makes Oxy recognise
 * `website-api.oxy.so/mcp` as a resource it can issue tokens for.
 *
 * Runs after `listen()` and never throws: an Oxy outage at boot must not take
 * the site down, it only delays MCP sign-in until a retry lands. And it never
 * gives up on a failure that can heal — a registry outage longer than the
 * initial burst used to leave MCP sign-in broken until the next deploy.
 *
 * One attempt is the SDK's `registerCapabilityCatalog`, which also refuses an
 * answer naming a different catalogue than this process serves. This module
 * owns only what the SDK leaves to the caller: when to try again.
 *
 * Retry policy:
 * - An initial burst of {@link INITIAL_ATTEMPTS} attempts backs off to a one
 *   minute ceiling, then sustained recovery continues with the ceiling raised
 *   to {@link SUSTAINED_MAX_DELAY_MS}. Every delay is full jitter (uniform
 *   between a small floor and the ceiling) so a fleet of tasks booted together
 *   does not retry in lockstep.
 * - The shared Oxy transport refreshes a rejected workload credential once.
 *   A remaining 401 is retried with the same bounded outage backoff.
 * - Any other 4xx except 408 and 429 is a configuration refusal (the
 *   workload is not registered or the schema was rejected). Retrying cannot
 *   fix it, so it stops, logs once and reports
 *   `refused` until someone fixes the configuration and redeploys.
 * - Once registered it stops. There is no periodic re-registration: that would
 *   be an overwrite loop between task versions during a deploy.
 *
 * Deploy coexistence: Oxy keeps ONE active registration per app and the last
 * successful register call wins — it does not compare `version`, `deployedAt`
 * or digests to reject an older catalog. During a rolling deploy an old task
 * whose registration is still retrying can therefore land AFTER the new task
 * registered and reactivate the older catalog. That is a known limitation until
 * Oxy compares versions; the body carries `deployedAt`, so the stored row says
 * which build sent it. Each task reports its catalogue's digest — the one Oxy
 * computes — at `GET /api/mcp/status`, which is how the mismatch is spotted.
 */

export const INITIAL_ATTEMPTS = 6;
export const INITIAL_MAX_DELAY_MS = 60_000;
export const SUSTAINED_MAX_DELAY_MS = 10 * 60_000;
export const BASE_DELAY_MS = 5_000;
export const MIN_DELAY_MS = 1_000;
export const REQUEST_TIMEOUT_MS = 15_000;
const MAX_ERROR_MESSAGE_LENGTH = 200;

export type McpCatalogRegistrationState =
  | 'pending'
  | 'registered'
  | 'retrying'
  | 'refused'
  | 'disabled';

export interface McpCatalogRegistrationStatus {
  state: McpCatalogRegistrationState;
  catalogVersion: string | null;
  catalogHash: string | null;
  toolCount: number;
  attempts: number;
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
  lastError: { status: number | null; message: string } | null;
  nextAttemptAt: string | null;
}

export interface McpCatalogRegistrationDeps {
  now: () => number;
  /** Resolves after `ms`, or early when `signal` aborts. Must not keep the process alive. */
  sleep: (ms: number, signal: AbortSignal) => Promise<void>;
  random: () => number;
  log: (message: string) => void;
  error: (message: string) => void;
}

export interface McpCatalogRegistration {
  /** Runs until registered, refused or stopped. Never rejects. */
  start(): Promise<void>;
  stop(): void;
  status(): McpCatalogRegistrationStatus;
}

function unrefSleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) return resolve();
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    timer.unref?.();
    const onAbort = () => {
      clearTimeout(timer);
      resolve();
    };
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

const defaultDeps: McpCatalogRegistrationDeps = {
  now: () => Date.now(),
  sleep: unrefSleep,
  random: Math.random,
  log: (message) => console.log(message),
  error: (message) => console.error(message),
};

/**
 * Reduce an error to something safe to log and to serve from a public
 * endpoint: bearer credentials, JWTs and long opaque strings are masked, and
 * the result is short.
 */
export function sanitizeErrorMessage(raw: string, secrets: readonly string[] = []): string {
  let message = raw;
  for (const secret of secrets) {
    if (secret) message = message.split(secret).join('[redacted]');
  }
  message = message
    .replace(/bearer\s+[^\s"',;]+/gi, 'Bearer [redacted]')
    .replace(/eyJ[\w-]+\.[\w-]+(?:\.[\w-]*)?/g, '[redacted]')
    .replace(/\b[A-Za-z0-9+/_-]{40,}={0,2}/g, '[redacted]')
    .replace(/\s+/g, ' ')
    .trim();
  return message.length > MAX_ERROR_MESSAGE_LENGTH
    ? `${message.slice(0, MAX_ERROR_MESSAGE_LENGTH - 1)}…`
    : message;
}

function isPermanentRefusal(status: number): boolean {
  return status >= 400 && status < 500 && status !== 401 && status !== 408 && status !== 429;
}

export function createMcpCatalogRegistration(input: {
  catalog: AppCapabilityCatalog;
  transport: { fetch: typeof fetch };
  oxyApiBase: string;
  deps?: Partial<McpCatalogRegistrationDeps>;
}): McpCatalogRegistration {
  const deps: McpCatalogRegistrationDeps = { ...defaultDeps, ...input.deps };
  const hash = capabilityCatalogDigest(input.catalog);
  // The build's start, not each attempt's: a retry that lands an hour later is
  // still the same deployment.
  const deployedAt = new Date(deps.now());
  const stopController = new AbortController();
  let running: Promise<void> | null = null;

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
  };

  const iso = (ms: number) => new Date(ms).toISOString();
  const recordError = (status: number | null, raw: string) => {
    current.lastError = { status, message: sanitizeErrorMessage(raw) };
  };

  const backoffDelay = (attempt: number) => {
    const ceiling = attempt < INITIAL_ATTEMPTS ? INITIAL_MAX_DELAY_MS : SUSTAINED_MAX_DELAY_MS;
    const exponential = Math.min(ceiling, BASE_DELAY_MS * 2 ** Math.min(attempt - 1, 20));
    return Math.max(MIN_DELAY_MS, Math.floor(deps.random() * exponential));
  };

  /** One attempt. Returns the delay before the next one, or null to stop. */
  const attemptOnce = async (): Promise<number | null> => {
    current.attempts += 1;
    const attempt = current.attempts;
    current.lastAttemptAt = iso(deps.now());
    current.nextAttemptAt = null;
    try {
      await registerCapabilityCatalog(input.catalog, {
        transport: input.transport,
        oxyApiUrl: input.oxyApiBase,
        deployedAt,
        timeoutMs: REQUEST_TIMEOUT_MS,
      });
      current.state = 'registered';
      current.lastSuccessAt = iso(deps.now());
      current.lastError = null;
      deps.log(
        `[mcp] registered capability catalog ${input.catalog.version} (${input.catalog.tools.length} tools, digest ${hash.slice(0, 12)}, attempt ${attempt})`,
      );
      return null;
    } catch (error) {
      if (stopController.signal.aborted) return null;
      // A refusal names itself (an unregistered workload, a schema the API
      // rejected); it is logged and kept, sanitized and short.
      const status = error instanceof OxyMcpRequestError ? error.status : null;
      recordError(status, error instanceof Error ? error.message : String(error));
      if (status !== null && isPermanentRefusal(status)) {
        current.state = 'refused';
        deps.error(
          `[mcp] catalog registration refused by configuration (status=${status}); not retrying: ${current.lastError?.message}`,
        );
        return null;
      }
      current.state = 'retrying';
      const delay = backoffDelay(attempt);
      deps.error(
        `[mcp] catalog registration failed (${status === null ? '' : `status=${status}, `}attempt ${attempt}), retrying in ${delay}ms: ${current.lastError?.message}`,
      );
      return delay;
    }
  };

  const run = async () => {
    try {
      while (!stopController.signal.aborted) {
        const delay = await attemptOnce();
        if (delay === null || stopController.signal.aborted) break;
        current.nextAttemptAt = iso(deps.now() + delay);
        await deps.sleep(delay, stopController.signal);
      }
    } catch (error) {
      // Defensive: nothing above should throw, and this must never become an
      // unhandled rejection that takes the process down.
      recordError(null, error instanceof Error ? error.message : String(error));
      deps.error(
        `[mcp] catalog registration loop stopped unexpectedly: ${current.lastError?.message}`,
      );
    } finally {
      current.nextAttemptAt = null;
    }
  };

  return {
    start() {
      running ??= run();
      return running;
    },
    stop() {
      stopController.abort();
    },
    status() {
      return { ...current, lastError: current.lastError ? { ...current.lastError } : null };
    },
  };
}

/** What `/api/mcp/status` reports for a process that does not register (local runs). */
export function disabledMcpCatalogRegistrationStatus(
  catalog?: AppCapabilityCatalog,
): McpCatalogRegistrationStatus {
  return {
    state: 'disabled',
    catalogVersion: catalog?.version ?? null,
    catalogHash: catalog ? capabilityCatalogDigest(catalog) : null,
    toolCount: catalog?.tools.length ?? 0,
    attempts: 0,
    lastAttemptAt: null,
    lastSuccessAt: null,
    lastError: null,
    nextAttemptAt: null,
  };
}
