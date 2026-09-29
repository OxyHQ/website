import { RiCheckLine } from '@oxy.so/bloom/icons/RiCheckLine'
import { useBillingPlans } from '../../api/hooks'
import { FREE_PLAN_CREDITS, type BillingPlan } from '../../data/pricing'
import Button from '../ui/Button'
import { AnimatedTitle } from '../ui/AnimatedTitle'

const ACCOUNT_SIGNUP_URL = 'https://accounts.oxy.so/'
const ACCOUNT_BILLING_URL = 'https://console.oxy.so/billing/plans'

interface PlanCard {
  name: string
  price: string
  description: string
  features: string[]
  cta: string
  /** Absent while the plan cannot be bought yet. */
  href?: string
}

const credits = (n: number) => n.toLocaleString('en-US')

function formatPrice(minorUnits: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(minorUnits / 100)
}

const FREE_PLAN: PlanCard = {
  name: 'Free',
  price: '$0',
  description: `${credits(FREE_PLAN_CREDITS)} free credits`,
  features: ['Every Oxy app, free and open source', 'Top up any time with credit packs'],
  cta: 'Create an account',
  href: ACCOUNT_SIGNUP_URL,
}

function toCard(plan: BillingPlan): PlanCard {
  const purchasable = plan.stripePriceId !== ''
  return {
    name: plan.name,
    price: formatPrice(plan.price, plan.currency),
    description: `${credits(plan.creditsPerMonth)} credits per month`,
    features: ['Everything in Free', 'Top up any time with credit packs'],
    cta: purchasable ? `Choose ${plan.name}` : 'Coming soon',
    href: purchasable ? ACCOUNT_BILLING_URL : undefined,
  }
}

export default function PricingHeroSection() {
  const { data: billingPlans = [] } = useBillingPlans()
  const plans = [FREE_PLAN, ...billingPlans.map(toCard)]

  return (
    <div className="container">
      <div className="flex flex-col items-center pt-[116px]">
        <AnimatedTitle as="h1" className="text-center text-heading-responsive-lg">Pricing for the Oxy ecosystem.</AnimatedTitle>
        <p className="mt-4 max-w-md text-balance text-center text-muted-foreground text-xl">
          The Oxy apps are free and open source. Plans add monthly credits for API usage on your Oxy account.
        </p>
      </div>

      {/* Pricing cards grid */}
      <div id="pricing-plans" className="relative grid grid-cols-12 gap-x-6 mt-10 scroll-mt-(--site-header-height) lg:mt-20">
        {/* Decorative horizontal gradient lines */}
        <div className="pricing-cards-grid-line bg-[linear-gradient(to_left,_transparent_0%,_var(--color-border)_6.52%,_var(--color-border)_93.22%,_transparent_100%)] absolute -top-3 left-0 hidden h-px w-full -translate-y-1/2 lg:block" />
        <div className="pricing-cards-grid-line bg-[linear-gradient(to_left,_transparent_0%,_var(--color-border)_6.52%,_var(--color-border)_93.22%,_transparent_100%)] absolute -bottom-3 left-0 hidden h-px w-full translate-y-1/2 [animation-delay:450ms]! lg:block" />

        <div className="relative isolate col-span-12 grid grid-cols-1 gap-6 lg:grid-cols-3 xl:col-span-10 xl:col-start-2">
          {/* Decorative vertical gradient lines */}
          {[1, 2, 3].map((col, idx) => (
            <div
              key={`vline-${col}`}
              className={`pricing-cards-grid-line-vertical bg-[linear-gradient(to_bottom,_transparent_0%,_var(--color-border)_10.87%,_var(--color-border)_89.55%,_transparent_100%)] absolute top-[-50px] -left-3 col-start-${col} hidden h-[calc(100%+100px)] w-px -translate-x-1/2 ${idx > 0 ? `[animation-delay:${idx * 150}ms]!` : ''} lg:block`}
            />
          ))}
          {/* Right edge line */}
          <div className="pricing-cards-grid-line-vertical bg-[linear-gradient(to_bottom,_transparent_0%,_var(--color-border)_10.87%,_var(--color-border)_89.55%,_transparent_100%)] absolute top-[-50px] -right-3 col-start-4 hidden h-[calc(100%+100px)] w-px translate-x-1/2 [animation-delay:600ms]! lg:block" />

          {/* Corner crosshairs (4 corners) */}
          {[
            '-top-3 -left-3 -translate-x-1/2 -translate-y-1/2',
            '-top-3 -right-3 translate-x-1/2 -translate-y-1/2',
            '-right-3 -bottom-3 translate-x-1/2 translate-y-1/2',
            '-bottom-3 -left-3 -translate-x-1/2 translate-y-1/2',
          ].map((pos, i) => (
            <div key={`corner-${i}`} className={`absolute ${pos} hidden lg:block`}>
              <div className="relative h-[7px] w-[7px] fade-in animate-in fill-mode-both [animation-delay:1000ms] [animation-duration:1000ms]">
                <div className="absolute top-[3px] left-0 h-px w-full rounded-full bg-border" />
                <div className="absolute top-0 left-[3px] h-full w-px rounded-full bg-border" />
              </div>
            </div>
          ))}

          {plans.map((plan) => (
            <div
              key={plan.name}
              className="flex flex-col justify-between rounded-3xl border border-solid border-border px-[23px] pt-[21px] pb-[23px] shadow-s"
            >
              <div className="flex flex-col">
                <header className="text-muted-foreground text-xl">{plan.name}</header>
                <div className="mt-4 lg:mt-8">
                  <div className="inline-block overflow-y-hidden text-title-md">{plan.price}</div>
                  <div className="mt-0.5 text-accent-foreground text-xs">per month</div>
                </div>
                <div className="mt-5 font-semibold text-muted-foreground text-sm lg:mt-8">{plan.description}</div>
                <ul className="mt-2.5 flex flex-col gap-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <div className="mt-px h-[18px] w-[18px] shrink-0 rounded-md bg-muted p-0.5 text-accent-foreground">
                        <RiCheckLine width={14} height={14} fill="currentColor" />
                      </div>
                      <div className="text-sm text-muted-foreground">{feature}</div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-5 flex flex-col items-stretch lg:mt-8">
                {plan.href ? (
                  <Button variant="outline" responsive href={plan.href}>
                    {plan.cta}
                  </Button>
                ) : (
                  <Button variant="outline" responsive disabled>
                    {plan.cta}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
