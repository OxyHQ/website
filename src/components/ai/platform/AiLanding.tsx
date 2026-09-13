import { useTranslation } from '../../../lib/i18n'
import { Link } from '../../../lib/navigation'
import Button from '../../ui/Button'
import RecentNewsSection from '../../newsroom/RecentNewsSection'
import AIResearchSection from '../AIResearchSection'
import AiSection from './AiSection'
import AvailabilityBadge from './AvailabilityBadge'
import ServiceCard from './ServiceCard'
import CodeSampleTabs from './CodeSampleTabs'
import ModelCard from './ModelCard'
import RoutingDiagram from './RoutingDiagram'
import { CatalogEmptyState, CatalogFreshness } from './CatalogNotice'
import { useCatalog } from '../../../lib/ai/useCatalog'
import { entriesForListing } from '../../../lib/ai/catalog'
import { aiServices, OXY_INFERENCE_AVAILABILITY, consoleLinks } from '../../../data/ai/taxonomy'
import { quickstartSamples } from '../../../data/ai/quickstart'
import {
  aliaModelsPreview,
  infrastructureTiers,
  pricingSummary,
  productsOnPlatform,
  routingCapabilities,
  trustSummary,
} from '../../../data/ai/landing'
import { enterpriseInferenceCapabilities } from '../../../data/ai/enterprise'
import { ctaIntentFor } from '../../../lib/ai/availability'

/** How many catalogue entries the landing previews before sending people on. */
const PREVIEW_COUNT = 6

/**
 * `/ai` — the Oxy AI umbrella.
 *
 * The page answers, in order: what is this, what is it made of, how do I call
 * it, what can I call, what happens in between, where does it run, what about
 * my organization, what about my data, what does it cost, what did you build on
 * it, and what are you publishing yourselves.
 *
 * Two things it deliberately does not do. It does not run inference from the
 * hero: an anonymous prompt box on a marketing page is an unmetered, unowned
 * call to a paid third party, and it would need an abuse design, hard limits
 * and a named cost owner before it earned its place. And it does not put
 * documentation in the product chooser — docs are a link on the service they
 * document.
 */
