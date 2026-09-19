import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import PageShell from '../components/layout/PageShell'
import Button from '../components/ui/Button'
import AiBreadcrumbs from '../components/ai/platform/AiBreadcrumbs'
import ModelCard from '../components/ai/platform/ModelCard'
import ModelFilters from '../components/ai/platform/ModelFilters'
import {
  applyFilters,
  filtersFromSearchParams,
  filtersToSearchParams,
  type ModelFilterState,
} from '../lib/ai/modelFilters'
import { CatalogEmptyState, CatalogFreshness } from '../components/ai/platform/CatalogNotice'
import { useTranslation } from '../lib/i18n'
import { useCatalog } from '../lib/ai/useCatalog'
import { entriesForListing } from '../lib/ai/catalog'
import { isCatalogUnpublished } from '../lib/ai/snapshot'

/**
 * `/ai/models` — the public catalogue.
 *
 * The list renders from the build-time snapshot on the FIRST render, so the page
 * never shows a spinner or an empty state it is about to contradict; the live
 * refresh replaces it only when it returns something better. Filtering is
 * client-side over that same list: the catalogue is small enough that paginating
 * it would cost more in crawlability than it saves in bytes.
 *
 * `useSearchParams` comes straight from react-router here rather than through
 * `src/lib/navigation`: that module normalises the trailing slash on link
 * TARGETS, and this only ever rewrites the query string of the current URL.
 */
export default function AIModelsPage() {
  const { t } = useTranslation()
  const { catalog } = useCatalog()
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = useMemo(() => filtersFromSearchParams(searchParams), [searchParams])
  const entries = useMemo(
    () => applyFilters(catalog, entriesForListing(catalog), filters),
    [catalog, filters],
  )

  const onFiltersChange = useCallback(
    (next: ModelFilterState) => {
      // `replace` so twenty filter tweaks do not become twenty back-button
      // presses between the reader and the page they arrived from.
      setSearchParams(filtersToSearchParams(next), { replace: true })
    },
    [setSearchParams],
  )

  const unpublished = isCatalogUnpublished(catalog)

  return (
    <PageShell
      seo={{
        title: t('ai.models.seoTitle'),
        description: t('ai.models.seoDescription'),
        canonicalPath: '/ai/models',
      }}
      navbar={<Navbar />}
      mainClassName="flex-1"
    >
      <AiBreadcrumbs
        crumbs={[{ label: t('ai.breadcrumbHome'), href: '/ai' }, { label: t('ai.models.seoTitle') }]}
      />

      <section className="container pt-10 pb-8">
        <h1 className="text-heading-responsive-lg text-balance text-foreground">
          {t('ai.models.heading')}
        </h1>
        <p className="mt-4 max-w-3xl text-pretty text-lg text-muted-foreground">
          {t('ai.models.lead')}
        </p>
        <div className="mt-4">
          <CatalogFreshness catalog={catalog} />
        </div>
      </section>

      <section className="container pb-24">
        {unpublished ? (
          <CatalogEmptyState />
        ) : (
          <>
            <ModelFilters
              catalog={catalog}
              value={filters}
              onChange={onFiltersChange}
              resultCount={entries.length}
            />
            {entries.length === 0 ? (
              <p className="mt-8 rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
                {t('ai.models.noMatches')}
              </p>
            ) : (
              <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {entries.map((entry) => (
                  <li key={entry.id}>
                    <ModelCard catalog={catalog} entry={entry} />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        <div className="mt-12 flex flex-wrap gap-3">
          <Button href="/ai/pricing" variant="outline" size="sm">
            {t('ai.cta.viewPricing')}
          </Button>
          <Button href="/ai/inference" variant="ghost" size="sm">
            {t('ai.cta.readQuickstart')}
          </Button>
        </div>
      </section>
    </PageShell>
  )
}
