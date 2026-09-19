import { randomUUID } from 'node:crypto'
import { SsrfRejection, UpstreamError } from '@oxy.so/core/server'
import { ZodError } from 'zod'
import { isForeignKeyViolation, isUniqueViolation } from '../db/pgErrors.js'
import { DomainError, type DomainErrorKind } from '../utils/domainError.js'

/* ──────────────────────────────────────────────
 * What a tool hands back, success or failure.
 *
 * A tool error reaches a conversation, and a conversation is not a log: a stack
 * trace, a SQL fragment or a bucket name in it helps nobody and tells the
 * reader about the machine. So a failure carries a stable code from a closed
 * set, a message written for the person, and a reference that finds the full
 * detail in the server log — never the detail itself.
 *
 * The codes follow the spelling Oxy's shared contracts already use
 * (`invalid_request`, `permission_denied`, `idempotency_conflict`,
 * `request_too_large`, `rate_limited`, `service_unavailable`,
 * `internal_error`) plus the three a content API needs that inference does
 * not: `not_found`, `conflict` and `precondition_failed`.
 * ──────────────────────────────────────────── */

export const MCP_ERROR_CODES = [
  'invalid_request',
  'not_found',
  'permission_denied',
  'conflict',
  'idempotency_conflict',
  'precondition_failed',
  'request_too_large',
  'rate_limited',
  'service_unavailable',
  'internal_error',
] as const

export type McpErrorCode = (typeof MCP_ERROR_CODES)[number]

/** Codes an identical retry can succeed on; everything else needs a different request. */
const RETRYABLE: ReadonlySet<McpErrorCode> = new Set(['rate_limited', 'service_unavailable', 'internal_error'])

/**
 * A failure whose message is safe to show. Throw it from a handler or a service;
 * anything else that escapes is reported as `internal_error` with a reference.
 */
export class ToolError extends Error {
  constructor(
    readonly code: McpErrorCode,
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'ToolError'
  }
}

export const notFound = (what: string, details?: Record<string, unknown>) => new ToolError('not_found', `${what} not found`, details)
export const conflict = (message: string, details?: Record<string, unknown>) => new ToolError('conflict', message, details)
export const invalid = (message: string, details?: Record<string, unknown>) => new ToolError('invalid_request', message, details)

export interface ToolTextContent {
  type: 'text'
  text: string
}

export interface ToolResult {
  content: ToolTextContent[]
  structuredContent?: Record<string, unknown>
  isError?: true
}

export interface ToolErrorBody {
  error: {
    code: McpErrorCode
    message: string
    retryable: boolean
    reference?: string
    details?: Record<string, unknown>
  }
}

/**
 * A success. The JSON text stays for clients that only read `content`; an
 * object result is also sent as `structuredContent`.
 */
export function ok(data: unknown): ToolResult {
  const result: ToolResult = { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
  if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
    result.structuredContent = data as Record<string, unknown>
  }
  return result
}

function body(code: McpErrorCode, message: string, extra: { reference?: string; details?: Record<string, unknown> } = {}): ToolErrorBody {
  return {
    error: {
      code,
      message,
      retryable: RETRYABLE.has(code),
      ...(extra.reference ? { reference: extra.reference } : {}),
      ...(extra.details ? { details: extra.details } : {}),
    },
  }
}

function errorResult(payload: ToolErrorBody): ToolResult {
  const { code, message } = payload.error
  return {
    content: [{ type: 'text', text: `${code}: ${message}\n${JSON.stringify(payload, null, 2)}` }],
    structuredContent: payload as unknown as Record<string, unknown>,
    isError: true,
  }
}

/** A Zod path and message per issue — the input's own field names, nothing from the server. */
function zodDetails(error: ZodError): Record<string, unknown> {
  return {
    issues: error.issues.slice(0, 20).map((issue) => ({
      path: issue.path.map(String).join('.'),
      message: issue.message,
    })),
  }
}

const DOMAIN_CODES: Record<DomainErrorKind, McpErrorCode> = {
  invalid: 'invalid_request',
  not_found: 'not_found',
  conflict: 'conflict',
  too_large: 'request_too_large',
  precondition_failed: 'precondition_failed',
}

/**
 * Classify a thrown value into a safe tool error. Unknown failures are logged
 * in full, under a reference the caller can quote, and answered generically.
 */
export function classifyError(error: unknown, log: (reference: string, error: unknown) => void = defaultLog): ToolErrorBody {
  if (error instanceof ToolError) return body(error.code, error.message, { details: error.details })
  if (error instanceof DomainError) return body(DOMAIN_CODES[error.kind], error.message, { details: error.details })
  if (error instanceof ZodError) return body('invalid_request', 'The input does not match the tool schema', { details: zodDetails(error) })
  if (isUniqueViolation(error)) return body('conflict', 'A record with the same unique value already exists')
  if (isForeignKeyViolation(error)) return body('invalid_request', 'A referenced record does not exist')
  if (error instanceof SsrfRejection) return body('invalid_request', 'That URL points at an address the server will not fetch')
  if (error instanceof UpstreamError) return body('service_unavailable', 'The remote source could not be downloaded')
  const reference = randomUUID()
  log(reference, error)
  return body('internal_error', 'The tool failed unexpectedly', { reference })
}

function defaultLog(reference: string, error: unknown): void {
  console.error(`[mcp] internal error ref=${reference}:`, error)
}

export function toolError(error: unknown): ToolResult {
  return errorResult(classifyError(error))
}

/** An error result from a code and message, for the dispatch layer. */
export function errorOf(code: McpErrorCode, message: string, details?: Record<string, unknown>): ToolResult {
  return errorResult(body(code, message, { details }))
}
