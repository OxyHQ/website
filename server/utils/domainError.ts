/* ──────────────────────────────────────────────
 * A failure a service can explain to whoever called it.
 *
 * Services are shared by the REST routes and the MCP tools, which speak
 * different error dialects (HTTP statuses, tool error codes). A service throws
 * one of these with a `kind`, and each surface maps the kind to its own
 * vocabulary. The message is written for the caller and must never carry SQL,
 * credentials or internal paths.
 * ──────────────────────────────────────────── */

export type DomainErrorKind = 'invalid' | 'not_found' | 'conflict' | 'too_large' | 'precondition_failed'

export class DomainError extends Error {
  constructor(
    readonly kind: DomainErrorKind,
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'DomainError'
  }
}

export const DOMAIN_ERROR_HTTP_STATUS: Record<DomainErrorKind, number> = {
  invalid: 400,
  not_found: 404,
  conflict: 409,
  too_large: 413,
  precondition_failed: 412,
}
