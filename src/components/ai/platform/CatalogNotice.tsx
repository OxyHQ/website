import { Link } from '../../../lib/navigation'
import { useTranslation } from '../../../lib/i18n'
import { isCatalogUnpublished, snapshotAgeInDays, STALE_SNAPSHOT_DAYS } from '../../../lib/ai/snapshot'
import type { PublicCatalog } from '../../../lib/ai/catalog'

/**
 * What the catalogue surfaces say when there is nothing to list, or when what
 * they are listing is old.
 *
 * There are two genuinely different situations and they get two different
 * messages. An unpublished catalogue is a product fact — the public catalogue
 * has not been published yet — and the page says so and offers the way in that
 * does exist. A stale snapshot is an operational fact, and it gets a single
 * restrained line rather than a banner, because prices from last week are still
 * prices.
 */
export function CatalogEmptyState({ className = '' }: { className?: string }) {
  const { t } = useTranslation()
  return (
    <div
      className={`rounded-2xl border border-border bg-card p-8 text-center ${className}`}
      role="status"
    >
      <h3 className="text-xl text-foreground">{t('ai.models.emptyTitle')}</h3>
      <p className="mx-auto mt-3 max-w-xl text-pretty text-muted-foreground">
        {t('ai.models.emptyBody')}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          to="/contact/sales?interest=oxy_inference"
          className="inline-flex h-10 items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background hover:bg-foreground/90"
        >
          {t('ai.cta.requestAccess')}
        </Link>
        <Link
          to="/ai/inference"
          className="inline-flex h-10 items-center justify-center rounded-full border border-border px-5 text-sm font-medium text-foreground hover:bg-accent"
        >
          {t('ai.models.emptySecondary')}
        </Link>
      </div>
    </div>
  )
}

/**
 * The freshness line, shown only when it changes what a reader should do.
 *
 * A snapshot younger than the threshold gets nothing at all: a "last updated"
 * stamp on every page teaches people to ignore it, which is exactly the wrong
 * reflex for the day it matters.
 */
export function CatalogFreshness({ catalog }: { catalog: PublicCatalog }) {
  const { t } = useTranslation()
  if (isCatalogUnpublished(catalog)) return null
  const age = snapshotAgeInDays(catalog)
  const stamp = formatDate(catalog.generatedAt)

  return (
    <p className="text-sm text-muted-foreground">
      {t('ai.models.priceVersion', { version: catalog.priceVersion, date: stamp })}
      {age !== undefined && age >= STALE_SNAPSHOT_DAYS && (
        <span className="ms-2 text-warning-text">{t('ai.models.staleNotice')}</span>
      )}
    </p>
  )
}

function formatDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toISOString().slice(0, 10)
}
