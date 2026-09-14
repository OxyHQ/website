import { useMemo, useState } from 'react'
import { Link } from '../../../lib/navigation'
import { useTranslation } from '../../../lib/i18n'
import { modelPath } from '../../../lib/ai/modelId'
import {
  estimateMonthlyCost,
  formatNanoUsd,
  parseQuantity,
  type EstimateLine,
} from '../../../lib/ai/estimator'
import type { CatalogEntry, PriceUnit, PublicCatalog } from '../../../lib/ai/catalog'

/**
 * The monthly-cost estimator.
 *
 * Every number here is a `bigint` from the moment it leaves the input to the
 * moment it is formatted: quantities are parsed as integers, prices are decimal
 * strings from the catalogue, and the multiplication happens in nano-dollars.
 * A pricing page that computes `0.6 * 1_200_000 / 1_000_000` in floats is off
 * in the third significant figure, and the reader has no way to tell.
 *
 * The estimator never authorises or charges spend — that is Oxy Console's job —
 * and the label says so, because a number this specific reads like a quote.
 */
const UNIT_FIELDS: ReadonlyArray<{ unit: PriceUnit; labelKey: string; initial: string }> = [
  { unit: 'input_token', labelKey: 'ai.pricing.estimatorInput', initial: '1000' },
  { unit: 'cached_input_token', labelKey: 'ai.pricing.estimatorCachedInput', initial: '0' },
  { unit: 'output_token', labelKey: 'ai.pricing.estimatorOutput', initial: '500' },
  { unit: 'reasoning_token', labelKey: 'ai.pricing.estimatorReasoning', initial: '0' },
]

export default function CostEstimator({ catalog }: { catalog: PublicCatalog }) {
  const { t } = useTranslation()
  const priced = useMemo(
    () => catalog.entries.filter((entry) => entry.prices.length > 0),
    [catalog],
  )
  const [selectedId, setSelectedId] = useState(priced[0]?.id ?? '')
  const [requests, setRequests] = useState('100000')
  const [quantities, setQuantities] = useState<Record<string, string>>(() =>
    Object.fromEntries(UNIT_FIELDS.map((field) => [field.unit, field.initial])),
  )

  const entry: CatalogEntry | undefined = priced.find((candidate) => candidate.id === selectedId)

  const result = useMemo(() => {
    if (!entry) return undefined
    const lines: EstimateLine[] = UNIT_FIELDS.filter(
      // A unit the reader left at zero is not part of the workload, and listing
      // it as "no published price" would be noise rather than a warning.
      (field) => parseQuantity(quantities[field.unit] ?? '0') > 0n,
    ).map((field) => ({
      unit: field.unit,
      quantityPerRequest: parseQuantity(quantities[field.unit] ?? '0'),
    }))
    return estimateMonthlyCost({ entry, lines, monthlyRequests: parseQuantity(requests) })
  }, [entry, quantities, requests])

  if (priced.length === 0) {
    return (
      <p className="rounded-2xl border border-border bg-card p-6 text-muted-foreground">
        {t('ai.pricing.estimatorEmpty')}
      </p>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
      <form className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">{t('ai.pricing.estimatorModel')}</span>
          <select
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
            className="h-10 rounded-full border border-border bg-background px-3 text-sm text-foreground"
          >
            {priced.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.name} · {candidate.id}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">{t('ai.pricing.estimatorRequests')}</span>
          <input
            inputMode="numeric"
            value={requests}
            onChange={(event) => setRequests(event.target.value)}
            className="h-10 rounded-full border border-border bg-background px-4 text-sm text-foreground"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          {UNIT_FIELDS.map((field) => (
            <label key={field.unit} className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">{t(field.labelKey)}</span>
              <input
                inputMode="numeric"
                value={quantities[field.unit] ?? '0'}
                onChange={(event) =>
                  setQuantities((current) => ({ ...current, [field.unit]: event.target.value }))
                }
                className="h-10 rounded-full border border-border bg-background px-4 text-sm text-foreground"
              />
            </label>
          ))}
        </div>
      </form>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
        <p className="text-sm text-muted-foreground">{t('ai.pricing.estimatorTotal')}</p>
        <p className="text-3xl text-foreground" aria-live="polite">
          ${result ? formatNanoUsd(result.totalNanoUsd, 2) : '0.00'}
        </p>
        {result && result.unpricedUnits.length > 0 && (
          <p className="text-sm text-warning-text">
            {t('ai.pricing.estimatorUnpriced', {
              units: result.unpricedUnits.map((unit) => t(`ai.pricing.unit${pascal(unit)}`)).join(', '),
            })}
          </p>
        )}
        <p className="text-xs text-muted-foreground">{t('ai.pricing.estimatorLead')}</p>
        {entry && modelPath(entry.id) && (
          <Link
            to={modelPath(entry.id) as string}
            className="text-sm text-foreground underline underline-offset-4"
          >
            {entry.name}
          </Link>
        )}
        <p className="text-xs text-muted-foreground">
          {t('ai.models.priceVersion', {
            version: catalog.priceVersion,
            date: catalog.generatedAt.slice(0, 10),
          })}
        </p>
      </div>
    </div>
  )
}

function pascal(value: string): string {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}
