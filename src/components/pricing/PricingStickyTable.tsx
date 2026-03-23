import { useState } from 'react'
import { pricingPlans, featureCategories } from '../../data/pricing'

const CheckIcon = () => (
  <span className="flex h-5 items-center">
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-muted-foreground">
      <path d="M7 0.5C10.5899 0.5 13.5 3.41015 13.5 7C13.5 10.5899 10.5899 13.5 7 13.5C3.41015 13.5 0.5 10.5899 0.5 7C0.5 3.41015 3.41015 0.5 7 0.5ZM9.77734 4.58398C9.54758 4.43081 9.23716 4.49289 9.08398 4.72266L6.65332 8.36914C6.5595 8.50987 6.35573 8.51869 6.25 8.38672L4.89062 6.6875C4.71812 6.47187 4.40313 6.43687 4.1875 6.60938C3.97187 6.78188 3.93687 7.09687 4.10938 7.3125L5.46875 9.01172C5.99728 9.67219 7.01611 9.6277 7.48535 8.92383L9.91602 5.27734C10.0692 5.04758 10.0071 4.73716 9.77734 4.58398Z" fill="currentColor" />
    </svg>
  </span>
)

const XIcon = () => (
  <span className="flex h-5 items-center">
    <svg width="14" height="14" viewBox="0 0 14 14" className="text-muted-foreground">
      <path d="M10.6469 2.64673C10.8421 2.45147 11.1586 2.45147 11.3539 2.64673C11.5488 2.84202 11.549 3.1586 11.3539 3.35376L7.7074 6.99927L11.3539 10.6458C11.5491 10.841 11.5491 11.1585 11.3539 11.3538C11.1586 11.549 10.8411 11.549 10.6459 11.3538L6.99939 7.70728L3.35388 11.3538C3.15871 11.5488 2.84208 11.5487 2.64685 11.3538C2.45159 11.1585 2.45159 10.841 2.64685 10.6458L6.29236 6.99927L2.64685 3.35376C2.45159 3.1585 2.45159 2.84199 2.64685 2.64673C2.84211 2.45147 3.15862 2.45147 3.35388 2.64673L7.00037 6.29224L10.6469 2.64673Z" fill="currentColor" />
    </svg>
  </span>
)

function FeatureValue({ value }: { value: string; isProColumn?: boolean }) {
  if (value === '✓') {
    return (
      <div className={`relative px-2 text-center text-sm text-muted-foreground`}>
        <CheckIcon />
      </div>
    )
  }

  if (value === '—') {
    return (
      <div className={`relative px-2 text-center text-sm text-muted-foreground`}>
        <XIcon />
      </div>
    )
  }

  return <div className={`relative px-2 text-center text-sm text-muted-foreground`}>{value}</div>
}

