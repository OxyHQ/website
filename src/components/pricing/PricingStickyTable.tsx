import { useState } from 'react'
import { pricingPlans, featureCategories } from '../../data/pricing'

export default function PricingStickyTable() {
  const [isAnnual, setIsAnnual] = useState(true)

  return (
    <div className="container">
      <div className="hidden lg:block">
        <div className="pt-11">
          <div className="container grid grid-cols-12 gap-x-6">
            <div className="col-span-full xl:col-[2/-2]">
              {/* Sticky header row with plan names + prices + CTAs */}
              <div className="grid grid-cols-[220px_1fr_1fr_1fr_1fr] gap-x-6 pt-10 sticky top-(--site-header-height) z-2 bg-primary-background">
                {/* First column: billing toggle */}
                <div className="-mb-0.5 flex flex-col justify-end gap-y-4">
                  <p className="text-accent-foreground text-xs">Select preferred billing cycle</p>
                  <div className="rounded-xl bg-surface-subtle p-0.5">
                    <div className="relative grid grid-cols-[1fr_1fr] gap-x-0.5">
                      <div
                        className="absolute top-0 left-0 h-full w-[calc((100%-2px)/2)] rounded-[10px] bg-primary-background transition-transform duration-500 ease-in-out shadow-[0px_4px_4px_-2px_rgba(24,39,75,0.06),0px_2px_4px_-2px_rgba(24,39,75,0.02),0px_0px_2px_0px_#E0E0E0]"
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

                {/* 4 plan columns */}
                {pricingPlans.map((plan) => (
                  <div key={plan.name}>
                    <h3 className="text-2xl text-secondary-foreground">{plan.name}</h3>
                    <div className="mt-2">
                      <p className="text-accent-foreground text-xs">
                        {plan.price
                          ? `$${isAnnual ? plan.price.annual : plan.price.monthly} per user/month, billed ${isAnnual ? 'annually' : 'monthly'}`
                          : 'Talk to us for pricing'}
                      </p>
                    </div>
                    <div className="mt-4 flex flex-col items-stretch">
                      <a
                        href={plan.ctaHref}
                        className={`relative inline-flex cursor-pointer items-center justify-center text-nowrap border transition-colors duration-300 ease-in-out hover:duration-50 active:duration-50 h-9 gap-x-1.5 rounded-[10px] px-3 text-sm ${
                          plan.highlighted ? 'button-primary' : 'button-outline'
                        }`}
                      >
                        {plan.cta}
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {/* Category sections with sticky headers */}
              <div className="mt-10 flex flex-col gap-y-15">
                {featureCategories.map((category) => (
                  <div key={category.name}>
                    <h2 className="sticky top-[calc(var(--site-header-height)+197px)] z-1 border-subtle-stroke border-b bg-primary-background py-4 text-lg text-secondary-foreground">
                      {category.name}
                    </h2>
                    {category.features.map((feature) => (
                      <div
                        key={feature.name}
                        className="grid grid-cols-[220px_1fr_1fr_1fr_1fr] gap-x-6 border-subtle-stroke border-b"
                      >
                        <div className="flex items-start justify-between gap-x-3 py-4.5">
                          <span className="text-sm text-tertiary-foreground">{feature.name}</span>
                        </div>
                        {feature.values.map((val, i) => (
                          <div
                            key={i}
                            className={`flex items-start justify-center gap-x-1.5 py-4.5 ${i === 2 ? 'bg-secondary-background' : ''}`}
                          >
                            <div className="relative px-2 text-center text-sm text-tertiary-foreground">{val}</div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
