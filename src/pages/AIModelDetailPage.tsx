import type { ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import PageShell from '../components/layout/PageShell'
import StructuredData from '../components/StructuredData'
import Button from '../components/ui/Button'
import AiBreadcrumbs from '../components/ai/platform/AiBreadcrumbs'
import AvailabilityBadge from '../components/ai/platform/AvailabilityBadge'
import CodeSampleTabs from '../components/ai/platform/CodeSampleTabs'
import { CatalogFreshness } from '../components/ai/platform/CatalogNotice'
import { useTranslation } from '../lib/i18n'
import { useCatalog } from '../lib/ai/useCatalog'
import { modelIdFromParams, modelPath } from '../lib/ai/modelId'
import { displayPrice, isPerMillionUnit } from '../lib/ai/estimator'
import { ctaIntentFor, isPurchasable } from '../lib/ai/availability'
import { consoleLinks, INFERENCE_API_BASE } from '../data/ai/taxonomy'
import {
  deploymentsForEntry,
  findEntry,
  publisherName,
  type CatalogEntry,
  type PublicCatalog,
} from '../lib/ai/catalog'

/**
 * `/ai/models/:publisher/:model` — one catalogue entry in full.
 *
 * Every block on this page renders only when the catalogue carries the fact it
 * describes. There is no "not specified" default and no inferred value: a model
 * with no published price shows a sentence saying the price is not published,
 * which is a different claim from "$0" and from an empty cell.
 */
export default function AIModelDetailPage() {
  const { t } = useTranslation()
  const { catalog } = useCatalog()
  const params = useParams<{ publisher: string; model: string }>()
  const id = modelIdFromParams(params.publisher ?? '', params.model ?? '')
  const entry = findEntry(catalog, id)

  if (!entry) return <NotInCatalogue id={id} />

  const deployments = deploymentsForEntry(catalog, entry)
  const regions = [...new Set(deployments.map((deployment) => deployment.region))]
  const intent = ctaIntentFor(entry.availability)
  const publisher = publisherName(catalog, entry.publisherId)

  return (
    <PageShell
      seo={{
        title: `${entry.name} — ${publisher}`,
        description: entry.description.slice(0, 300),
        canonicalPath: modelPath(entry.id) ?? '/ai/models',
      }}
      navbar={<Navbar />}
      mainClassName="flex-1"
    >
      <ModelStructuredData catalog={catalog} entry={entry} />
      <AiBreadcrumbs
        crumbs={[
          { label: t('ai.breadcrumbHome'), href: '/ai' },
          { label: t('ai.models.seoTitle'), href: '/ai/models' },
          { label: entry.name },
        ]}
      />

      <section className="container pt-10 pb-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
            {entry.kind === 'routing_profile'
              ? t('ai.models.typeRoutingProfile')
              : t('ai.models.typeModel')}
          </span>
          <AvailabilityBadge availability={entry.availability} />
        </div>
        <h1 className="mt-4 text-heading-responsive-lg text-balance text-foreground">{entry.name}</h1>
        <p className="mt-2 text-muted-foreground">{publisher}</p>
        <p className="mt-1 font-mono text-sm text-muted-foreground">
          <span className="sr-only">{t('ai.model.canonicalId')}: </span>
          {entry.id}
        </p>
        {entry.kind === 'routing_profile' && (
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            {t('ai.models.routingProfileNote')}
          </p>
        )}
        <p className="mt-6 max-w-3xl text-pretty text-lg text-foreground/80">{entry.description}</p>

        {entry.deprecation && (
          <div className="mt-6 max-w-3xl rounded-2xl border border-border bg-muted p-5" role="note">
            <p className="text-base text-foreground">{t('ai.model.deprecated')}</p>
            {entry.deprecation.sunsetAt && (
              <p className="mt-1 text-sm text-muted-foreground">
                {t('ai.model.sunset', { date: entry.deprecation.sunsetAt })}
              </p>
            )}
            {entry.deprecation.replacementId && (
              <p className="mt-1 text-sm text-muted-foreground">
                {t('ai.model.replacement', { model: entry.deprecation.replacementId })}
              </p>
            )}
            {entry.deprecation.note && (
              <p className="mt-1 text-sm text-muted-foreground">{entry.deprecation.note}</p>
            )}
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          {isPurchasable(entry.availability) ? (
            <Button href={consoleLinks.createCredential}>{t('ai.cta.startBuilding')}</Button>
          ) : (
            intent !== 'none' && (
              <Button href={`/contact/sales?interest=oxy_inference&model=${encodeURIComponent(entry.id)}`}>
                {t('ai.cta.requestAccess')}
              </Button>
            )
          )}
          <Button href="/ai/models" variant="outline">
            {t('ai.model.backToCatalogue')}
          </Button>
          <Button href="/contact/sales?interest=dedicated_inference" variant="ghost">
            {t('ai.cta.requestEvaluation')}
          </Button>
        </div>
        <div className="mt-6">
          <CatalogFreshness catalog={catalog} />
        </div>
      </section>

      <div className="container grid gap-10 pb-24 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-10">
          {entry.capabilities.length > 0 && (
            <Block heading={t('ai.model.capabilities')}>
              <ul className="flex flex-wrap gap-2">
                {entry.capabilities.map((capability) => (
                  <li
                    key={capability}
                    className="rounded-full border border-border bg-surface px-3 py-1 text-sm text-foreground"
                  >
                    {capability.replace(/_/g, ' ')}
                  </li>
                ))}
              </ul>
            </Block>
          )}

          {(entry.contextTokens !== undefined || entry.maxOutputTokens !== undefined) && (
            <Block heading={t('ai.model.limits')}>
              <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
                {entry.contextTokens !== undefined && (
                  <Row
                    label={t('ai.model.contextWindow')}
                    value={t('ai.model.tokens', { count: entry.contextTokens.toLocaleString() })}
                  />
                )}
                {entry.maxOutputTokens !== undefined && (
                  <Row
                    label={t('ai.model.maxOutput')}
                    value={t('ai.model.tokens', { count: entry.maxOutputTokens.toLocaleString() })}
                  />
                )}
              </dl>
            </Block>
          )}

          <Block heading={t('ai.model.revisions')}>
            {entry.revisions.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('ai.model.noRevisions')}</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {entry.revisions.map((revision) => (
                  <li key={revision.id} className="flex flex-wrap items-center gap-3">
                    <code className="rounded bg-muted px-2 py-0.5 font-mono text-sm text-foreground">
                      {entry.id}@{revision.id}
                    </code>
                    <AvailabilityBadge availability={revision.availability} />
                    {revision.releasedAt && (
                      <span className="text-sm text-muted-foreground">{revision.releasedAt}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Block>

          <Block heading={t('ai.model.serving')}>
            {deployments.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('ai.model.noDeployments')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-sm">
                  <caption className="sr-only">{t('ai.model.serving')}</caption>
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th scope="col" className="py-2 pe-4 font-normal">
                        {t('ai.models.filterProvider')}
                      </th>
                      <th scope="col" className="py-2 pe-4 font-normal">
                        {t('ai.model.regions')}
                      </th>
                      <th scope="col" className="py-2 pe-4 font-normal">
                        {t('ai.model.retention')}
                      </th>
                      <th scope="col" className="py-2 font-normal">
                        {t('ai.model.training')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {deployments.map((deployment) => (
                      <tr key={deployment.id} className="border-b border-border/60">
                        <th scope="row" className="py-2 pe-4 text-start font-normal text-foreground">
                          {catalog.providers.find((p) => p.id === deployment.providerId)?.name ??
                            deployment.providerId}
                        </th>
                        <td className="py-2 pe-4 text-foreground">{deployment.region}</td>
                        <td className="py-2 pe-4 text-foreground">
                          {t(`ai.model.retention${capitalise(deployment.dataPolicy.retention)}`)}
                          {deployment.dataPolicy.retentionWindowDays !== undefined &&
                            ` · ${deployment.dataPolicy.retentionWindowDays}d`}
                        </td>
                        <td className="py-2 text-foreground">
                          {t(`ai.model.training${trainingKey(deployment.dataPolicy.trainsOnContent)}`)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {regions.length > 0 && (
              <p className="mt-3 text-sm text-muted-foreground">
                {t('ai.model.regions')}: {regions.join(', ')}
              </p>
            )}
            {deployments.some((deployment) => deployment.dataPolicy.zeroRetentionAvailable) && (
              <p className="mt-2 text-sm text-success-text">{t('ai.model.zeroRetention')}</p>
            )}
          </Block>

          <Block heading={t('ai.model.pricing')}>
            {entry.prices.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('ai.model.noPricing')}</p>
            ) : (
              <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
                {entry.prices.map((price) => (
                  <Row
                    key={`${price.unit}-${price.deploymentId ?? 'any'}`}
                    label={t(`ai.pricing.unit${pascal(price.unit)}`)}
                    value={`$${displayPrice(price)} ${
                      isPerMillionUnit(price.unit) ? t('ai.pricing.perMillion') : t('ai.pricing.perUnit')
                    }`}
                  />
                ))}
              </dl>
            )}
          </Block>

          {entry.limitations.length > 0 && (
            <Block heading={t('ai.model.knownLimitations')}>
              <ul className="list-disc ps-5 text-sm text-muted-foreground">
                {entry.limitations.map((limitation) => (
                  <li key={limitation}>{limitation}</li>
                ))}
              </ul>
            </Block>
          )}

          <Block heading={t('ai.model.exampleHeading')}>
            <CodeSampleTabs
              samples={[
                {
                  key: 'curl',
                  label: 'cURL',
                  language: 'bash',
                  code: `curl ${INFERENCE_API_BASE}/chat/completions \\
  -H "Authorization: Bearer $OXY_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${entry.id}",
    "messages": [{ "role": "user", "content": "Hello." }]
  }'`,
                },
              ]}
            />
          </Block>
        </div>

        <aside className="flex flex-col gap-6">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-base text-foreground">{t('ai.model.dataPolicy')}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Retention and training are properties of the route that serves a request, listed per
              deployment above.
            </p>
            <Button href="/ai/trust" variant="ghost" size="sm" className="mt-3">
              {t('ai.trust.seoTitle')}
            </Button>
          </div>

          {(entry.license || entry.attribution || entry.baseModelId) && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-base text-foreground">{t('ai.model.licence')}</h2>
              <dl className="mt-2 flex flex-col gap-2 text-sm">
                {entry.license && <Row label={t('ai.model.licence')} value={entry.license} />}
                {entry.attribution && (
                  <Row label={t('ai.model.attribution')} value={entry.attribution} />
                )}
                {entry.baseModelId && (
                  <Row label={t('ai.model.provenance')} value={entry.baseModelId} />
                )}
              </dl>
            </div>
          )}

          {(entry.modelCardUrl || entry.evaluationsUrl) && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-base text-foreground">{t('ai.model.modelCard')}</h2>
              <ul className="mt-2 flex flex-col gap-1 text-sm">
                {entry.modelCardUrl && (
                  <li>
                    <a
                      className="text-foreground underline underline-offset-4"
                      href={entry.modelCardUrl}
                      rel="noreferrer nofollow"
                    >
                      {t('ai.model.modelCard')}
                    </a>
                  </li>
                )}
                {entry.evaluationsUrl && (
                  <li>
                    <a
                      className="text-foreground underline underline-offset-4"
                      href={entry.evaluationsUrl}
                      rel="noreferrer nofollow"
                    >
                      {t('ai.model.evaluations')}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </PageShell>
  )
}

function NotInCatalogue({ id }: { id: string }) {
  const { t } = useTranslation()
  return (
    <PageShell
      seo={{
        title: t('ai.model.notFoundTitle'),
        description: t('ai.model.notFoundBody'),
        canonicalPath: '/ai/models',
        // A model that is not in the catalogue must not be indexed under its own
        // URL: the page is a correct answer to a wrong request, not a document.
        noIndex: true,
      }}
      navbar={<Navbar />}
      mainClassName="flex-1"
    >
      <section className="container flex flex-col items-start gap-4 py-24">
        <h1 className="text-heading-responsive-md text-foreground">{t('ai.model.notFoundTitle')}</h1>
        <p className="max-w-xl text-muted-foreground">{t('ai.model.notFoundBody')}</p>
        <p className="font-mono text-sm text-muted-foreground">{id}</p>
        <Button href="/ai/models" variant="outline">
          {t('ai.model.backToCatalogue')}
        </Button>
      </section>
    </PageShell>
  )
}

/**
 * `Product` with an `Offer` only where there is something to buy.
 *
 * A model in preview gets the product description and no offer at all, rather
 * than an offer priced at zero — a `price: "0"` placeholder is a statement that
 * the thing is free, and search engines read it as one.
 */
function ModelStructuredData({ catalog, entry }: { catalog: PublicCatalog; entry: CatalogEntry }) {
  const inputPrice = entry.prices.find((price) => price.unit === 'input_token')
  const offer =
    isPurchasable(entry.availability) && inputPrice
      ? {
          offers: {
            '@type': 'Offer',
            price: inputPrice.amountUsd,
            priceCurrency: 'USD',
            description: 'Per 1M input tokens',
            availability: 'https://schema.org/InStock',
          },
        }
      : {}

  return (
    <StructuredData
      data={{
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: entry.name,
        sku: entry.id,
        description: entry.description,
        brand: { '@type': 'Brand', name: publisherName(catalog, entry.publisherId) },
        ...offer,
      }}
    />
  )
}

function Block({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-xl text-foreground">{heading}</h2>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/60 py-1.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-end text-foreground">{value}</dd>
    </div>
  )
}

function capitalise(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function pascal(value: string): string {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

function trainingKey(value: string): string {
  if (value === 'opt_out_available') return 'OptOut'
  return capitalise(value)
}
