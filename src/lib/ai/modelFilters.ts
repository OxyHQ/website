/**
 * The catalogue's filter state, the query string it round-trips through, and the
 * filtering itself.
 *
 * Separate from the component that renders the controls so both a page and a
 * test can read the same predicate — and so the component file exports only a
 * component, which is what React Fast Refresh needs to swap it without
 * remounting the page.
 */
import { deploymentsForEntry, publisherName, type CatalogEntry, type PublicCatalog } from './catalog'

export interface ModelFilterState {
  query: string
  publisher: string
  capability: string
  kind: string
  availability: string
  provider: string
  region: string
  zeroRetentionOnly: boolean
  sort: 'name' | 'input_price' | 'context'
}

export const EMPTY_FILTERS: ModelFilterState = {
  query: '',
  publisher: '',
  capability: '',
  kind: '',
  availability: '',
  provider: '',
  region: '',
  zeroRetentionOnly: false,
  sort: 'name',
}

export function filtersFromSearchParams(params: URLSearchParams): ModelFilterState {
  const sort = params.get('sort')
  return {
    query: params.get('q') ?? '',
    publisher: params.get('publisher') ?? '',
    capability: params.get('capability') ?? '',
    kind: params.get('kind') ?? '',
    availability: params.get('availability') ?? '',
    provider: params.get('provider') ?? '',
    region: params.get('region') ?? '',
    zeroRetentionOnly: params.get('zdr') === '1',
    sort: sort === 'input_price' || sort === 'context' ? sort : 'name',
  }
}

export function filtersToSearchParams(filters: ModelFilterState): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.query) params.set('q', filters.query)
  if (filters.publisher) params.set('publisher', filters.publisher)
  if (filters.capability) params.set('capability', filters.capability)
  if (filters.kind) params.set('kind', filters.kind)
  if (filters.availability) params.set('availability', filters.availability)
  if (filters.provider) params.set('provider', filters.provider)
  if (filters.region) params.set('region', filters.region)
  if (filters.zeroRetentionOnly) params.set('zdr', '1')
  if (filters.sort !== 'name') params.set('sort', filters.sort)
  return params
}

export function hasActiveFilters(filters: ModelFilterState): boolean {
  return filtersToSearchParams(filters).toString().length > 0
}

/**
 * Apply the filters.
 *
 * Sorting by latency or throughput is deliberately absent: those numbers are
 * only meaningful with a stated measurement method and enough samples to be
 * stable, and a sortable column implies both.
 */
export function applyFilters(
  catalog: PublicCatalog,
  entries: readonly CatalogEntry[],
  filters: ModelFilterState,
): CatalogEntry[] {
  const needle = filters.query.trim().toLowerCase()
  const filtered = entries.filter((entry) => {
    if (needle) {
      const haystack = `${entry.id} ${entry.name} ${publisherName(catalog, entry.publisherId)}`.toLowerCase()
      if (!haystack.includes(needle)) return false
    }
    if (filters.publisher && entry.publisherId !== filters.publisher) return false
    if (filters.kind && entry.kind !== filters.kind) return false
    if (filters.availability && entry.availability !== filters.availability) return false
    if (filters.capability && !entry.capabilities.includes(filters.capability as never)) return false

    if (filters.provider || filters.region || filters.zeroRetentionOnly) {
      const deployments = deploymentsForEntry(catalog, entry)
      if (filters.provider && !deployments.some((d) => d.providerId === filters.provider)) return false
      if (filters.region && !deployments.some((d) => d.region === filters.region)) return false
      if (
        filters.zeroRetentionOnly &&
        !deployments.some((d) => d.dataPolicy.zeroRetentionAvailable)
      ) {
        return false
      }
    }
    return true
  })

  return [...filtered].sort((a, b) => {
    if (filters.sort === 'context') {
      return (b.contextTokens ?? 0) - (a.contextTokens ?? 0) || a.id.localeCompare(b.id)
    }
    if (filters.sort === 'input_price') {
      return comparePriceStrings(inputPrice(a), inputPrice(b)) || a.id.localeCompare(b.id)
    }
    return a.name.localeCompare(b.name) || a.id.localeCompare(b.id)
  })
}

function inputPrice(entry: CatalogEntry): string | undefined {
  return entry.prices.find((price) => price.unit === 'input_token')?.amountUsd
}

/**
 * Order two decimal strings without turning either into a float.
 *
 * An entry with no published price sorts last rather than as zero — free and
 * unpriced are different, and only one of them belongs at the top of a
 * cheapest-first list.
 */
function comparePriceStrings(a: string | undefined, b: string | undefined): number {
  if (a === undefined && b === undefined) return 0
  if (a === undefined) return 1
  if (b === undefined) return -1
  const [aWhole = '0', aFraction = ''] = a.split('.')
  const [bWhole = '0', bFraction = ''] = b.split('.')
  const width = Math.max(aFraction.length, bFraction.length)
  const aScaled = BigInt(aWhole) * 10n ** BigInt(width) + BigInt(aFraction.padEnd(width, '0') || '0')
  const bScaled = BigInt(bWhole) * 10n ** BigInt(width) + BigInt(bFraction.padEnd(width, '0') || '0')
  return aScaled === bScaled ? 0 : aScaled < bScaled ? -1 : 1
}