export default function AiLanding() {
  const { t } = useTranslation()
  const { catalog } = useCatalog()
  const entries = entriesForListing(catalog).slice(0, PREVIEW_COUNT)
  const inferenceIntent = ctaIntentFor(OXY_INFERENCE_AVAILABILITY)
  const primaryHref =
    inferenceIntent === 'start_building'
      ? consoleLinks.createApplication
      : '/contact/sales?interest=oxy_inference'

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="container pt-24 pb-12 sm:pt-32">
        <div className="flex max-w-4xl flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              {t('ai.heroEyebrow')}
            </p>
            <AvailabilityBadge availability={OXY_INFERENCE_AVAILABILITY} />
          </div>
          <h1 className="text-heading-responsive-lg text-balance text-foreground">
            {t('ai.heroTitle')}
          </h1>
          <p className="max-w-2xl text-pretty text-lg text-muted-foreground">
            {t('ai.heroSubtitle')}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button href={primaryHref} responsive>
              {t(`ai.cta.${inferenceIntent === 'start_building' ? 'startBuilding' : 'requestAccess'}`)}
            </Button>
            <Button href="/ai/models" variant="outline" responsive>
              {t('ai.cta.exploreModels')}
            </Button>
            <Button href="/contact/sales" variant="ghost" responsive>
              {t('ai.cta.talkToSales')}
            </Button>
          </div>
        </div>
        <RoutingDiagram className="mt-14" />
      </section>

      {/* ── What Oxy AI is made of ───────────────────────────────────── */}
      <AiSection
        id="services"
        heading={t('ai.sections.services')}
        description={t('ai.sections.servicesLead')}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {aiServices.map((service) => (
            <ServiceCard key={service.key} service={service} />
          ))}
        </div>
      </AiSection>

      {/* ── Quickstart ───────────────────────────────────────────────── */}
      <AiSection
        id="quickstart"
        heading={t('ai.quickstart.heading')}
        description={t('ai.quickstart.description')}
        meta={<AvailabilityBadge availability={OXY_INFERENCE_AVAILABILITY} />}
      >
        <CodeSampleTabs samples={quickstartSamples} caption={t('ai.quickstart.modelPlaceholderNote')} />
        <div className="mt-6 flex flex-wrap gap-3">
          <Button href="/ai/inference#quickstart" variant="outline" size="sm">
            {t('ai.cta.readQuickstart')}
          </Button>
          <Button href={consoleLinks.root} variant="ghost" size="sm">
            {t('ai.cta.openConsole')}
          </Button>
        </div>
      </AiSection>

      {/* ── Model preview ────────────────────────────────────────────── */}
      <AiSection
        id="models"
        heading={t('ai.sections.models')}
        description={t('ai.models.lead')}
        meta={<CatalogFreshness catalog={catalog} />}
      >
        {entries.length === 0 ? (
          <CatalogEmptyState />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {entries.map((entry) => (
                <ModelCard key={entry.id} catalog={catalog} entry={entry} />
              ))}
            </div>
            <div className="mt-6">
              <Button href="/ai/models" variant="outline" size="sm">
                {t('ai.cta.viewAllModels')}
              </Button>
            </div>
          </>
        )}
      </AiSection>

      {/* ── Routing and control ──────────────────────────────────────── */}
      <AiSection id="routing" heading={t('ai.sections.routing')} description={t('ai.routing.lead')}>
        <ul className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {routingCapabilities.map((capability) => (
            <li key={capability.key} className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base text-foreground">{capability.title}</h3>
                <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                  {capability.state === 'implemented'
                    ? t('ai.routing.implemented')
                    : t('ai.routing.planned')}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{capability.description}</p>
            </li>
          ))}
        </ul>
      </AiSection>

      {/* ── Routed, managed, dedicated ───────────────────────────────── */}
      <AiSection
        id="managed"
        heading={t('ai.sections.infrastructure')}
        description={t('ai.infrastructure.lead')}
      >
        <div className="grid gap-4 md:grid-cols-3">
          {infrastructureTiers.map((tier) => (
            <div key={tier.key} className="rounded-2xl border border-border bg-card p-6">
              <h3 className="text-lg text-foreground">{tier.title}</h3>
              <p className="mt-2 text-pretty text-sm text-muted-foreground">{tier.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button href="/ai/enterprise" variant="outline" size="sm">
            {t('ai.enterprise.seoTitle')}
          </Button>
          <Button href="/contact/sales?interest=dedicated_inference" variant="ghost" size="sm">
            {t('ai.cta.requestEvaluation')}
          </Button>
        </div>
      </AiSection>

      {/* ── For organizations ────────────────────────────────────────── */}
      <AiSection
        id="enterprise"
        heading={t('ai.sections.enterprise')}
        description={t('ai.enterprise.heroSubtitle')}
      >
        <ul className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {enterpriseInferenceCapabilities.slice(0, 8).map((capability) => (
            <li key={capability.key} className="flex flex-col gap-1">
              <h3 className="text-base text-foreground">{capability.title}</h3>
              <p className="text-sm text-muted-foreground">{capability.description}</p>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button href="/ai/enterprise" variant="outline" size="sm">
            {t('common.learnMore')}
          </Button>
          <Button href="/contact/sales" size="sm">
            {t('ai.cta.talkToSales')}
          </Button>
        </div>
      </AiSection>

      {/* ── Data and policy ──────────────────────────────────────────── */}
      <AiSection id="trust" heading={t('ai.sections.trust')} description={trustSummary.heading}>
        <div className="grid gap-4 md:grid-cols-3">
          {[trustSummary.oxyStatement, trustSummary.routeStatement, trustSummary.constraintStatement].map(
            (statement) => (
              <p
                key={statement.slice(0, 24)}
                className="rounded-2xl border border-border bg-card p-6 text-pretty text-sm text-foreground/80"
              >
                {statement}
              </p>
            ),
          )}
        </div>
        <div className="mt-6">
          <Button href="/ai/trust" variant="outline" size="sm">
            {t('common.readMore')}
          </Button>
        </div>
      </AiSection>

      {/* ── Pricing summary ──────────────────────────────────────────── */}
      <AiSection id="pricing" heading={t('ai.sections.pricing')} description={pricingSummary.payg}>
        <p className="max-w-3xl text-pretty text-muted-foreground">{pricingSummary.enterprise}</p>
        <p className="mt-4 max-w-3xl text-pretty text-sm text-muted-foreground">
          {pricingSummary.aliaNote}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button href="/ai/pricing" variant="outline" size="sm">
            {t('ai.cta.viewPricing')}
          </Button>
          <a
            className="inline-flex h-9 items-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            href="https://alia.onl/pricing"
            rel="noreferrer"
          >
            {t('ai.pricing.aliaHandoffCta')}
          </a>
        </div>
      </AiSection>

      {/* ── Products built on the platform ───────────────────────────── */}
      {/*
        Links rather than a second set of service cards. Alia and Codea are
        already in the chooser above; repeating the same two cards halfway down
        the page reads as a layout mistake, not as emphasis. What this section
        adds is the SENTENCE — that Oxy builds its own products on the platform
        it sells, and that neither of them owns the infrastructure.
      */}
      <AiSection
        id="products"
        heading={t('ai.sections.products')}
        description={productsOnPlatform.body}
      >
        <ul className="flex flex-wrap gap-x-8 gap-y-3">
          {aiServices
            .filter((service) => service.audience === 'people')
            .map((service) => (
              <li key={service.key}>
                {service.external ? (
                  <a
                    className="text-base text-foreground underline underline-offset-4 hover:text-muted-foreground"
                    href={service.href}
                    rel="noreferrer"
                  >
                    {service.name}
                  </a>
                ) : (
                  <Link
                    className="text-base text-foreground underline underline-offset-4 hover:text-muted-foreground"
                    to={service.href}
                  >
                    {service.name}
                  </Link>
                )}
                <span className="ms-2 text-sm text-muted-foreground">{service.audienceLabel}</span>
              </li>
            ))}
        </ul>
      </AiSection>

      {/* ── Alia Models ──────────────────────────────────────────────── */}
      <AiSection
        id="alia-models"
        heading={t('ai.sections.aliaModels')}
        meta={<AvailabilityBadge availability="coming_soon" />}
        description={aliaModelsPreview.body}
      >
        <p className="max-w-3xl text-pretty text-muted-foreground">{aliaModelsPreview.commitment}</p>
        <p className="mt-6 text-sm text-muted-foreground">
          <Link to="/newsroom" className="underline underline-offset-4 hover:text-foreground">
            {t('ai.sections.news')}
          </Link>
        </p>
      </AiSection>

      {/* ── Research ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-16 sm:py-24">
        <AIResearchSection />
      </section>

      {/* ── News ─────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24">
        <RecentNewsSection
          title={t('ai.sections.news')}
          linkText={t('common.viewAll')}
          search="AI"
          href="/newsroom"
        />
      </section>
    </>
  )
}
