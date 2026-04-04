import { useState } from 'react'
import { usePricing } from '../../api/hooks'
import { featureCategories, type PricingPlan } from '../../data/pricing'

const CheckIcon = () => (
  <span className="flex h-5 items-center">
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-tertiary-foreground">
      <path d="M7 0.5C10.5899 0.5 13.5 3.41015 13.5 7C13.5 10.5899 10.5899 13.5 7 13.5C3.41015 13.5 0.5 10.5899 0.5 7C0.5 3.41015 3.41015 0.5 7 0.5ZM9.77734 4.58398C9.54758 4.43081 9.23716 4.49289 9.08398 4.72266L6.65332 8.36914C6.5595 8.50987 6.35573 8.51869 6.25 8.38672L4.89062 6.6875C4.71812 6.47187 4.40313 6.43687 4.1875 6.60938C3.97187 6.78188 3.93687 7.09687 4.10938 7.3125L5.46875 9.01172C5.99728 9.67219 7.01611 9.6277 7.48535 8.92383L9.91602 5.27734C10.0692 5.04758 10.0071 4.73716 9.77734 4.58398Z" fill="currentColor" />
    </svg>
  </span>
)

const XIcon = () => (
  <span className="flex h-5 items-center">
    <svg width="14" height="14" viewBox="0 0 14 14" className="text-caption-foreground">
      <path d="M10.6469 2.64673C10.8421 2.45147 11.1586 2.45147 11.3539 2.64673C11.5488 2.84202 11.549 3.1586 11.3539 3.35376L7.7074 6.99927L11.3539 10.6458C11.5491 10.841 11.5491 11.1585 11.3539 11.3538C11.1586 11.549 10.8411 11.549 10.6459 11.3538L6.99939 7.70728L3.35388 11.3538C3.15871 11.5488 2.84208 11.5487 2.64685 11.3538C2.45159 11.1585 2.45159 10.841 2.64685 10.6458L6.29236 6.99927L2.64685 3.35376C2.45159 3.1585 2.45159 2.84199 2.64685 2.64673C2.84211 2.45147 3.15862 2.45147 3.35388 2.64673L7.00037 6.29224L10.6469 2.64673Z" fill="currentColor" />
    </svg>
  </span>
)

function renderValue(val: string) {
  if (val === '✓') return <CheckIcon />
  if (val === '—') return <XIcon />
  return val
}

function MobileFeatureRow({ feature }: { feature: { name: string; values: [string, string, string, string] } }) {
  const [isOpen, setIsOpen] = useState(true)
  const { data: pricingPlans = [] } = usePricing()
  const planNames = pricingPlans.map((p: PricingPlan) => p.name)

  return (
    <div data-state={isOpen ? 'open' : 'closed'}>
      <div className="flex w-full items-center justify-between border-subtle-stroke border-b py-4">
        <span className="flex items-start gap-x-1.5">
          <div className="flex gap-x-2">
            <span className="text-sm text-tertiary-foreground">{feature.name}</span>
          </div>
        </span>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="group h-5 before:absolute before:size-8"
          type="button"
          data-state={isOpen ? 'open' : 'closed'}
        >
          <svg className={`shrink-0 transition-transform ${isOpen ? '-rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M5.25 7.125 9 10.875l3.75-3.75" />
          </svg>
        </button>
      </div>
      {isOpen && (
        <div>
          {feature.values.map((val, i) => (
            <div key={i} className="grid grid-cols-2 items-start border-weak-stroke border-b py-2.5 text-sm text-tertiary-foreground">
              <span className="text-accent-foreground">{planNames[i]}</span>
              {renderValue(val)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function PricingCompareSection() {
  const [isAnnual, setIsAnnual] = useState(true)

  return (
    <div className="pt-12 lg:hidden">
      <div className="flex flex-col items-center text-center">
        <h2 className="font-bold text-heading-md">Compare plans.</h2>
        <p className="mt-2 text-secondary-foreground">
          Everything you need to build the perfect relationship management tool for your team.
        </p>
        <div className="rounded-xl bg-surface-subtle p-0.5 mt-5">
          <div className="relative grid grid-cols-[1fr_1fr] gap-x-0.5">
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

      {/* Mobile accordion table */}
      <div className="mt-10 flex flex-col gap-y-10">
        {featureCategories.map((category) => (
          <div key={category.name}>
            <h3 className="border-subtle-stroke border-b py-4 text-lg text-secondary-foreground">{category.name}</h3>
            {category.features.map((feature) => (
              <MobileFeatureRow key={feature.name} feature={feature} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
