import type { PersonalPlanMode } from '../../data/pricing'
import FaqSection from '../sections/FaqSection'
import { PRICING_FAQ_GROUPS, getAudienceFaqGroups } from '../../data/pricingFaq'
import type { PlanAudience } from './OnePlansSection'

const FAQ_THEMES: Record<PlanAudience, string> = {
  personal: 'pricing-faq-theme',
  creator: 'pricing-creator-faq-theme',
  business: 'pricing-business-faq-theme',
}

export default function PricingFaqSection({ audience, personalMode }: { audience?: PlanAudience; personalMode?: PersonalPlanMode }) {
  return (
    <FaqSection
      id="faq"
      title="Frequently asked questions"
      groups={audience ? getAudienceFaqGroups(audience, personalMode) : PRICING_FAQ_GROUPS}
      className={`${FAQ_THEMES[audience ?? 'personal']} scroll-mt-[var(--site-header-occlusion-bottom)] bg-[color-mix(in_srgb,var(--primary)_8%,var(--background))]`}
    />
  )
}
