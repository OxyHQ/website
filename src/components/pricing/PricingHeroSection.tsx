import { useState } from 'react'
import { pricingPlans } from '../../data/pricing'

export default function PricingHeroSection() {
  const [isAnnual, setIsAnnual] = useState(true)

  return (
    <div className="container">
      <div className="flex flex-col items-center pt-[116px]">
        <h1 className="text-center text-heading-responsive-lg">From zero to IPO.</h1>
        <p className="mt-4 max-w-md text-balance text-center text-secondary-foreground text-xl">
          Designed for every stage of your journey. Start today, no credit card required.
        </p>
      </div>

      {/* Monthly/Annual toggle */}
      <div className="mt-8">
        <div className="flex flex-col items-center">
          <div className="rounded-xl bg-surface-subtle p-0.5">
            <div className="relative grid grid-cols-[1fr_1fr] gap-x-0.5">
              {/* Sliding indicator */}
              <div
                className="absolute top-0 left-0 h-full w-[calc((100%-2px)/2)] rounded-[10px] bg-primary-background transition-transform duration-500 ease-in-out shadow-[0px_4px_4px_-2px_rgba(24,_39,_75,_0.06),_0px_2px_4px_-2px_rgba(24,_39,_75,_0.02),0px_0px_2px_0px_#E0E0E0]"
                style={{ transform: isAnnual ? 'translateX(calc(100% + 2px))' : 'translateX(0)' }}
              />
              <button
                onClick={() => setIsAnnual(false)}
                className={`isolate rounded-[10px] px-5 py-2 text-sm transition-colors duration-500 ease-in-out cursor-pointer ${!isAnnual ? 'text-black-400' : 'text-black-700'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`isolate rounded-[10px] px-5 py-2 text-sm transition-colors duration-500 ease-in-out cursor-pointer ${isAnnual ? 'text-black-400' : 'text-black-700'}`}
              >
                Annual
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing cards grid */}
      <div className="relative grid grid-cols-12 gap-x-6 mt-10 lg:mt-20">
        {/* Decorative horizontal gradient lines */}
        <div className="pricing-cards-grid-line bg-[linear-gradient(to_left,_rgba(237,_239,_243,_0.00)_0%,_#CAD0D9_6.52%,_#CAD0D9_93.22%,_rgba(237,_239,_243,_0.00)_100%)] absolute -top-3 left-0 hidden h-px w-full -translate-y-1/2 lg:block" />
        <div className="pricing-cards-grid-line bg-[linear-gradient(to_left,_rgba(237,_239,_243,_0.00)_0%,_#CAD0D9_6.52%,_#CAD0D9_93.22%,_rgba(237,_239,_243,_0.00)_100%)] absolute -bottom-3 left-0 hidden h-px w-full translate-y-1/2 [animation-delay:450ms]! lg:block" />

        <div className="relative isolate col-span-12 grid grid-cols-1 gap-6 lg:grid-cols-4 xl:col-span-10 xl:col-start-2">
          {/* Decorative vertical gradient lines */}
          {[1, 2, 3, 4].map((col, idx) => (
            <div
              key={`vline-${col}`}
              className={`pricing-cards-grid-line-vertical bg-[linear-gradient(to_bottom,_rgba(237,_239,_243,_0.00)_0%,_#CAD0D9_10.87%,_#CAD0D9_89.55%,_rgba(237,_239,_243,_0.00)_100%)] absolute top-[-50px] -left-3 col-start-${col} hidden h-[calc(100%+100px)] w-px -translate-x-1/2 ${idx > 0 ? `[animation-delay:${idx * 150}ms]!` : ''} lg:block`}
            />
          ))}
          {/* Right edge line */}
          <div className="pricing-cards-grid-line-vertical bg-[linear-gradient(to_bottom,_rgba(237,_239,_243,_0.00)_0%,_#CAD0D9_10.87%,_#CAD0D9_89.55%,_rgba(237,_239,_243,_0.00)_100%)] absolute top-[-50px] -right-3 col-start-5 hidden h-[calc(100%+100px)] w-px translate-x-1/2 [animation-delay:600ms]! lg:block" />

          {/* Corner crosshairs (4 corners) */}
          {[
            '-top-3 -left-3 -translate-x-1/2 -translate-y-1/2',
            '-top-3 -right-3 translate-x-1/2 -translate-y-1/2',
            '-right-3 -bottom-3 translate-x-1/2 translate-y-1/2',
            '-bottom-3 -left-3 -translate-x-1/2 translate-y-1/2',
          ].map((pos, i) => (
            <div key={`corner-${i}`} className={`absolute ${pos} hidden lg:block`}>
              <div className="relative h-[7px] w-[7px] fade-in animate-in fill-mode-both [animation-delay:1000ms] [animation-duration:1000ms]">
                <div className="absolute top-[3px] left-0 h-px w-full rounded-full bg-muted-strong-background" />
                <div className="absolute top-0 left-[3px] h-full w-px rounded-full bg-muted-strong-background" />
              </div>
            </div>
          ))}

          {/* 4 Pricing cards */}
          {pricingPlans.map((plan) => (
            <div
              key={plan.name}
              className={`flex flex-col justify-between rounded-3xl border border-solid px-[23px] pt-[21px] pb-[23px] ${
                plan.highlighted
                  ? 'border-blue-300 shadow-[0px_0px_0px_4px_rgba(83,_139,_243,_0.10),_0px_1px_2px_-1px_rgba(28,_40,_64,_0.10),_0px_2px_4px_0px_rgba(28,_40,_64,_0.06)]'
                  : 'border-subtle-stroke shadow-[0px_1px_2px_-1px_rgba(28,_40,_64,_0.08),_0px_2px_4px_0px_rgba(28,_40,_64,_0.04)]'
              }`}
            >
              <div className="flex flex-col">
                <header className="text-secondary-foreground text-xl">{plan.name}</header>
                <div className="mt-4 lg:mt-8">
                  <div className="flex items-start gap-2">
                    <div className="inline-block overflow-y-hidden text-heading-md">
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
                      <div className="rounded-lg border border-blue-200 bg-blue-100 px-[7px] py-[3px] text-center text-blue-450 text-xs mt-[6px]">
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
                <div className="mt-5 font-semibold text-secondary-foreground text-sm lg:mt-8">{plan.description}</div>
                <ul className="mt-2.5 flex flex-col gap-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <div className="mt-px h-[18px] w-[18px] shrink-0 rounded-md bg-surface-subtle p-0.5 text-accent-foreground">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path fillRule="evenodd" clipRule="evenodd" d="M11.2649 3.07601C11.4991 3.22236 11.5703 3.53084 11.4239 3.76501L8.27903 8.79686L8.26603 8.81766C7.96584 9.29798 7.72247 9.68737 7.50209 9.9779C7.27756 10.2739 7.03718 10.5228 6.72175 10.6676C6.24572 10.8861 5.70298 10.9091 5.21014 10.7318C4.88356 10.6142 4.62295 10.3867 4.37412 10.1108C4.1299 9.83997 3.85439 9.47262 3.51455 9.01949L3.49983 8.99986L2.59994 7.80001C2.43425 7.57909 2.47902 7.26569 2.69994 7.10001C2.92085 6.93432 3.23425 6.97909 3.39994 7.20001L4.29983 8.39986C4.65789 8.87728 4.90647 9.2079 5.11672 9.44102C5.32588 9.67294 5.45274 9.75629 5.54875 9.79084C5.79517 9.87952 6.06655 9.868 6.30456 9.75874C6.3973 9.71616 6.51663 9.62236 6.70538 9.37354C6.8951 9.12343 7.11474 8.77292 7.43103 8.26686L10.5759 3.23501C10.7223 3.00084 11.0308 2.92965 11.2649 3.07601Z" fill="currentColor" />
                        </svg>
                      </div>
                      <div className="text-sm text-tertiary-foreground">{feature}</div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-5 flex flex-col items-stretch lg:mt-8">
                {plan.price === null ? (
                  <>
                    <button
                      className="relative inline-flex cursor-pointer items-center justify-center text-nowrap border transition-colors duration-300 ease-in-out hover:duration-50 active:duration-50 h-9 gap-x-1.5 rounded-[10px] px-3 text-sm max-lg:h-11.5 max-lg:gap-x-2 max-lg:rounded-xl max-lg:px-3.5 max-lg:text-base button-outline max-md:hidden"
                    >
                      {plan.cta}
                    </button>
                    <button
                      className="relative inline-flex cursor-pointer items-center justify-center text-nowrap border transition-colors duration-300 ease-in-out hover:duration-50 active:duration-50 h-9 gap-x-1.5 rounded-[10px] px-3 text-sm max-lg:h-11.5 max-lg:gap-x-2 max-lg:rounded-xl max-lg:px-3.5 max-lg:text-base button-ghost group self-center md:hidden"
                    >
                      <span>{plan.cta}</span>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="relative transition-[translate] duration-400 ease-in-out group-hover:translate-x-0.25 group-hover:duration-150 group-active:translate-x-0.25 group-active:duration-50">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.1" d="M2.25 7h9.5m0 0L8.357 3.5M11.75 7l-3.393 3.5" />
                      </svg>
                    </button>
                  </>
                ) : (
                  <a
                    href={plan.ctaHref}
                    className={`relative inline-flex cursor-pointer items-center justify-center text-nowrap border transition-colors duration-300 ease-in-out hover:duration-50 active:duration-50 h-9 gap-x-1.5 rounded-[10px] px-3 text-sm max-lg:h-11.5 max-lg:gap-x-2 max-lg:rounded-xl max-lg:px-3.5 max-lg:text-base ${
                      plan.highlighted ? 'button-primary' : 'button-outline'
                    }`}
                  >
                    {plan.cta}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Logo bar */}
      <div className="mt-16">
        <div className="container">
          <div className="">
            <div className="grid grid-cols-12 justify-items-center py-25">
              <div className="col-[2/-2]">
                <div className="grid max-w-7xl grid-cols-6 gap-x-8 gap-y-4.5 max-xl:grid-cols-4 max-xl:gap-y-5 max-lg:gap-x-5 max-lg:gap-y-3 max-md:grid-cols-3 max-md:gap-x-4 max-md:gap-y-2 max-md:[&>*:nth-child(1n+10)]:hidden">
                  {['Railway', 'Public', 'Wordsmith', 'Plain', 'Passionfroot'].map(name => (
                    <span key={name} className="size-full h-12 object-contain max-xl:h-10 text-sm font-medium text-accent-foreground flex items-center justify-center">{name}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
