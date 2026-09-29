export interface PricingPlan {
  _id?: string
  name: string
  price: { monthly: number; annual: number } | null // null = custom
  description: string
  cta: string
  ctaHref: string
  highlighted?: boolean
  features: string[]
}

export interface FaqItem {
  question: string
  answer: string
}

/** A subscription plan as `GET /billing/plans` on the Oxy API returns it. */
export interface BillingPlan {
  id: string
  name: string
  creditsPerMonth: number
  /** Minor units (cents) per month. */
  price: number
  currency: string
  /** Empty until the plan is purchasable through Stripe. */
  stripePriceId: string
}

/**
 * Credits a new Oxy account starts with. Mirrors `DEFAULT_FREE_CREDITS` in
 * OxyHQServices (`packages/api/src/db/schema/userCredits.ts`), which the API
 * does not expose publicly.
 */
export const FREE_PLAN_CREDITS = 1000

export const faqItems: FaqItem[] = [
  {
    question: 'What are credits?',
    answer:
      'Credits are what API usage on your Oxy account draws on. Every account gets free credits; a plan adds a monthly allowance on top.',
  },
  {
    question: 'Is Oxy free to use?',
    answer:
      'Yes. The Oxy apps are free and open source, and every account starts with free credits. You only need a plan for more usage than that.',
  },
  {
    question: 'Can I buy credits without a plan?',
    answer:
      'Yes. One-off credit packs are available from the billing page of your Oxy account, alongside the monthly plans.',
  },
  {
    question: 'Where is inference or Alia pricing?',
    answer:
      'Oxy Inference is priced per model and per unit on its own page, and Alia plans are sold by Alia. See "Which path is yours" below.',
  },
]
