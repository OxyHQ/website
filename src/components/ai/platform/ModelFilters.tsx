import { useMemo } from 'react'
import { useTranslation } from '../../../lib/i18n'
import OptionSelect from '../../ui/OptionSelect'
import { AVAILABILITY_STATES } from '../../../lib/ai/availability'
import type { PublicCatalog } from '../../../lib/ai/catalog'
import { EMPTY_FILTERS, hasActiveFilters, type ModelFilterState } from '../../../lib/ai/modelFilters'

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
  // The visible caption is a plain span: the trigger is not a labelable
  // element, so it takes the same words as its accessible name instead.
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-muted-foreground" aria-hidden="true">
        {label}
      </span>
      <OptionSelect
        label={label}
        value={value}
        onValueChange={onChange}
        options={includeAll ? [{ value: '', label: allLabel ?? '' }, ...options] : options}
        className="min-w-36"
      />
    </div>
  )
}

function camel(value: string): string {
  return value.replace(/_([a-z])/g, (_, char: string) => char.toUpperCase())
}
