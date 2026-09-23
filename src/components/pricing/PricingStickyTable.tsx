import { RiCheckboxCircleFill } from '@oxy.so/bloom/icons/RiCheckboxCircleFill'
import { RiCloseLine } from '@oxy.so/bloom/icons/RiCloseLine'
import { usePricing } from '../../api/hooks'
import Button from '../ui/Button'
import BillingToggle from './BillingToggle'
import { featureCategories } from '../../data/pricing'

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

interface Props {
  isAnnual: boolean
  onToggle: (isAnnual: boolean) => void
}

export default function PricingStickyTable({ isAnnual, onToggle }: Props) {
  const { data: pricingPlans = [] } = usePricing()

  return (
    <div className="container">
      <div className="hidden lg:block">
        <div className="pt-11">
          {/* Not a `container` again: this is already inside one, and nesting
              them applied the page gutter twice — the table sat 96px inside
              every other section on the site. */}
          <div className="grid grid-cols-12 gap-x-6">
            <div className="col-span-full xl:col-span-full">
              {/* Sticky header row with plan names + prices + CTAs */}
              <div className="grid grid-cols-[220px_1fr_1fr_1fr_1fr] gap-x-6 pt-10 sticky top-(--site-header-height) z-2 bg-background">
                {/* First column: billing toggle */}
                <div className="-mb-0.5 flex flex-col justify-end gap-y-4">
                  <p className="text-accent-foreground text-xs">Select preferred <br /> billing cycle</p>
                  <BillingToggle isAnnual={isAnnual} onChange={onToggle} />
                </div>

                {/* 4 plan columns */}
                {pricingPlans.map((plan) => (
                  <div key={plan.name}>
                    <div className="flex items-center gap-x-2">
                      <h3 className="text-2xl text-muted-foreground">{plan.name}</h3>
                      {plan.highlighted && (
                        <div className="rounded-lg border border-info/30 bg-info-subtle px-2 py-1 text-center text-info-text text-xs">Popular</div>
                      )}
                    </div>
                    <div className="mt-2">
                      {plan.price ? (
                        <>
                          <p className="text-accent-foreground text-xs">
                            ${isAnnual ? plan.price.annual : plan.price.monthly} per user/month,
                          </p>
                          <p className="text-accent-foreground text-xs">
                            billed {isAnnual ? 'annually' : 'monthly'}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-accent-foreground text-xs">Get a custom quote,</p>
                          <p className="text-accent-foreground text-xs">billed annually</p>
                        </>
                      )}
                    </div>
                    <div className="mt-4 flex flex-col items-stretch">
                      {plan.price === null ? (
                        <Button variant="outline" size="md">{plan.cta}</Button>
                      ) : (
                        <Button variant={plan.highlighted ? 'primary' : 'outline'} size="md" href={plan.ctaHref}>
                          {plan.cta}
                        </Button>
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
                    <h2 className="sticky top-[calc(var(--site-header-height)+197px)] z-1 border-border border-b bg-background py-4 text-lg text-muted-foreground">
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
