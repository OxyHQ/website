import { useTranslation } from '../../lib/i18n';
import type { PlanAudience } from './OnePlansSection';
import { Button } from '@oxy.so/bloom/button';

export default function PricingSubNav({
  value,
  onChange,
}: {
  value: PlanAudience;
  onChange: (value: PlanAudience) => void;
}) {
  const { t } = useTranslation();
  const links = [
    { label: t('one.personal'), value: 'personal' },
    { label: 'Creator', value: 'creator' },
    { label: 'Business', value: 'business' },
  ] as const;

  return (
    <nav
      aria-label={t('one.explorePlans')}
      className="sticky top-[var(--site-header-occlusion-bottom)] z-50 text-foreground group-has-[header[data-menu-open=true]]/pricing:z-40"
    >
      <div
        aria-hidden="true"
        data-pricing-subnav-backdrop
        className="pointer-events-none absolute inset-0 -z-10 bg-[color-mix(in_srgb,var(--background)_80%,transparent)] backdrop-blur-md group-has-[header[data-transparent=true]]/pricing:opacity-0 supports-[animation-timeline:scroll()]:animate-pricing-subnav-merge supports-[animation-timeline:scroll()]:[animation-timeline:--pricing-hero] supports-[animation-timeline:scroll()]:[animation-range:exit_99.999%_exit_100%]"
      />
      <div className="container flex h-[60px] items-center gap-5 sm:gap-9">
        <span className="shrink-0 text-base sm:text-lg">{t('one.explorePlans')}</span>
        <div
          role="tablist"
          aria-label={t('one.explorePlans')}
          className="flex min-w-0 items-center gap-1 overflow-x-auto p-1 sm:gap-4"
        >
          {links.map((link, index) => (
            <Button
              asChild
              key={link.value}
              size="sm"
              tone="neutral"
              appearance={value === link.value ? 'subtle' : 'plain'}
              className="shrink-0"
            >
              <button
                type="button"
                role="tab"
                id={`pricing-tab-${link.value}`}
                aria-controls="pricing-panel"
                aria-selected={value === link.value}
                tabIndex={value === link.value ? 0 : -1}
                onClick={() => onChange(link.value)}
                onKeyDown={(event) => {
                  const next =
                    event.key === 'ArrowRight'
                      ? (index + 1) % links.length
                      : event.key === 'ArrowLeft'
                        ? (index + links.length - 1) % links.length
                        : event.key === 'Home'
                          ? 0
                          : event.key === 'End'
                            ? links.length - 1
                            : undefined;
                  if (next === undefined) return;
                  event.preventDefault();
                  onChange(links[next].value);
                  document
                    .getElementById(`pricing-tab-${links[next].value}`)
                    ?.focus({ preventScroll: true });
                }}
              >
                {link.label}
              </button>
            </Button>
          ))}
        </div>
      </div>
    </nav>
  );
}
