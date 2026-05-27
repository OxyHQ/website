/**
 * Minimal typed shape for the OpenAPI 3.x document loaded by the docs
 * route. Scalar parses the full document itself, so we only need this for
 * the static import glob's return type. Kept narrow + additive so new
 * OpenAPI fields never break the build.
 */
export interface OpenApiSpec {
  openapi?: string
  info?: { title?: string }
  paths?: Record<string, unknown>
  tags?: Array<{ name: string; description?: string }>
}

// Eager glob: every synced OpenAPI doc gets compiled into the SPA chunk so
// version switches don't trigger a network round-trip.
const specLoaders = import.meta.glob<{ default: OpenApiSpec }>(
  '../../content/_synced/api/*/openapi.json',
)

export function loaderFor(version: string): (() => Promise<{ default: OpenApiSpec }>) | null {
  const key = `../../content/_synced/api/${version}/openapi.json`
  return specLoaders[key] ?? null
}
