import { Link } from '../../lib/navigation'
import { useTranslation } from '../../lib/i18n'

/**
 * The four things people mean when they say "pricing".
 *
 * This page prices per-seat plans for the Oxy apps. Inference is per token,
 * Alia is a product subscription sold by Alia, and dedicated capacity is priced
 * per agreement. Those are four different purchases, and a visitor who lands on
 * one looking for another should find out here rather than by reading a table
 * that does not answer their question.
 *
 * Each entry names its own source of truth, because "credits" on this page and
 * "credits" on Alia are not one balance and never were.
 */
interface PricingPath {
  titleKey: string
  bodyKey: string
  ctaKey: string
  href: string
  external?: boolean
}

const PATHS: readonly PricingPath[] = [
  {
    titleKey: 'ai.pricing.pathEcosystem',
    bodyKey: 'ai.pricing.pathEcosystemBody',
    ctaKey: 'common.seeMore',
    href: '#pricing-plans',
  },
  {
    titleKey: 'ai.pricing.heading',
    bodyKey: 'ai.pricing.lead',
    ctaKey: 'ai.cta.viewPricing',
    href: '/ai/pricing',
  },
  {
    titleKey: 'ai.pricing.pathAlia',
    bodyKey: 'ai.pricing.pathAliaBody',
    ctaKey: 'ai.pricing.aliaHandoffCta',
    href: 'https://alia.onl/pricing',
    external: true,
  },
  {
    titleKey: 'ai.pricing.pathDedicated',
    bodyKey: 'ai.pricing.pathDedicatedBody',
    ctaKey: 'ai.cta.talkToSales',
    href: '/contact/sales?interest=dedicated_inference',
  },
]

export default function PricingPathsSection() {
  const { t } = useTranslation()

  return (
    <section className="py-16 sm:py-24">
      <div className="container">
        <h2 className="text-heading-responsive-md text-foreground">{t('ai.pricing.pathsHeading')}</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PATHS.map((path) => (
            <article
              key={path.titleKey}
              className="flex h-full flex-col rounded-2xl border border-border bg-card p-5"
            >
              <h3 className="text-base text-foreground">{t(path.titleKey)}</h3>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{t(path.bodyKey)}</p>
              {path.external ? (
                <a
                  className="mt-4 text-sm text-foreground underline underline-offset-4"
                  href={path.href}
                  rel="noreferrer"
                >
                  {t(path.ctaKey)}
                </a>
              ) : (
                <Link
                  className="mt-4 text-sm text-foreground underline underline-offset-4"
                  to={path.href}
                >
                  {t(path.ctaKey)}
                </Link>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
