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

export type PersonalPlanMode = 'individual' | 'family'
export type OneAudience = 'personal' | 'creator' | 'business'
export interface OnePlan {
  name: string
  monthlyPrice: number
  monthlyCredits: number
  creditDiscount: number
  monthlySeatPrice?: number
  creditsPerSeat?: number
}

export const OXY_ONE_ANNUAL_DISCOUNT = 20
export const OXY_ONE_FAMILY_MEMBERS = 6
export const OXY_ONE_AUDIENCE_THEMES = {
  personal: 'one-plans-theme',
  creator: 'one-creator-theme',
  business: 'one-professional-theme',
} as const

/** Product-owner-approved catalogue. USD minor units; credits renew monthly even on annual plans.
 * Marketing terms do not provision subscriptions or grant runtime entitlements. */
export const OXY_ONE_PERSONAL_PLANS = {
  Free: { monthlyPrice: 0, monthlyCredits: 0, creditDiscount: 0 },
  Go: { monthlyPrice: 1500, monthlyCredits: 4000, creditDiscount: 5 },
  Pro: { monthlyPrice: 2999, monthlyCredits: 10000, creditDiscount: 10 },
  Max: { monthlyPrice: 9900, monthlyCredits: 50000, creditDiscount: 15 },
  Ultra: { monthlyPrice: 40000, monthlyCredits: 200000, creditDiscount: 20 },
} as const

/** A family quota belongs to the whole group, never multiplied by member count. */
export const OXY_ONE_FAMILY_PLANS = {
  Go: { monthlyPrice: 2500, monthlyCredits: 8000, creditDiscount: 5 },
  Pro: { monthlyPrice: 4900, monthlyCredits: 20000, creditDiscount: 10 },
  Max: { monthlyPrice: 16900, monthlyCredits: 100000, creditDiscount: 15 },
  Ultra: { monthlyPrice: 59900, monthlyCredits: 300000, creditDiscount: 20 },
} as const

export const OXY_ONE_BUSINESS_PLANS = {
  Go: { monthlyPrice: 3900, monthlySeatPrice: 900, monthlyCredits: 8000, creditsPerSeat: 2000, creditDiscount: 15 },
  Pro: { monthlyPrice: 9999, monthlySeatPrice: 1900, monthlyCredits: 25000, creditsPerSeat: 5000, creditDiscount: 25 },
  Max: { monthlyPrice: 19900, monthlySeatPrice: 2900, monthlyCredits: 60000, creditsPerSeat: 8000, creditDiscount: 30 },
  Ultra: { monthlyPrice: 59900, monthlySeatPrice: 4900, monthlyCredits: 200000, creditsPerSeat: 15000, creditDiscount: 35 },
} as const

/** Verification, basic app access and model access are not subscription gates. */
export const OXY_ONE_CREATOR_PLANS = {
  Go: { monthlyPrice: 2900, monthlyCredits: 10000, creditDiscount: 10 },
  Pro: { monthlyPrice: 6900, monthlyCredits: 25000, creditDiscount: 15 },
  Max: { monthlyPrice: 14900, monthlyCredits: 60000, creditDiscount: 20 },
  Ultra: { monthlyPrice: 49900, monthlyCredits: 250000, creditDiscount: 25 },
} as const

export function getOnePlans(audience: OneAudience, mode: PersonalPlanMode = 'individual'): OnePlan[] {
  const plans = audience === 'business' ? OXY_ONE_BUSINESS_PLANS : audience === 'creator' ? OXY_ONE_CREATOR_PLANS
    : mode === 'family' ? OXY_ONE_FAMILY_PLANS : OXY_ONE_PERSONAL_PLANS
  return Object.entries(plans).map(([name, plan]) => ({ name, ...plan }))
}

/** Annual rounding follows the billable base and per-seat line items. */
export function onePlanQuote(plan: OnePlan, period: 'monthly' | 'annual', seats: number | undefined) {
  const annual = (value: number) => Math.round(value * 12 * (1 - OXY_ONE_ANNUAL_DISCOUNT / 100))
  const baseAnnual = annual(plan.monthlyPrice)
  const seatAnnual = plan.monthlySeatPrice === undefined ? undefined : annual(plan.monthlySeatPrice)
  const known = plan.monthlySeatPrice === undefined || seats !== undefined
  const totalAnnual = known ? baseAnnual + (seatAnnual ?? 0) * (seats ?? 0) : undefined
  return {
    baseMonthly: period === 'annual' ? Math.round(baseAnnual / 12) : plan.monthlyPrice,
    seatMonthly: plan.monthlySeatPrice === undefined ? undefined : period === 'annual' ? Math.round(seatAnnual! / 12) : plan.monthlySeatPrice,
    totalMonthly: !known ? undefined : period === 'annual' ? Math.round(totalAnnual! / 12) : plan.monthlyPrice + (plan.monthlySeatPrice ?? 0) * (seats ?? 0),
    totalAnnual,
    monthlyCredits: known ? plan.monthlyCredits + (plan.creditsPerSeat ?? 0) * (seats ?? 0) : undefined,
  }
}

/**
 * Credits a new Oxy account starts with. Mirrors `DEFAULT_FREE_CREDITS` in
 * OxyHQServices (`packages/api/src/db/schema/userCredits.ts`), which the API
 * does not expose publicly.
 */
export const FREE_PLAN_CREDITS = 1000
