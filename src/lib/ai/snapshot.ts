/**
 * Getting catalogue data onto the page, and keeping it there.
 *
 * The committed snapshot is the last-known-good copy: the prerender paints from
 * it, so the catalogue is in the HTML before any JavaScript runs, and a crawler
 * or a reader with scripts blocked sees the same models a browser does. After
 * hydration the page asks the public endpoint for something newer.
 *
 * The rule that shapes every function below: **a failed or empty response never
 * replaces a valid snapshot.** An outage upstream reads as "prices from
 * Tuesday", not as "Oxy has no models" — and the second one is a claim about
 * the product, published by an HTTP timeout.
 *
 * While `OXY_PUBLIC_CATALOG_URL` is unpublished the committed snapshot is
 * deliberately EMPTY and carries `source: "placeholder"`. That is the honest
 * state: the catalogue endpoint does not exist yet (Oxy #972), and an invented
 * model list would be a fabrication with a schema around it.
 */
import snapshotJson from '../../data/ai/catalog-snapshot.json'
import {
  CatalogSchemaError,
  parsePublicCatalog,
  toCustomerSafeCatalog,
  type PublicCatalog,
} from './catalog'

/**
 * The build-time snapshot, validated once at module scope.
 *
 * A malformed committed snapshot is a build-breaking mistake rather than a
 * runtime surprise: `scripts/ai-catalog.test.ts` parses the same file in
 * `prebuild`, so this throw is the second line of defence, not the first.
 */
export const BUILD_SNAPSHOT: PublicCatalog = toCustomerSafeCatalog(
  parsePublicCatalog(snapshotJson),
)

/** True while the catalogue has nothing to show, for either reason. */
export function isCatalogUnpublished(catalog: PublicCatalog): boolean {
  return catalog.source === 'placeholder' || catalog.entries.length === 0
}

/** Where the browser asks for fresher data. Unset in a build with no endpoint yet. */
export function publicCatalogEndpoint(): string | undefined {
  const configured = import.meta.env.VITE_OXY_PUBLIC_CATALOG_URL as string | undefined
  return configured && configured.length > 0 ? configured : undefined
}

export interface CatalogRefreshResult {
  catalog: PublicCatalog
  /** False when the fetch failed or returned nothing usable and the snapshot stands. */
  refreshed: boolean
  reason?: string
}

/**
 * Ask the public endpoint for a newer catalogue, falling back to `fallback`.
 *
 * Never throws: every failure path returns the fallback with a reason, because
 * the caller's only reasonable response to any of them is the same — keep
 * showing what is already on screen.
 */
export async function refreshCatalog(
  fallback: PublicCatalog,
  signal?: AbortSignal,
): Promise<CatalogRefreshResult> {
  const endpoint = publicCatalogEndpoint()
  if (!endpoint) return { catalog: fallback, refreshed: false, reason: 'no endpoint configured' }

  try {
    const response = await fetch(endpoint, { signal, headers: { accept: 'application/json' } })
    if (!response.ok) {
      return { catalog: fallback, refreshed: false, reason: `HTTP ${response.status}` }
    }
    const parsed = toCustomerSafeCatalog(parsePublicCatalog(await response.json()))
    // An upstream that answers 200 with an empty catalogue is indistinguishable
    // from an upstream that is half deployed. Keeping the snapshot is wrong in
    // exactly one case — a catalogue that legitimately emptied — and that case
    // is a deliberate act someone can ship a new snapshot for.
    if (parsed.entries.length === 0 && fallback.entries.length > 0) {
      return { catalog: fallback, refreshed: false, reason: 'empty response' }
    }
    return { catalog: parsed, refreshed: true }
  } catch (error) {
    const reason =
      error instanceof CatalogSchemaError
        ? error.message
        : error instanceof Error
          ? error.message
          : 'unknown error'
    return { catalog: fallback, refreshed: false, reason }
  }
}

/**
 * How old a snapshot is, in whole days, or undefined for the placeholder.
 *
 * Used only to decide whether to show a restrained freshness note. A visitor
 * does not need a banner because the price list is two hours old.
 */
export function snapshotAgeInDays(catalog: PublicCatalog, now = new Date()): number | undefined {
  if (catalog.source === 'placeholder') return undefined
  const generated = new Date(catalog.generatedAt)
  if (Number.isNaN(generated.getTime())) return undefined
  const days = Math.floor((now.getTime() - generated.getTime()) / 86_400_000)
  return days < 0 ? 0 : days
}

/** Days after which the page says out loud that prices may have moved. */
export const STALE_SNAPSHOT_DAYS = 14
