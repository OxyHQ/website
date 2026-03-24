import { useState, useEffect } from 'react'
import { Check, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'

interface FeatureItem {
  label: string
  description: string
}

interface FeatureCategory {
  category: string
  items: FeatureItem[]
}

interface Plan {
  id: string
  name: string
  monthlyPrice: number
  annualPrice: number
  creditsPerMonth: number
  creditsLabel: string
  isFeatured: boolean
  isFree: boolean
  features: FeatureCategory[]
  subtitle: string
  sortOrder: number
}

function formatPrice(cents: number) {
  const dollars = cents / 100
  if (dollars === 0) return 'Free'
  return `$${dollars % 1 === 0 ? dollars : dollars.toFixed(2)}`
}

export default function AIPricingPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')

  useEffect(() => {
    fetch('https://api.alia.onl/billing/plans?product=alia')
      .then((r) => r.json())
      .then((data) => setPlans(data.plans?.sort((a: Plan, b: Plan) => a.sortOrder - b.sortOrder) || []))
      .catch(() => {})
  }, [])

  // Collect all unique categories across all plans
  const allCategories = plans.length > 0
    ? [...new Map(plans.flatMap((p) => p.features).map((f) => [f.category, f])).values()]
    : []

  // For each category, collect all unique feature labels
  const categoryFeatures = allCategories.map((cat) => {
    const allItems = new Map<string, FeatureItem>()
    plans.forEach((plan) => {
      const planCat = plan.features.find((f) => f.category === cat.category)
      planCat?.items.forEach((item) => {
        if (!allItems.has(item.label)) allItems.set(item.label, item)
      })
    })
    return { category: cat.category, items: [...allItems.values()] }
  })

  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 pt-8 pb-16">
          {/* Back */}
          <Link to="/ai" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="size-4" /> Back
          </Link>

          {/* Header */}
          <h1 className="text-4xl md:text-5xl font-semibold text-center mb-8">Choose your plan</h1>

          {/* Billing toggle */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex rounded-full bg-surface p-1 gap-1">
              <button
                onClick={() => setBilling('monthly')}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${billing === 'monthly' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling('annual')}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${billing === 'annual' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Annual · Save 20%
              </button>
            </div>
          </div>

          {/* Plan cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-16">
            {plans.map((plan) => {
              const price = billing === 'monthly' ? plan.monthlyPrice : Math.round(plan.annualPrice / 12)
              return (
                <div
                  key={plan.id}
                  className={`flex flex-col rounded-2xl p-5 xl:p-6 border transition-colors ${
                    plan.isFeatured
                      ? 'border-primary bg-surface'
                      : 'border-border bg-surface'
                  }`}
                >
                  {/* Name + badge */}
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-semibold">{plan.name}</h2>
                    {plan.isFeatured && (
                      <span className="bg-primary text-primary-foreground text-xs font-medium px-2 py-0.5 rounded-full">Popular</span>
                    )}
                  </div>

                  {/* Subtitle */}
                  <p className="text-sm text-muted-foreground mb-4">
                    {plan.features.find((f) => f.category === 'Credits')?.items[0]?.description?.split('—')[0]?.trim() ||
                      (plan.isFree ? 'Get started with Alia' : `Essential AI for ${plan.name.toLowerCase()} use`)}
                  </p>

                  {/* Price */}
                  <div className="mb-1">
                    <span className="text-4xl font-semibold">{formatPrice(price)}</span>
                    {!plan.isFree && <span className="text-muted-foreground text-lg"> /mo</span>}
                  </div>

                  {/* Credits */}
                  <p className="text-sm text-muted-foreground mb-6">{plan.creditsLabel}</p>

                  {/* CTA */}
                  <a
                    href={plan.isFree ? '/signup' : `/signup?plan=${plan.id}`}
                    className={`mt-auto inline-flex items-center justify-center h-10 rounded-full text-sm font-medium transition-all duration-200 hover:rounded-lg ${
                      plan.isFeatured
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-surface-foreground/10 border border-border text-foreground hover:bg-accent'
                    }`}
                  >
                    {plan.isFree ? 'Get started' : 'Upgrade'}
                  </a>
                </div>
              )
            })}
          </div>

          {/* Comparison table */}
          {categoryFeatures.map((cat) => (
            <div key={cat.category} className="mb-8">
              {/* Category header */}
              <div className="grid grid-cols-[1fr] sm:grid-cols-[1fr_repeat(5,1fr)] gap-3 border-b border-border pb-3 mb-2">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground col-span-full sm:col-span-1">
                  {cat.category}
                </h3>
                {plans.map((plan) => (
                  <div key={plan.id} className="hidden sm:block text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    {cat.category}
                  </div>
                ))}
              </div>

              {/* Feature rows */}
              {cat.items.map((feature) => (
                <div
                  key={feature.label}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_repeat(5,1fr)] gap-3 py-3 border-b border-border/40 hover:bg-accent/50 transition-colors items-start"
                >
                  {/* Feature label + description (mobile: full width, desktop: first col) */}
                  <div className="sm:pr-4">
                    <div className="font-medium text-sm">{feature.label}</div>
                    <div className="text-xs text-muted-foreground leading-tight">{feature.description}</div>
                  </div>

                  {/* Plan columns */}
                  {plans.map((plan) => {
                    const planCat = plan.features.find((f) => f.category === cat.category)
                    const hasFeature = planCat?.items.some((item) => item.label === feature.label)
                    return (
                      <div key={plan.id} className="flex items-start gap-1">
                        {/* Mobile: show plan name */}
                        <span className="sm:hidden text-xs text-muted-foreground w-12 shrink-0">{plan.name}</span>
                        {hasFeature ? (
                          <Check className="size-4 text-primary mt-0.5" />
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}