export default function PricingStickyTable() {
  const [isAnnual, setIsAnnual] = useState(true)

  return (
    <div className="container">
      <div className="hidden lg:block">
        <div className="pt-11">
          <div className="container grid grid-cols-12 gap-x-6">
            <div className="col-span-full xl:col-[2/-2]">
              {/* Sticky header row with plan names + prices + CTAs */}
              <div className="grid grid-cols-[220px_1fr_1fr_1fr_1fr] gap-x-6 pt-10 sticky top-(--site-header-height) z-2 bg-background">
                {/* First column: billing toggle */}
                <div className="-mb-0.5 flex flex-col justify-end gap-y-4">
                  <p className="text-muted-foreground text-xs">Select preferred <br /> billing cycle</p>
                  <div className="rounded-xl bg-surface p-0.5">
                    <div className="relative grid grid-cols-[1fr_1fr] gap-x-0.5">
                      <div
                        className="absolute top-0 left-0 h-full w-[calc((100%-2px)/2)] rounded-[10px] bg-background transition-transform duration-500 ease-in-out shadow-[0px_4px_4px_-2px_rgba(24,_39,_75,_0.06),_0px_2px_4px_-2px_rgba(24,_39,_75,_0.02),0px_0px_2px_0px_var(--color-border)]"
                        style={{ transform: isAnnual ? 'translateX(calc(100% + 2px))' : 'translateX(0)' }}
                      />
                      <button
                        onClick={() => setIsAnnual(false)}
                        className={`isolate rounded-[10px] px-5 py-2 text-sm transition-colors duration-500 ease-in-out cursor-pointer ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}
                      >
                        Monthly
                      </button>
                      <button
                        onClick={() => setIsAnnual(true)}
                        className={`isolate rounded-[10px] px-5 py-2 text-sm transition-colors duration-500 ease-in-out cursor-pointer ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}
                      >
                        Annual
                      </button>
                    </div>
                  </div>
                </div>

                {/* 4 plan columns */}
                {pricingPlans.map((plan) => (
                  <div key={plan.name}>
                    <div className="flex items-center gap-x-2">
                      <h3 className="text-2xl text-foreground">{plan.name}</h3>
                      {plan.highlighted && (
                        <div className="rounded-lg border border-primary/20 bg-primary/10 px-2 py-1 text-center text-primary text-xs">Popular</div>
                      )}
                    </div>
                    <div className="mt-2">
                      {plan.price ? (
                        <>
                          <p className="text-muted-foreground text-xs">
                            ${isAnnual ? plan.price.annual : plan.price.monthly} per user/month,
                          </p>
                          <p className="text-muted-foreground text-xs">
                            billed {isAnnual ? 'annually' : 'monthly'}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-muted-foreground text-xs">Get a custom quote,</p>
                          <p className="text-muted-foreground text-xs">billed annually</p>
                        </>
                      )}
                    </div>
                    <div className="mt-4 flex flex-col items-stretch">
                      {plan.price === null ? (
                        <button
                          className="relative inline-flex cursor-pointer items-center justify-center text-nowrap border transition-colors duration-300 ease-in-out hover:duration-50 active:duration-50 h-9 gap-x-1.5 rounded-[10px] px-3 text-sm button-outline"
                        >
                          {plan.cta}
                        </button>
                      ) : (
                        <a
                          href={plan.ctaHref}
                          className={`relative inline-flex cursor-pointer items-center justify-center text-nowrap border transition-colors duration-300 ease-in-out hover:duration-50 active:duration-50 h-9 gap-x-1.5 rounded-[10px] px-3 text-sm ${
                            plan.highlighted ? 'button-primary' : 'button-outline'
                          }`}
                        >
                          {plan.cta}
                        </a>
                      )}
                    </div>
                  </div>
                ))}

                {/* Divider line */}
                <svg width="100%" height="1" className="text-border col-span-full mt-8">
                  <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="currentColor" strokeLinecap="round" />
                </svg>
              </div>

              {/* Category sections with sticky headers */}
              <div className="mt-10 flex flex-col gap-y-15">
                {featureCategories.map((category) => (
                  <div key={category.name}>
                    <h2 className="sticky top-[calc(var(--site-header-height)+197px)] z-1 border-border border-b bg-background py-4 text-lg text-foreground">
                      {category.name}
                    </h2>
                    {category.features.map((feature) => (
                      <div
                        key={feature.name}
                        className="grid grid-cols-[220px_1fr_1fr_1fr_1fr] gap-x-6 border-border border-b"
                      >
                        <div className="flex items-start justify-between gap-x-3 py-4.5">
                          <div className="flex items-start gap-x-1">
                            <span className="text-sm text-muted-foreground">{feature.name}</span>
                          </div>
                        </div>
                        {feature.values.map((val, i) => (
                          <div
                            key={i}
                            className={`flex items-start justify-center gap-x-1.5 py-4.5 ${i === 2 ? 'bg-surface' : ''}`}
                          >
                            <FeatureValue value={val} isProColumn={i === 2} />
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
