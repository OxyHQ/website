import { useMemo } from 'react'
import Navbar from '../components/layout/Navbar'
import PageShell from '../components/layout/PageShell'
import Button from '../components/ui/Button'
import AiBreadcrumbs from '../components/ai/platform/AiBreadcrumbs'
import AvailabilityBadge from '../components/ai/platform/AvailabilityBadge'
import CostEstimator from '../components/ai/platform/CostEstimator'
import { CatalogEmptyState, CatalogFreshness } from '../components/ai/platform/CatalogNotice'
import { Link } from '../lib/navigation'
import { useTranslation } from '../lib/i18n'
import { useCatalog } from '../lib/ai/useCatalog'
import { isCatalogUnpublished } from '../lib/ai/snapshot'
import { entriesForListing, publisherName, type UnitPrice } from '../lib/ai/catalog'
import { displayPrice, isPerMillionUnit } from '../lib/ai/estimator'
import { modelPath } from '../lib/ai/modelId'
import { OXY_INFERENCE_AVAILABILITY, consoleLinks } from '../data/ai/taxonomy'

/**
 * `/ai/pricing` — what INFERENCE costs.
 *
 * The page this replaced fetched `api.alia.onl/billing/plans?product=alia` and
 * rendered Alia's subscription tiers, credit allowances and channel counts under
 * the heading "Oxy AI pricing". Those are a product's plans, sold by a different
 * team on a different site, and presenting them as the platform's API pricing
 * made the two look like one purchase. Alia now gets a visible handoff instead
 * of a table.
 *
 * What replaces it renders per-model, per-unit prices straight from the
 * catalogue snapshot — never a price written here — with the price version they
 * belong to, and an estimator that computes in integers.
 */
