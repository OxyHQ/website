import { useTheme } from '@oxy.so/bloom/theme'
import { useState } from 'react'
import Navbar from '../components/layout/Navbar'
import PageShell from '../components/layout/PageShell'
import PricingFaqSection from '../components/pricing/PricingFaqSection'
import PricingPathsSection from '../components/pricing/PricingPathsSection'
import OnePlansSection, { type PlanAudience } from '../components/pricing/OnePlansSection'
import PricingSubNav from '../components/pricing/PricingSubNav'
import { AnimatedTitle } from '../components/ui/AnimatedTitle'
import { useTranslation } from '../lib/i18n'
import { OXY_ONE_AUDIENCE_THEMES, type PersonalPlanMode } from '../data/pricing'

export default function OnePage() {
  const { t } = useTranslation()
  const { isDark } = useTheme()
  const [audience, setAudience] = useState<PlanAudience>('personal')
  const [personalMode, setPersonalMode] = useState<PersonalPlanMode>('individual')
  const selectAudience = (next: PlanAudience) => {
    setAudience(next)
    requestAnimationFrame(() => {
      document.getElementById('pricing-panel')?.scrollIntoView({
        block: 'start',
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      })
    })
  }

  return (
    <PageShell
      seo={{ title: t('pricing.seoTitle'), description: t('one.lead'), canonicalPath: '/one/' }}
      className={`group/pricing ${OXY_ONE_AUDIENCE_THEMES[audience]} bg-background text-foreground [timeline-scope:--pricing-hero]`}
      mainClassName="bg-[color-mix(in_srgb,var(--primary)_8%,var(--background))]"
      navbar={<Navbar transparent mergePricingSubheader transparentOn={isDark ? 'dark' : 'light'} />}
    >
      <section aria-labelledby="pricing-hero-title" className="relative flex min-h-[calc(100svh-60px)] items-end pt-[calc(var(--site-header-occlusion-bottom)+80px)] pb-16 sm:pb-24 [view-timeline-name:--pricing-hero] [view-timeline-axis:block] [view-timeline-inset:var(--site-header-height)_0px]">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -bottom-[60px]">
          <img src="/images/pricing/oxy-one-hero.png" alt="" fetchPriority="high" className="h-full w-full object-cover object-center" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--background)_75%,transparent)_0%,color-mix(in_srgb,var(--background)_15%,transparent)_30%,color-mix(in_srgb,var(--background)_85%,transparent)_72%,var(--background)_100%)]" />
        </div>
        <div id="pricing-hero-title" className="container relative">
          <div className="max-w-3xl">
            <AnimatedTitle as="h1" className="text-[clamp(3rem,6vw,6rem)] leading-[1.04] tracking-tight">{t('one.heroTitle')}</AnimatedTitle>
            <p className="mt-6 max-w-xl text-pretty text-xl leading-relaxed sm:text-2xl">{t('one.lead')}</p>
          </div>
        </div>
      </section>
      <PricingSubNav value={audience} onChange={selectAudience} />
      <div id="pricing-panel" role="tabpanel" aria-labelledby={`pricing-tab-${audience}`} className="relative scroll-mt-[calc(var(--site-header-height)+60px)] [--plans-anchor-offset:calc(var(--site-header-occlusion-bottom)+76px)]">
        <OnePlansSection audience={audience} personalMode={personalMode} onPersonalModeChange={setPersonalMode} />
        <PricingFaqSection audience={audience} personalMode={personalMode} />
        <PricingPathsSection audience={audience} />
      </div>
    </PageShell>
  )
}
