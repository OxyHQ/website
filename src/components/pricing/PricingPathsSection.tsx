import { RiArrowRightLine } from '@oxy.so/bloom/icons/RiArrowRightLine';
import { Link } from '../../lib/navigation';
import { useTranslation } from '../../lib/i18n';
import type { PlanAudience } from './OnePlansSection';

const PATHS: Record<PlanAudience, readonly { labelKey: string; href: string }[]> = {
  personal: [
    { labelKey: 'one.exploreApps', href: '/apps/' },
    { labelKey: 'one.exploreAlia', href: 'https://alia.onl/' },
    { labelKey: 'one.exploreHelp', href: '/help/' },
  ],
  creator: [
    { labelKey: 'one.exploreMention', href: '/mention/' },
    { labelKey: 'one.exploreAlia', href: 'https://alia.onl/' },
    { labelKey: 'one.exploreAcademy', href: '/academy/' },
  ],
  business: [
    { labelKey: 'one.exploreInference', href: '/ai/pricing/' },
    { labelKey: 'one.exploreInfrastructure', href: '/ai/enterprise/' },
    { labelKey: 'common.talkToSales', href: '/contact/sales/' },
  ],
};

/** A quiet closing section that inherits the selected audience's page palette. */
export default function PricingPathsSection({
  audience = 'personal',
}: {
  audience?: PlanAudience;
}) {
  const { t } = useTranslation();

  return (
    <section
      id="pricing-explore"
      aria-labelledby="pricing-explore-title"
      className="bg-[color-mix(in_srgb,var(--primary)_8%,var(--background))] py-16 text-foreground sm:py-24"
    >
      <div className="container grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-12">
        <h2 id="pricing-explore-title" className="max-w-md text-heading-responsive-md">
          {t('one.exploreMore')}
        </h2>
        <ul className="min-w-0 divide-y divide-border">
          {PATHS[audience].map((path) => (
            <li key={path.href}>
              <Link
                to={path.href}
                className="group flex items-center justify-between gap-6 py-6 text-lg leading-snug transition-colors hover:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring sm:text-xl"
              >
                <span>{t(path.labelKey)}</span>
                <span
                  aria-hidden="true"
                  className="shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
                >
                  <RiArrowRightLine width={20} height={20} fill="currentColor" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
