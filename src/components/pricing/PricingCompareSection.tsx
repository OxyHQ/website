import { useState } from 'react'
import { RiArrowDownSLine } from '@oxy.so/bloom/icons/RiArrowDownSLine'
import { RiCheckboxCircleFill } from '@oxy.so/bloom/icons/RiCheckboxCircleFill'
import { RiCloseLine } from '@oxy.so/bloom/icons/RiCloseLine'
import { usePricing } from '../../api/hooks'
import { featureCategories, type PricingPlan } from '../../data/pricing'
import { AnimatedTitle } from '../ui/AnimatedTitle'

// Bloom glyphs take `currentColor` from the span; their default fill is the
// theme's primary, and they render no className onto the <svg>.
const CheckIcon = () => (
  <span className="flex h-5 items-center text-muted-foreground">
    <RiCheckboxCircleFill width={14} height={14} fill="currentColor" />
  </span>
)

const XIcon = () => (
  <span className="flex h-5 items-center text-muted-foreground">
    <RiCloseLine width={14} height={14} fill="currentColor" />
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
      <div className="flex w-full items-center justify-between border-border border-b py-4">
        <span className="flex items-start gap-x-1.5">
          <div className="flex gap-x-2">
            <span className="text-sm text-muted-foreground">{feature.name}</span>
          </div>
        </span>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="group h-5 before:absolute before:size-8"
          type="button"
          data-state={isOpen ? 'open' : 'closed'}
          aria-expanded={isOpen}
          aria-label={feature.name}
        >
          <span className={`flex shrink-0 transition-transform ${isOpen ? '-rotate-180' : ''}`}>
            <RiArrowDownSLine width={18} height={18} fill="currentColor" />
          </span>
        </button>
      </div>
      {isOpen && (
        <div>
          {feature.values.map((val, i) => (
            <div key={i} className="grid grid-cols-2 items-start border-weak-stroke border-b py-2.5 text-sm text-muted-foreground">
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
  return (
    <div className="container pt-12 lg:hidden">
      <div className="flex flex-col items-center text-center">
        <AnimatedTitle as="h2" className="font-bold text-title-md">Compare plans.</AnimatedTitle>
        <p className="mt-2 text-muted-foreground">
          Everything you need to build, run, and scale on top of the Oxy ecosystem.
        </p>
      </div>

      {/* Mobile accordion table */}
      <div className="mt-10 flex flex-col gap-y-10">
        {featureCategories.map((category) => (
          <div key={category.name}>
            <h3 className="border-border border-b py-4 text-lg text-muted-foreground">{category.name}</h3>
            {category.features.map((feature) => (
              <MobileFeatureRow key={feature.name} feature={feature} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
