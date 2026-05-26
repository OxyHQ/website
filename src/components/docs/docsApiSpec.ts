/**
 * Minimal typed subset of the OpenAPI 3.x document. We only read the fields
 * needed to drive the REST API sidebar — Scalar parses the full document on
 * its own. Keep this type narrow and additive (`?` everywhere) so new
 * OpenAPI fields don't accidentally break the build.
 */
export interface OpenApiOperation {
  tags?: string[]
  operationId?: string
  summary?: string
  description?: string
  deprecated?: boolean
}

export interface OpenApiPathItem {
  get?: OpenApiOperation
  post?: OpenApiOperation
  put?: OpenApiOperation
  patch?: OpenApiOperation
  delete?: OpenApiOperation
  head?: OpenApiOperation
  options?: OpenApiOperation
  trace?: OpenApiOperation
}

export interface OpenApiTag {
  name: string
  description?: string
}

export interface OpenApiSpec {
  openapi?: string
  info?: { title?: string }
  paths?: Record<string, OpenApiPathItem>
  tags?: OpenApiTag[]
}

/**
 * HTTP methods enumerated when counting operations per OpenAPI tag. The
 * sidebar only needs the count — full per-operation rendering is owned by
 * Scalar's in-page navigation, so we don't surface a discriminated method
 * type beyond this list.
 */
export const HTTP_METHODS = [
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'head',
  'options',
  'trace',
] as const

// Eager glob: every synced OpenAPI doc gets compiled into the SPA chunk so
// version switches don't trigger a network round-trip.
const specLoaders = import.meta.glob<{ default: OpenApiSpec }>(
  '../../content/_synced/api/*/openapi.json',
)

export function loaderFor(version: string): (() => Promise<{ default: OpenApiSpec }>) | null {
  const key = `../../content/_synced/api/${version}/openapi.json`
  return specLoaders[key] ?? null
}