export default function AIPricingPage() {
  const { t } = useTranslation()
  const { catalog } = useCatalog()
  const unpublished = isCatalogUnpublished(catalog)

  const rows = useMemo(() => {
    return entriesForListing(catalog)
      .filter((entry) => entry.prices.length > 0)
      .map((entry) => ({
        entry,
        input: entry.prices.find((price) => price.unit === 'input_token'),
        cached: entry.prices.find((price) => price.unit === 'cached_input_token'),
        output: entry.prices.find((price) => price.unit === 'output_token'),
        reasoning: entry.prices.find((price) => price.unit === 'reasoning_token'),
        other: entry.prices.filter(
          (price) =>
            !['input_token', 'cached_input_token', 'output_token', 'reasoning_token'].includes(
              price.unit,
            ),
        ),
      }))
  }, [catalog])

  return (
    <PageShell
      seo={{
        title: t('ai.pricing.seoTitle'),
        description: t('ai.pricing.seoDescription'),
        canonicalPath: '/ai/pricing',
      }}
      navbar={<Navbar />}
      mainClassName="flex-1"
    >
      <AiBreadcrumbs
        crumbs={[
          { label: t('ai.breadcrumbHome'), href: '/ai' },
          { label: t('ai.pricing.seoTitle') },
        ]}
      />

      <section className="container pt-10 pb-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-heading-responsive-lg text-balance text-foreground">
            {t('ai.pricing.heading')}
          </h1>
          <AvailabilityBadge availability={OXY_INFERENCE_AVAILABILITY} />
        </div>
        <p className="mt-4 max-w-3xl text-pretty text-lg text-muted-foreground">
          {t('ai.pricing.lead')}
        </p>
        <div className="mt-4">
          <CatalogFreshness catalog={catalog} />
        </div>
      </section>

      {/* ── Handoffs, before the table ───────────────────────────────────
          Someone who arrived looking for Alia's plans should find out in the
          first screen, not after reading a token price list. */}
      <section className="container pb-10">
        <div className="grid gap-4 md:grid-cols-2">
          <Handoff
            title={t('ai.pricing.aliaHandoffTitle')}
            body={t('ai.pricing.aliaHandoffBody')}
            cta={t('ai.pricing.aliaHandoffCta')}
            href="https://alia.onl/pricing"
            external
          />
          <Handoff
            title={t('ai.pricing.ecosystemHandoffTitle')}
            body={t('ai.pricing.ecosystemHandoffBody')}
            cta={t('ai.pricing.ecosystemHandoffCta')}
            href="/pricing"
          />
        </div>
      </section>

      {/* ── Per-model price table ────────────────────────────────────── */}
      <section id="table" className="container scroll-mt-24 pb-16">
        <h2 className="text-heading-responsive-md text-foreground">{t('ai.pricing.tableHeading')}</h2>
        <div className="mt-6">
          {unpublished || rows.length === 0 ? (
            <CatalogEmptyState />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-sm">
                <caption className="sr-only">{t('ai.pricing.tableHeading')}</caption>
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th scope="col" className="py-2 pe-4 font-normal">
                      {t('ai.models.columnModel')}
                    </th>
                    <th scope="col" className="py-2 pe-4 font-normal">
                      {t('ai.models.columnPublisher')}
                    </th>
                    <th scope="col" className="py-2 pe-4 text-end font-normal">
                      {t('ai.pricing.unitInputToken')}
                    </th>
                    <th scope="col" className="py-2 pe-4 text-end font-normal">
                      {t('ai.pricing.unitCachedInputToken')}
                    </th>
                    <th scope="col" className="py-2 pe-4 text-end font-normal">
                      {t('ai.pricing.unitOutputToken')}
                    </th>
                    <th scope="col" className="py-2 text-end font-normal">
                      {t('ai.pricing.unitReasoningToken')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const href = modelPath(row.entry.id)
                    return (
                      <tr key={row.entry.id} className="border-b border-border/60">
                        <th scope="row" className="py-2 pe-4 text-start font-normal">
                          {href ? (
                            <Link to={href} className="text-foreground underline-offset-4 hover:underline">
                              {row.entry.name}
                            </Link>
                          ) : (
                            <span className="text-foreground">{row.entry.name}</span>
                          )}
                          <span className="block font-mono text-xs text-muted-foreground">
                            {row.entry.id}
                          </span>
                        </th>
                        <td className="py-2 pe-4 text-muted-foreground">
                          {publisherName(catalog, row.entry.publisherId)}
                        </td>
                        <PriceCell price={row.input} />
                        <PriceCell price={row.cached} />
                        <PriceCell price={row.output} />
                        <PriceCell price={row.reasoning} last />
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {rows.some((row) => row.other.length > 0) && (
                <p className="mt-4 text-sm text-muted-foreground">
                  Audio, image, embedding and rerank units are priced per model and shown on the
                  model page.
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── Estimator ────────────────────────────────────────────────── */}
      <section id="estimator" className="container scroll-mt-24 pb-16">
        <h2 className="text-heading-responsive-md text-foreground">
          {t('ai.pricing.estimatorHeading')}
        </h2>
        <p className="mt-3 max-w-3xl text-muted-foreground">{t('ai.pricing.estimatorLead')}</p>
        <div className="mt-6">
          <CostEstimator catalog={catalog} />
        </div>
      </section>

      {/* ── Terms ────────────────────────────────────────────────────── */}
      <section className="container pb-16">
        <h2 className="text-heading-responsive-md text-foreground">{t('ai.pricing.termsHeading')}</h2>
        <p className="mt-3 max-w-3xl text-pretty text-muted-foreground">
          {t('ai.pricing.termsBody')}
        </p>
      </section>

      {/* ── Which path is yours ──────────────────────────────────────── */}
      <section className="container pb-24">
        <h2 className="text-heading-responsive-md text-foreground">{t('ai.pricing.pathsHeading')}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <PathCard
            title={t('ai.pricing.pathSelfServe')}
            body={t('ai.pricing.pathSelfServeBody')}
            cta={t('ai.cta.openConsole')}
            href={consoleLinks.billing}
            external
          />
          <PathCard
            title={t('ai.pricing.pathDedicated')}
            body={t('ai.pricing.pathDedicatedBody')}
            cta={t('ai.cta.talkToSales')}
            href="/contact/sales?interest=dedicated_inference"
          />
          <PathCard
            title={t('ai.pricing.pathAlia')}
            body={t('ai.pricing.pathAliaBody')}
            cta={t('ai.pricing.aliaHandoffCta')}
            href="https://alia.onl/pricing"
            external
          />
          <PathCard
            title={t('ai.pricing.pathEcosystem')}
            body={t('ai.pricing.pathEcosystemBody')}
            cta={t('ai.pricing.ecosystemHandoffCta')}
            href="/pricing"
          />
        </div>
      </section>
    </PageShell>
  )
}

function PriceCell({ price, last = false }: { price?: UnitPrice; last?: boolean }) {
  const { t } = useTranslation()
  return (
    <td className={`py-2 text-end ${last ? '' : 'pe-4'}`}>
      {price ? (
        <>
          <span className="text-foreground">${displayPrice(price)}</span>{' '}
          <span className="text-xs text-muted-foreground">
            {isPerMillionUnit(price.unit) ? t('ai.pricing.perMillion') : t('ai.pricing.perUnit')}
          </span>
        </>
      ) : (
        // An em dash, not "$0": a unit this model does not charge for and a unit
        // whose price is not published both belong here, and neither is free.
        <span className="text-muted-foreground" aria-label="Not published">
          —
        </span>
      )}
    </td>
  )
}

function Handoff({
  title,
  body,
  cta,
  href,
  external = false,
}: {
  title: string
  body: string
  cta: string
  href: string
  external?: boolean
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="text-lg text-foreground">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      <Button href={href} variant="outline" size="sm" className="mt-4">
        {cta}
        {external && <span className="sr-only"> (external)</span>}
      </Button>
    </div>
  )
}

function PathCard({
  title,
  body,
  cta,
  href,
  external = false,
}: {
  title: string
  body: string
  cta: string
  href: string
  external?: boolean
}) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-5">
      <h3 className="text-base text-foreground">{title}</h3>
      <p className="mt-2 flex-1 text-sm text-muted-foreground">{body}</p>
      <Button href={href} variant="ghost" size="sm" className="mt-4 w-fit">
        {cta}
        {external && <span className="sr-only"> (external)</span>}
      </Button>
    </div>
  )
}
