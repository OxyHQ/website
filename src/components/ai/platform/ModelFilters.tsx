import { useMemo } from 'react'
import { useTranslation } from '../../../lib/i18n'
import { AVAILABILITY_STATES } from '../../../lib/ai/availability'
import {
  deploymentsForEntry,
  publisherName,
  type CatalogEntry,
  type PublicCatalog,
} from '../../../lib/ai/catalog'

/**
 * The catalogue's filter state, and the query string it round-trips through.
 *
 * Kept in the URL rather than in component state so a filtered view is a link
 * someone can paste into a ticket — which is the form most of these questions
 * actually take ("which models can we use in this region under this policy?").
 */
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

interface ModelFiltersProps {
  catalog: PublicCatalog
  value: ModelFilterState
  onChange: (next: ModelFilterState) => void
  resultCount: number
}

/**
 * The filter bar.
 *
 * Every option list is derived from the catalogue that is actually loaded, so
 * the form can never offer a publisher, provider, region or capability with no
 * models behind it. With an empty catalogue the whole bar collapses to the
 * search box, and the page's empty state carries the explanation.
 */
export default function ModelFilters({ catalog, value, onChange, resultCount }: ModelFiltersProps) {
  const { t } = useTranslation()

  const options = useMemo(() => {
    const capabilities = new Set<string>()
    for (const entry of catalog.entries) {
      for (const capability of entry.capabilities) capabilities.add(capability)
    }
    return {
      publishers: catalog.publishers,
      providers: catalog.providers,
      regions: [...new Set(catalog.deployments.map((deployment) => deployment.region))].sort(),
      capabilities: [...capabilities].sort(),
      availabilities: AVAILABILITY_STATES.filter((state) =>
        catalog.entries.some((entry) => entry.availability === state),
      ),
    }
  }, [catalog])

  const update = (patch: Partial<ModelFilterState>) => onChange({ ...value, ...patch })

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-60 flex-1 flex-col gap-1">
          <span className="text-sm text-muted-foreground">{t('ai.models.searchLabel')}</span>
          <input
            type="search"
            value={value.query}
            onChange={(event) => update({ query: event.target.value })}
            placeholder={t('ai.models.searchPlaceholder')}
            className="h-10 rounded-full border border-border bg-background px-4 text-sm text-foreground"
          />
        </label>
        <Select
          label={t('ai.models.sortLabel')}
          value={value.sort}
          onChange={(next) => update({ sort: next as ModelFilterState['sort'] })}
          options={[
            { value: 'name', label: t('ai.models.sortName') },
            { value: 'input_price', label: t('ai.models.sortPriceInput') },
            { value: 'context', label: t('ai.models.sortContext') },
          ]}
          includeAll={false}
        />
      </div>

      <fieldset className="flex flex-wrap items-end gap-3">
        <legend className="sr-only">{t('ai.models.filtersLabel')}</legend>
        {options.publishers.length > 0 && (
          <Select
            label={t('ai.models.filterPublisher')}
            value={value.publisher}
            onChange={(next) => update({ publisher: next })}
            options={options.publishers.map((publisher) => ({
              value: publisher.id,
              label: publisher.name,
            }))}
            allLabel={t('ai.models.all')}
          />
        )}
        {options.capabilities.length > 0 && (
          <Select
            label={t('ai.models.filterCapability')}
            value={value.capability}
            onChange={(next) => update({ capability: next })}
            options={options.capabilities.map((capability) => ({
              value: capability,
              label: capability.replace(/_/g, ' '),
            }))}
            allLabel={t('ai.models.all')}
          />
        )}
        <Select
          label={t('ai.models.filterType')}
          value={value.kind}
          onChange={(next) => update({ kind: next })}
          options={[
            { value: 'model', label: t('ai.models.typeModel') },
            { value: 'routing_profile', label: t('ai.models.typeRoutingProfile') },
          ]}
          allLabel={t('ai.models.all')}
        />
        {options.availabilities.length > 0 && (
          <Select
            label={t('ai.models.filterAvailability')}
            value={value.availability}
            onChange={(next) => update({ availability: next })}
            options={options.availabilities.map((state) => ({
              value: state,
              label: t(`ai.availability.${camel(state)}`),
            }))}
            allLabel={t('ai.models.all')}
          />
        )}
        {options.providers.length > 0 && (
          <Select
            label={t('ai.models.filterProvider')}
            value={value.provider}
            onChange={(next) => update({ provider: next })}
            options={options.providers.map((provider) => ({
              value: provider.id,
              label: provider.name,
            }))}
            allLabel={t('ai.models.all')}
          />
        )}
        {options.regions.length > 0 && (
          <Select
            label={t('ai.models.filterRegion')}
            value={value.region}
            onChange={(next) => update({ region: next })}
            options={options.regions.map((region) => ({ value: region, label: region }))}
            allLabel={t('ai.models.all')}
          />
        )}
        <label className="flex h-10 items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={value.zeroRetentionOnly}
            onChange={(event) => update({ zeroRetentionOnly: event.target.checked })}
            className="size-4 rounded border-border"
          />
          {t('ai.models.filterZeroRetention')}
        </label>
      </fieldset>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
          {t('ai.models.count', { count: resultCount })}
        </p>
        {hasActiveFilters(value) && (
          <button
            type="button"
            onClick={() => onChange(EMPTY_FILTERS)}
            className="cursor-pointer text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            {t('ai.models.clearFilters')}
          </button>
        )}
      </div>
    </div>
  )
}

function Select({
  label,
  value,
  onChange,
  options,
  allLabel,
  includeAll = true,
}: {
  label: string
  value: string
  onChange: (next: string) => void
  options: ReadonlyArray<{ value: string; label: string }>
  allLabel?: string
  includeAll?: boolean
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-full border border-border bg-background px-3 text-sm text-foreground"
      >
        {includeAll && <option value="">{allLabel}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function camel(value: string): string {
  return value.replace(/_([a-z])/g, (_, char: string) => char.toUpperCase())
}
