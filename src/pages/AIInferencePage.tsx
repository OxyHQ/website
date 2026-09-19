import Navbar from '../components/layout/Navbar'
import PageShell from '../components/layout/PageShell'
import StructuredData from '../components/StructuredData'
import Button from '../components/ui/Button'
import AiSection from '../components/ai/platform/AiSection'
import AiBreadcrumbs from '../components/ai/platform/AiBreadcrumbs'
import AvailabilityBadge from '../components/ai/platform/AvailabilityBadge'
import CodeSampleTabs from '../components/ai/platform/CodeSampleTabs'
import RoutingDiagram from '../components/ai/platform/RoutingDiagram'
import { useTranslation } from '../lib/i18n'
import { ctaIntentFor } from '../lib/ai/availability'
import {
  OXY_INFERENCE_AVAILABILITY,
  INFERENCE_API_BASE,
  consoleLinks,
} from '../data/ai/taxonomy'
import { advancedSamples, quickstartSamples, CREDENTIAL_ENV_VAR } from '../data/ai/quickstart'
import {
  gettingStartedSteps,
  inferenceCapabilities,
  inferenceConcepts,
  operationalTopics,
} from '../data/ai/inference'

/**
 * `/ai/inference` — the service page a technical evaluator reads before asking
 * for access.
 *
 * Everything a reader needs to judge the service is static text and static
 * code: nothing on this page waits for a fetch, so it is complete on first
 * render and cannot show a half-loaded answer to "can this serve my workload".
 * The only dynamic thing an inference page could offer is a live model list, and
 * that belongs on `/ai/models`, where an empty catalogue can be explained rather
 * than implied.
 */
export default function AIInferencePage() {
  const { t } = useTranslation()
  const intent = ctaIntentFor(OXY_INFERENCE_AVAILABILITY)
  const primaryHref =
    intent === 'start_building'
      ? consoleLinks.createApplication
      : '/contact/sales?interest=oxy_inference'
  const primaryLabel = intent === 'start_building' ? t('ai.cta.startBuilding') : t('ai.cta.requestAccess')

  return (
    <PageShell
      seo={{
        title: t('ai.inference.seoTitle'),
        description: t('ai.inference.seoDescription'),
        canonicalPath: '/ai/inference',
      }}
      navbar={<Navbar />}
      mainClassName="flex-1"
    >
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: 'Oxy Inference',
          serviceType: 'Inference API',
          description: t('ai.inference.seoDescription'),
          provider: { '@type': 'Organization', name: 'Oxy', url: 'https://oxy.so/' },
        }}
      />
      <AiBreadcrumbs
        crumbs={[
          { label: t('ai.breadcrumbHome'), href: '/ai' },
          { label: t('ai.inference.seoTitle') },
        ]}
      />

      <section className="container pt-10 pb-8">
        <div className="flex max-w-3xl flex-col gap-5">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              {t('ai.inference.heroEyebrow')}
            </p>
            <AvailabilityBadge availability={OXY_INFERENCE_AVAILABILITY} />
          </div>
          <h1 className="text-heading-responsive-lg text-balance text-foreground">
            {t('ai.inference.heroTitle')}
          </h1>
          <p className="text-pretty text-lg text-muted-foreground">
            {t('ai.inference.heroSubtitle')}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button href={primaryHref} responsive>
              {primaryLabel}
            </Button>
            <Button href="/ai/models" variant="outline" responsive>
              {t('ai.cta.exploreModels')}
            </Button>
            <Button href="/ai/pricing" variant="ghost" responsive>
              {t('ai.cta.viewPricing')}
            </Button>
          </div>
        </div>
        <RoutingDiagram className="mt-12" />
      </section>

      {/* ── Account → application → credential → call ─────────────────── */}
      <AiSection
        id="start"
        heading={t('ai.inference.startHeading')}
        description={t('ai.inference.startLead')}
      >
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {gettingStartedSteps.map((step, index) => (
            <li key={step.title} className="rounded-2xl border border-border bg-card p-5">
              <span className="text-sm text-muted-foreground">{index + 1}</span>
              <h3 className="mt-1 text-lg text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button href={consoleLinks.createApplication} variant="outline" size="sm">
            {t('ai.cta.openConsole')}
          </Button>
        </div>
      </AiSection>

      {/* ── Quickstart ───────────────────────────────────────────────── */}
      <AiSection
        id="quickstart"
        heading={t('ai.quickstart.heading')}
        description={
          <>
            {t('ai.quickstart.description')}{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm text-foreground">
              {INFERENCE_API_BASE}
            </code>
          </>
        }
      >
        <CodeSampleTabs
          samples={quickstartSamples}
          caption={t('ai.quickstart.modelPlaceholderNote')}
        />
        <p className="mt-4 text-sm text-muted-foreground">
          Every sample reads its credential from{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
            {CREDENTIAL_ENV_VAR}
          </code>
          . A key belongs in the environment, never in a file you can commit.
        </p>

        <div className="mt-12">
          <h3 className="text-xl text-foreground">{t('ai.quickstart.advancedHeading')}</h3>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {t('ai.quickstart.advancedDescription')}
          </p>
          <CodeSampleTabs samples={advancedSamples} className="mt-6" />
        </div>
      </AiSection>

      {/* ── Capabilities ─────────────────────────────────────────────── */}
      <AiSection
        id="capabilities"
        heading={t('ai.inference.capabilitiesHeading')}
        description={t('ai.inference.capabilitiesLead')}
      >
        <ul className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {inferenceCapabilities.map((capability) => (
            <li key={capability.key} className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base text-foreground">{capability.title}</h3>
                <AvailabilityBadge availability={capability.availability} />
              </div>
              <p className="text-sm text-muted-foreground">{capability.description}</p>
            </li>
          ))}
        </ul>
      </AiSection>

      {/* ── Vocabulary ───────────────────────────────────────────────── */}
      <AiSection
        id="concepts"
        heading={t('ai.inference.conceptsHeading')}
        description={t('ai.inference.conceptsLead')}
      >
        <dl className="grid gap-x-10 gap-y-6 md:grid-cols-2">
          {inferenceConcepts.map((concept) => (
            <div key={concept.term}>
              <dt className="text-base text-foreground">{concept.term}</dt>
              <dd className="mt-1 text-sm text-muted-foreground">{concept.definition}</dd>
            </div>
          ))}
        </dl>
      </AiSection>

      {/* ── Production concerns ──────────────────────────────────────── */}
      <AiSection id="operations" heading={t('ai.inference.operationsHeading')}>
        <div className="grid gap-6 md:grid-cols-2">
          {operationalTopics.map((topic) => (
            <div key={topic.title} className="rounded-2xl border border-border bg-card p-6">
              <h3 className="text-lg text-foreground">{topic.title}</h3>
              <p className="mt-2 text-pretty text-sm text-muted-foreground">{topic.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href={primaryHref}>{primaryLabel}</Button>
          <Button href="/ai/trust" variant="outline">
            {t('ai.trust.seoTitle')}
          </Button>
          <Button href="/contact/sales" variant="ghost">
            {t('ai.cta.talkToSales')}
          </Button>
        </div>
      </AiSection>
    </PageShell>
  )
}
