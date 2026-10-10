import { Card, CardDescription, CardTitle } from '@oxy.so/bloom/card';
import { RiArrowRightLine } from '@oxy.so/bloom/icons/RiArrowRightLine';
import { useTheme } from '@oxy.so/bloom/theme';
import Navbar from '../components/layout/Navbar';
import PageShell from '../components/layout/PageShell';
import FaqSection from '../components/sections/FaqSection';
import { AnimatedTitle } from '../components/ui/AnimatedTitle';
import Button from '../components/ui/Button';
import AvailabilityBadge from '../components/ai/platform/AvailabilityBadge';
import { OXY_INFERENCE_AVAILABILITY, consoleLinks } from '../data/ai/taxonomy';
import { Link } from '../lib/navigation';
import { useTranslation } from '../lib/i18n';

/** The pricing index links to each offer's source of truth, rather than copying rates. */
export default function PricingPage() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const paths = [
    {
      id: 'one',
      title: 'Oxy One',
      audience: t('pricingHub.oneAudience'),
      body: t('pricingHub.oneBody'),
      detail: t('pricingHub.oneDetail'),
      cta: t('pricingHub.oneCta'),
      href: '/one/',
    },
    {
      id: 'credits',
      title: t('pricingHub.creditsTitle'),
      audience: t('pricingHub.creditsAudience'),
      body: t('pricingHub.creditsBody'),
      detail: t('pricingHub.creditsDetail'),
      cta: t('pricingHub.creditsCta'),
      href: consoleLinks.billing,
    },
    {
      id: 'inference',
      title: t('pricingHub.inferenceTitle'),
      audience: t('pricingHub.inferenceAudience'),
      body: t('pricingHub.inferenceBody'),
      detail: t('pricingHub.inferenceDetail'),
      cta: t('pricingHub.inferenceCta'),
      href: '/ai/pricing/',
    },
  ];

  return (
    <PageShell
      seo={{
        title: t('pricingHub.seoTitle'),
        description: t('pricingHub.description'),
        canonicalPath: '/pricing/',
      }}
      className="bg-background text-foreground"
      navbar={<Navbar transparent transparentOn={isDark ? 'dark' : 'light'} />}
      mainClassName="flex-1"
    >
      <section className="container pt-[calc(var(--site-header-occlusion-bottom)+64px)] pb-12 sm:pt-[calc(var(--site-header-occlusion-bottom)+96px)] sm:pb-20">
        <p className="mb-6 text-sm font-medium text-muted-foreground">{t('navbar.pricing')}</p>
        <div className="grid items-end gap-8 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
          <AnimatedTitle
            as="h1"
            className="max-w-3xl text-[clamp(3.5rem,7vw,7rem)] leading-[1.02] tracking-tight"
          >
            {t('pricingHub.title')}
          </AnimatedTitle>
          <p className="max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl lg:pb-1">
            {t('pricingHub.description')}
          </p>
        </div>
      </section>

      <section className="container pb-16 sm:pb-24" aria-label={t('navbar.pricing')}>
        <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">
          {paths.map((path) => (
            <article
              id={path.id}
              key={path.id}
              className="flex min-w-0 scroll-mt-[calc(var(--site-header-occlusion-bottom)+24px)]"
            >
              <Card
                tone={path.id === 'one' ? 'support' : 'neutral'}
                appearance="solid"
                radius="radius-24"
                border="none"
                elevation="none"
                className="min-w-0 flex-1 px-6 py-8 sm:px-8 sm:py-10"
              >
                <CardDescription style={{ fontSize: 13, lineHeight: 20, fontWeight: '500' }}>
                  {path.audience}
                </CardDescription>
                <h2 className="mt-7 mb-5">
                  <CardTitle style={{ fontSize: 36, lineHeight: 42, fontWeight: '500' }}>
                    {path.title}
                  </CardTitle>
                </h2>
                <div className="mb-4">
                  <CardTitle style={{ fontSize: 20, lineHeight: 28, fontWeight: '400' }}>
                    {path.body}
                  </CardTitle>
                </div>
                <div className="flex-1">
                  <CardDescription style={{ fontSize: 16, lineHeight: 26 }}>
                    {path.detail}
                  </CardDescription>
                </div>
                {path.id === 'inference' && (
                  <div className="relative mt-5">
                    <AvailabilityBadge availability={OXY_INFERENCE_AVAILABILITY} />
                  </div>
                )}
                <div className="mt-10">
                  <Button
                    responsive
                    href={path.href}
                    variant={path.id === 'one' ? 'primary' : 'outline'}
                    className="max-w-full"
                  >
                    <span className="whitespace-normal text-start">{path.cta}</span>
                    <span className="shrink-0 rtl:rotate-180" aria-hidden="true">
                      <RiArrowRightLine width={18} height={18} fill="currentColor" />
                    </span>
                  </Button>
                </div>
              </Card>
            </article>
          ))}
        </div>
      </section>

      <section className="container pb-20 sm:pb-28" aria-labelledby="pricing-free-title">
        <div className="grid gap-6 border-t border-border pt-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16 lg:pt-14">
          <h2
            id="pricing-free-title"
            className="max-w-xl text-3xl leading-tight tracking-tight sm:text-4xl"
          >
            {t('pricingHub.freeTitle')}
          </h2>
          <div className="max-w-xl">
            <p className="text-base leading-7 text-muted-foreground sm:text-lg">
              {t('pricingHub.freeBody')}
            </p>
            <Link
              to="/apps/"
              className="mt-6 inline-flex items-center gap-2 font-medium text-primary-text underline-offset-4 hover:underline"
            >
              {t('one.exploreApps')}
              <span className="rtl:rotate-180" aria-hidden="true">
                <RiArrowRightLine width={18} height={18} fill="currentColor" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      <FaqSection
        id="faq"
        title={t('pricingHub.faqTitle')}
        className="pricing-business-faq-theme bg-background py-8 sm:py-14"
        description={
          <Link to="/help/" className="text-primary-text underline underline-offset-4">
            {t('one.exploreHelp')}
          </Link>
        }
        items={[
          { question: t('pricingHub.faqPlanQuestion'), answer: t('pricingHub.faqPlanAnswer') },
          {
            question: t('pricingHub.faqCreditsQuestion'),
            answer: t('pricingHub.faqCreditsAnswer'),
          },
          {
            question: t('pricingHub.faqBillingQuestion'),
            answer: (
              <>
                <p>{t('pricingHub.faqBillingAnswer')}</p>
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
                  <a
                    href="https://accounts.oxy.so/payments"
                    className="text-primary-text underline underline-offset-4"
                  >
                    Oxy Accounts
                  </a>
                  <a
                    href={consoleLinks.billing}
                    className="text-primary-text underline underline-offset-4"
                  >
                    Oxy Console
                  </a>
                </div>
              </>
            ),
          },
        ]}
      />
    </PageShell>
  );
}
