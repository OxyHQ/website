import Navbar from '../components/layout/Navbar'
import PageShell from '../components/layout/PageShell'
import StructuredData from '../components/StructuredData'
import Button from '../components/ui/Button'
import AiSection from '../components/ai/platform/AiSection'
import AiBreadcrumbs from '../components/ai/platform/AiBreadcrumbs'
import AvailabilityBadge from '../components/ai/platform/AvailabilityBadge'
import { useTranslation } from '../lib/i18n'
import {
  enterpriseInferenceCapabilities,
  enterpriseUndefinedTerms,
} from '../data/ai/enterprise'
import { infrastructureTiers } from '../data/ai/landing'

/**
 * `/ai/enterprise` — shared, managed and dedicated inference for organizations.
 *
 * The page's most important section is the one that publishes nothing: support
 * levels, service-level agreements and certifications are contractual, and a
 * marketing page that names a figure for any of them has made a commitment
 * nobody signed. Saying so explicitly beats leaving the reader to assume the
 * page forgot.
 */
export default function AIEnterprisePage() {
  const { t } = useTranslation()

  return (
    <PageShell
      seo={{
        title: t('ai.enterprise.seoTitle'),
        description: t('ai.enterprise.seoDescription'),
        canonicalPath: '/ai/enterprise',
      }}
      navbar={<Navbar />}
      mainClassName="flex-1"
    >
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: 'Oxy AI for organizations',
          serviceType: 'Managed and dedicated inference',
          description: t('ai.enterprise.seoDescription'),
          provider: { '@type': 'Organization', name: 'Oxy', url: 'https://oxy.so/' },
          // No `offers`: managed and dedicated capacity is priced per agreement,
          // and an offer node here would advertise a price that does not exist.
        }}
      />
      <AiBreadcrumbs
        crumbs={[
          { label: t('ai.breadcrumbHome'), href: '/ai' },
          { label: t('ai.enterprise.seoTitle') },
        ]}
      />

      <section className="container pt-10 pb-8">
        <div className="flex max-w-3xl flex-col gap-5">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              {t('ai.enterprise.heroEyebrow')}
            </p>
            <AvailabilityBadge availability="private_preview" />
          </div>
          <h1 className="text-heading-responsive-lg text-balance text-foreground">
            {t('ai.enterprise.heroTitle')}
          </h1>
          <p className="text-pretty text-lg text-muted-foreground">
            {t('ai.enterprise.heroSubtitle')}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button href="/contact/sales?interest=dedicated_inference" responsive>
              {t('ai.cta.talkToSales')}
            </Button>
            <Button href="/contact/sales?interest=managed_inference" variant="outline" responsive>
              {t('ai.cta.requestEvaluation')}
            </Button>
            <Button href="/ai/trust" variant="ghost" responsive>
              {t('ai.trust.seoTitle')}
            </Button>
          </div>
        </div>
      </section>

      {/* ── Shared, managed, dedicated ───────────────────────────────── */}
      <AiSection id="managed" heading={t('ai.sections.infrastructure')}>
        <div className="grid gap-4 md:grid-cols-3">
          {infrastructureTiers.map((tier) => (
            <div
              key={tier.key}
              id={tier.key === 'dedicated' ? 'dedicated' : undefined}
              className="scroll-mt-24 rounded-2xl border border-border bg-card p-6"
            >
              <h3 className="text-lg text-foreground">{tier.title}</h3>
              <p className="mt-2 text-pretty text-sm text-muted-foreground">{tier.description}</p>
            </div>
          ))}
        </div>
      </AiSection>

      {/* ── Capabilities ─────────────────────────────────────────────── */}
      <AiSection id="capabilities" heading={t('ai.enterprise.capabilitiesHeading')}>
        <ul className="grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {enterpriseInferenceCapabilities.map((capability) => (
            <li key={capability.key} className="flex flex-col gap-1.5">
              <h3 className="text-base text-foreground">{capability.title}</h3>
              <p className="text-sm text-muted-foreground">{capability.description}</p>
            </li>
          ))}
        </ul>
      </AiSection>

      {/* ── What we are not publishing ───────────────────────────────── */}
      <AiSection id="not-published" heading={enterpriseUndefinedTerms.heading}>
        <p className="max-w-3xl text-pretty text-muted-foreground">
          {enterpriseUndefinedTerms.body}
        </p>
      </AiSection>

      {/* ── Evaluation ───────────────────────────────────────────────── */}
      <AiSection
        id="evaluation"
        heading={t('ai.enterprise.evaluationHeading')}
        description={t('ai.enterprise.evaluationBody')}
      >
        <div className="flex flex-wrap gap-3">
          <Button href="/contact/sales?interest=dedicated_inference">
            {t('ai.cta.requestEvaluation')}
          </Button>
          <Button href="/enterprise" variant="outline">
            {t('enterprisePage.seoTitle')}
          </Button>
        </div>
      </AiSection>
    </PageShell>
  )
}
