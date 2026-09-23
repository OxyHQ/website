import { RiCheckLine } from '@oxy.so/bloom/icons/RiCheckLine'
import { usePricing } from '../../api/hooks'
import { FEATURES } from '../../constants'
import Button from '../ui/Button'
import BillingToggle from './BillingToggle'
import { ArrowRightIcon } from '../icons'
import { AnimatedTitle } from '../ui/AnimatedTitle'

interface Props {
  isAnnual: boolean
  onToggle: (isAnnual: boolean) => void
}

export default function PricingHeroSection({ isAnnual, onToggle }: Props) {
  const { data: pricingPlans = [] } = usePricing()

  return (
    <div className="container">
      <div className="flex flex-col items-center pt-[116px]">
        <AnimatedTitle as="h1" className="text-center text-heading-responsive-lg">Pricing for the Oxy ecosystem.</AnimatedTitle>
        <p className="mt-4 max-w-md text-balance text-center text-muted-foreground text-xl">
          Most Oxy apps are free and open source. Paid plans add hosting, support, and team features. Start today, no credit card required.
        </p>
      </div>

      {/* Monthly/Annual toggle */}
      <div className="mt-8 flex flex-col items-center">
        <BillingToggle isAnnual={isAnnual} onChange={onToggle} />
      </div>

      {/* Pricing cards grid */}
      <div className="relative grid grid-cols-12 gap-x-6 mt-10 lg:mt-20">
        {/* Decorative horizontal gradient lines */}
        <div className="pricing-cards-grid-line bg-[linear-gradient(to_left,_transparent_0%,_var(--color-border)_6.52%,_var(--color-border)_93.22%,_transparent_100%)] absolute -top-3 left-0 hidden h-px w-full -translate-y-1/2 lg:block" />
        <div className="pricing-cards-grid-line bg-[linear-gradient(to_left,_transparent_0%,_var(--color-border)_6.52%,_var(--color-border)_93.22%,_transparent_100%)] absolute -bottom-3 left-0 hidden h-px w-full translate-y-1/2 [animation-delay:450ms]! lg:block" />

        <div className="relative isolate col-span-12 grid grid-cols-1 gap-6 lg:grid-cols-4 xl:col-span-10 xl:col-start-2">
          {/* Decorative vertical gradient lines */}
          {[1, 2, 3, 4].map((col, idx) => (
            <div
              key={`vline-${col}`}
              className={`pricing-cards-grid-line-vertical bg-[linear-gradient(to_bottom,_transparent_0%,_var(--color-border)_10.87%,_var(--color-border)_89.55%,_transparent_100%)] absolute top-[-50px] -left-3 col-start-${col} hidden h-[calc(100%+100px)] w-px -translate-x-1/2 ${idx > 0 ? `[animation-delay:${idx * 150}ms]!` : ''} lg:block`}
            />
          ))}
          {/* Right edge line */}
          <div className="pricing-cards-grid-line-vertical bg-[linear-gradient(to_bottom,_transparent_0%,_var(--color-border)_10.87%,_var(--color-border)_89.55%,_transparent_100%)] absolute top-[-50px] -right-3 col-start-5 hidden h-[calc(100%+100px)] w-px translate-x-1/2 [animation-delay:600ms]! lg:block" />

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

          {/* 4 Pricing cards */}
          {pricingPlans.map((plan) => (
            <div
              key={plan.name}
              className={`flex flex-col justify-between rounded-3xl border border-solid px-[23px] pt-[21px] pb-[23px] ${
                plan.highlighted
                  ? 'border-primary ring-4 ring-primary-subtle shadow-s'
                  : 'border-border shadow-s'
              }`}
            >
              <div className="flex flex-col">
                <header className="text-muted-foreground text-xl">{plan.name}</header>
                <div className="mt-4 lg:mt-8">
                  <div className="flex items-start gap-2">
                    <div className="inline-block overflow-y-hidden text-title-md">
                      {plan.price ? (
                        <>
                          <span>$</span>
                          <span>{isAnnual ? plan.price.annual : plan.price.monthly}</span>
                        </>
                      ) : (
                        <span>Custom</span>
                      )}
                    </div>
                    {plan.price && plan.price.annual < plan.price.monthly && isAnnual && (
                      <div className="mt-[6px] rounded-lg border border-success/30 bg-success-subtle px-[7px] py-[3px] text-center text-success-text text-xs">
                        Save 20%
                      </div>
                    )}
                  </div>
                  <div className="mt-0.5 text-accent-foreground text-xs">
                    {plan.price ? (
                      <span>Per user/month, billed {isAnnual ? 'annually' : 'monthly'}</span>
                    ) : (
                      <span>Billed annually</span>
                    )}
                  </div>
                </div>
                <div className="mt-5 font-semibold text-muted-foreground text-sm lg:mt-8">{plan.description}</div>
                <ul className="mt-2.5 flex flex-col gap-y-2.5">
                  {(plan.features ?? []).map((feature: string) => (
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
                {plan.price === null ? (
                  <>
                    <Button variant="outline" size="md" responsive className="max-md:hidden">
                      {plan.cta}
                    </Button>
                    <Button variant="ghost" size="md" responsive className="group self-center md:hidden">
                      <span>{plan.cta}</span>
                      <ArrowRightIcon className="relative transition-[translate] duration-400 ease-in-out group-hover:translate-x-0.25 group-hover:duration-150 group-active:translate-x-0.25 group-active:duration-50" />
                    </Button>
                  </>
                ) : (
                  <Button
                    variant={plan.highlighted ? 'primary' : 'outline'}
                    size="md"
                    responsive
                    href={plan.ctaHref}
                  >
                    {plan.cta}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Logo bar */}
      {FEATURES.SHOW_PRICING_LOGOS && (
        <div className="mt-16">
          <div className="container">
            <div>
              <div className="grid grid-cols-12 justify-items-center py-25">
                <div className="col-span-full">
                  <div className="grid max-w-7xl grid-cols-6 gap-x-8 gap-y-4.5 max-xl:grid-cols-4 max-xl:gap-y-5 max-lg:gap-x-5 max-lg:gap-y-3 max-md:grid-cols-3 max-md:gap-x-4 max-md:gap-y-2 max-md:[&>*:nth-child(1n+10)]:hidden">
                    {/* Placeholder logo strip — kept behind FEATURES.SHOW_PRICING_LOGOS until real customer/community logos are available. */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
