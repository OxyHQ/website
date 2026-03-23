import { useState } from 'react'
import { featureCategories, pricingPlans } from '../../data/pricing'

const CheckIcon = () => (
  <svg className="mx-auto" width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M11.2649 3.07601C11.4991 3.22236 11.5703 3.53084 11.4239 3.76501L8.27903 8.79686L8.26603 8.81766C7.96584 9.29798 7.72247 9.68737 7.50209 9.9779C7.27756 10.2739 7.03718 10.5228 6.72175 10.6676C6.24572 10.8861 5.70298 10.9091 5.21014 10.7318C4.88356 10.6142 4.62295 10.3867 4.37412 10.1108C4.1299 9.83997 3.85439 9.47262 3.51455 9.01949L3.49983 8.99986L2.59994 7.80001C2.43425 7.57909 2.47902 7.26569 2.69994 7.10001C2.92085 6.93432 3.23425 6.97909 3.39994 7.20001L4.29983 8.39986C4.65789 8.87728 4.90647 9.2079 5.11672 9.44102C5.32588 9.67294 5.45274 9.75629 5.54875 9.79084C5.79517 9.87952 6.06655 9.868 6.30456 9.75874C6.3973 9.71616 6.51663 9.62236 6.70538 9.37354C6.8951 9.12343 7.11474 8.77292 7.43103 8.26686L10.5759 3.23501C10.7223 3.00084 11.0308 2.92965 11.2649 3.07601Z"
      fill="currentColor"
    />
  </svg>
)

function FeatureValue({ value, isProColumn }: { value: string; isProColumn: boolean }) {
  const baseClass = `text-sm text-center min-w-[80px] ${isProColumn ? 'font-medium text-secondary-foreground' : 'text-tertiary-foreground'}`

  if (value === '✓') {
    return (
      <div className={baseClass}>
        <CheckIcon />
      </div>
    )
  }

  if (value === '—') {
    return (
      <div className={baseClass}>
        <span className="text-disabled-foreground">—</span>
      </div>
    )
  }

  return <div className={baseClass}>{value}</div>
}

function MobileFeatureRow({ feature }: { feature: { name: string; values: [string, string, string, string] } }) {
  const [isOpen, setIsOpen] = useState(false)
  const planNames = pricingPlans.map((p) => p.name)

  return (
    <div className="border-subtle-stroke border-b">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full cursor-pointer items-center justify-between py-4"
      >
        <span className="text-sm text-tertiary-foreground">{feature.name}</span>
        <svg
          className={`h-4 w-4 shrink-0 text-tertiary-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          viewBox="0 0 16 16"
          fill="none"
        >
          <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {isOpen && (
        <div className="flex flex-col gap-y-2 pb-4">
          {feature.values.map((val, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className={`text-sm ${i === 2 ? 'font-medium text-secondary-foreground' : 'text-tertiary-foreground'}`}>
                {planNames[i]}
              </span>
              <FeatureValue value={val} isProColumn={i === 2} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function PricingCompareSection() {
  const planNames = pricingPlans.map((p) => p.name)

  return (
    <div className="container">
      <div className="flex flex-col items-center">
        <h2 className="font-bold text-heading-md">Compare plans.</h2>
        <p className="mt-2 text-secondary-foreground">
          Everything you need to build the perfect relationship management tool for your team.
        </p>
      </div>

      {/* Desktop table */}
      <div className="mt-10 hidden flex-col gap-y-10 lg:flex">
        {/* Column headers */}
        <div className="grid grid-cols-[220px_1fr_1fr_1fr_1fr] gap-x-6">
          <div />
          {planNames.map((name, i) => (
            <div
              key={name}
              className={`text-center text-sm font-medium ${i === 2 ? 'rounded-t-lg bg-secondary-background py-2 text-secondary-foreground' : 'py-2 text-tertiary-foreground'}`}
            >
              {name}
            </div>
          ))}
        </div>

        {featureCategories.map((category) => (
          <div key={category.name}>
            <h3 className="border-subtle-stroke border-b py-4 text-lg text-secondary-foreground">{category.name}</h3>
            {category.features.map((feature) => (
              <div
                key={feature.name}
                className="grid grid-cols-[220px_1fr_1fr_1fr_1fr] gap-x-6 border-subtle-stroke border-b"
              >
                <span className="flex items-start gap-x-1.5 py-4">
                  <span className="text-sm text-tertiary-foreground">{feature.name}</span>
                </span>
                {feature.values.map((val, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-center py-4 ${i === 2 ? 'bg-secondary-background' : ''}`}
                  >
                    <FeatureValue value={val} isProColumn={i === 2} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Mobile table */}
      <div className="mt-10 flex flex-col gap-y-6 lg:hidden">
        {featureCategories.map((category) => (
          <div key={category.name}>
            <h3 className="border-subtle-stroke border-b py-4 text-lg text-secondary-foreground">{category.name}</h3>
            {category.features.map((feature) => (
              <MobileFeatureRow key={feature.name} feature={feature} />
            ))}
          </div>
        ))}
      </div>

      {/* Bottom spacing */}
      <div className="h-20 lg:h-32" />
    </div>
  )
}
