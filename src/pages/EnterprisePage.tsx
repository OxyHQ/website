import type { ReactNode } from 'react'
import Navbar from '../components/layout/Navbar'
import PageShell from '../components/layout/PageShell'
import Button from '../components/ui/Button'
import { Link } from '../lib/navigation'
import AvailabilityBadge from '../components/ai/platform/AvailabilityBadge'
import { useTranslation } from '../lib/i18n'
import { ctaIntentFor } from '../lib/ai/availability'
import { enterpriseHubIntro, enterpriseServices } from '../data/ai/enterprise'

/**
 * `/enterprise` — the cross-Oxy B2B landing.
 *
 * Deliberately a different page from `/company/business`, and it says so in the
 * first paragraph. `/company/business` answers "how does Oxy make money and
 * where does it go"; this answers "what can my organization buy". Merging them
 * loses both answers.
 *
 * Every card carries an availability state, so an offering that is not open yet
 * says `Coming soon` rather than sitting beside the live ones as if it were.
 */
export default function EnterprisePage() {
  const { t } = useTranslation()

  return (
    <PageShell
      seo={{
        title: t('enterprisePage.seoTitle'),
        description: t('enterprisePage.seoDescription'),
        canonicalPath: '/enterprise',
      }}
      navbar={<Navbar />}
      mainClassName="flex-1"
    >
      <section className="container pt-24 pb-12">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {t('enterprisePage.heroEyebrow')}
        </p>
        <h1 className="mt-3 text-heading-responsive-lg text-balance text-foreground">
          {t('enterprisePage.heroTitle')}
        </h1>
        <p className="mt-4 max-w-3xl text-pretty text-lg text-muted-foreground">
          {enterpriseHubIntro.body}
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          <Link
            to={enterpriseHubIntro.businessLinkHref}
            className="underline underline-offset-4 hover:text-foreground"
          >
            {enterpriseHubIntro.businessLinkLabel}
          </Link>
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/contact/sales" responsive>
            {t('ai.cta.talkToSales')}
          </Button>
          <Button href="/ai/enterprise" variant="outline" responsive>
            {t('ai.enterprise.seoTitle')}
          </Button>
        </div>
      </section>

      <section className="container pb-16">
        <h2 className="text-heading-responsive-md text-foreground">
          {t('enterprisePage.servicesHeading')}
        </h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {enterpriseServices.map((service) => {
            const intent = ctaIntentFor(service.availability)
            // Same rule as the AI service cards: the form's option spelling is a
            // server contract, and a `coming_soon` service opens its own page
            // rather than a sales form about something nobody can buy.
            const href =
              intent === 'request_access' && service.salesInterest
                ? `/contact/sales?interest=${service.salesInterest}`
                : service.href
            return (
              <li key={service.key}>
                <article className="relative flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-accent/40">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg text-foreground">{service.name}</h3>
                    <AvailabilityBadge availability={service.availability} />
                  </div>
                  <p className="flex-1 text-pretty text-sm text-muted-foreground">
                    {service.description}
                  </p>
                  {intent !== 'none' && (
                    <ServiceLink href={href} external={service.external}>
                      <span className="absolute inset-0" aria-hidden="true" />
                      <span className="relative">
                        {t(`ai.cta.${camel(intent)}`)}
                        <span className="sr-only"> — {service.name}</span>
                      </span>
                    </ServiceLink>
                  )}
                </article>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="container pb-24">
        <div className="rounded-2xl border border-border bg-card p-8">
          <h2 className="text-heading-responsive-md text-foreground">
            {t('enterprisePage.contactHeading')}
          </h2>
          <p className="mt-3 max-w-2xl text-pretty text-muted-foreground">
            {t('enterprisePage.contactBody')}
          </p>
          <Button href="/contact/sales" className="mt-6">
            {t('ai.cta.talkToSales')}
          </Button>
        </div>
      </section>
    </PageShell>
  )
}

/**
 * A card link that survives an off-site `href`.
 *
 * `EnterpriseService.href` may leave the site, and `<Link to>` would treat an
 * absolute URL as a router path — a card that looks right and goes nowhere.
 */
function ServiceLink({
  href,
  external,
  children,
}: {
  href: string
  external?: boolean
  children: ReactNode
}) {
  const className = 'text-sm font-medium text-foreground underline-offset-4 hover:underline'
  if (external || !href.startsWith('/')) {
    return (
      <a className={className} href={href} rel="noreferrer">
        {children}
      </a>
    )
  }
  return (
    <Link className={className} to={href}>
      {children}
    </Link>
  )
}

function camel(value: string): string {
  return value.replace(/_([a-z])/g, (_, char: string) => char.toUpperCase())
}
