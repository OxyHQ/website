import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'

interface FeatureItem { label: string; description: string }
interface FeatureCategory { category: string; items: FeatureItem[] }
interface APIPlan {
  id: string; name: string; monthlyPrice: number; annualPrice: number
  creditsPerMonth: number; creditsLabel: string; isFeatured: boolean
  isFree: boolean; features: FeatureCategory[]; sortOrder: number
}

function formatPrice(cents: number) {
  if (cents === 0) return '$0'
  const d = cents / 100
  return `$${d % 1 === 0 ? d : d.toFixed(2)}`
}

function CellValue({ value }: { value: string }) {
  if (value === '✓') return <Check className="size-4 mt-0.5" />
  if (value === '—') return <span className="text-muted-foreground text-sm md:text-base flex-none">﹣</span>
  const lines = value.split('\n')
  return (
    <div className="text-sm md:text-base flex-none leading-tight w-fit">
      {lines[0]}
      {lines[1] && <div className="text-muted-foreground">{lines[1]}</div>}
    </div>
  )
}

function getCardStyle(index: number, total: number, isFeatured: boolean) {
  if (isFeatured) return { bg: 'bg-primary text-primary-foreground', dot: 'bg-primary-foreground', border: 'border-primary-foreground/20', accent: 'text-primary-foreground/70', cta: 'bg-primary-foreground text-primary' }
  if (index === total - 1) return { bg: 'bg-foreground text-background', dot: 'bg-background/60', border: 'border-background/20', accent: 'text-background/70', cta: 'bg-background text-foreground' }
  return { bg: 'bg-secondary text-secondary-foreground', dot: 'bg-primary', border: 'border-primary/20', accent: 'text-primary', cta: 'bg-primary text-primary-foreground hover:bg-primary/90' }
}

function buildComparison(plans: APIPlan[]) {
  const allCategories = [...new Map(plans.flatMap((p) => p.features).map((f) => [f.category, f])).values()]
  return allCategories.map((cat) => {
    const allItems = new Map<string, FeatureItem>()
    plans.forEach((plan) => {
      plan.features.find((f) => f.category === cat.category)?.items.forEach((item) => {
        if (!allItems.has(item.label)) allItems.set(item.label, item)
      })
    })
    return {
      title: cat.category,
      rows: [...allItems.values()].map((item) => ({
        label: item.label,
        values: plans.map((plan) =>
          plan.features.find((f) => f.category === cat.category)?.items.some((i) => i.label === item.label) ? '✓' : '—'
        ),
      })),
    }
  })
}

export default function AIPricingPage() {
  const [plans, setPlans] = useState<APIPlan[]>([])
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')

  useEffect(() => {
    fetch('https://api.alia.onl/billing/plans?product=alia')
      .then((r) => r.json())
      .then((data) => setPlans(data.plans?.sort((a: APIPlan, b: APIPlan) => a.sortOrder - b.sortOrder) || []))
      .catch(() => {})
  }, [])

  const comparison = plans.length > 0 ? buildComparison(plans) : []
  const sidebarLabels = ['Credits', 'Models', 'Channels', 'Limits']

  if (plans.length === 0) return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <div className="flex-1 flex items-center justify-center text-muted-foreground">Loading plans...</div>
      <Footer />
    </div>
  )

  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <Navbar />
      <main>
        {/* Hero + Cards */}
        <div className="overflow-x-hidden">
          <div className="mx-auto max-w-5xl px-4 sm:px-8">
            {/* Hero */}
            <section className="mt-24 mb-8 lg:mb-0">
              <h1 className="text-5xl xl:text-6xl text-balance">
                Predictable pricing. <span className="text-muted-foreground">Designed to scale.</span>
              </h1>
            </section>

            {/* Billing toggle */}
            <div className="flex mt-6 mb-4 lg:mb-0">
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

            {/* Pricing Cards */}
            <section className="mb-6 flex md:mt-12 md:mb-10 lg:mt-12 lg:mb-15">
              <div id="pricing-plans" className="flex flex-col gap-2 lg:flex-row w-full">
                {/* Left sidebar (desktop only) */}
                <div className="hidden lg:flex flex-1 flex-col pt-[148px] xl:pt-[162px] mt-1 pr-3">
                  <div className="pb-6 text-2xl">Start building for free</div>
                  <div className="flex-1">
                    {sidebarLabels.map((label) => (
                      <div key={label} className="flex items-center justify-between flex-none mt-2 pt-2 text-xl border-t border-muted-foreground/30">
                        <div className="flex items-center gap-2 font-normal xl:text-xl text-lg text-pretty text-muted-foreground">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* All plan cards */}
                <div className="flex flex-1 gap-2 overflow-x-auto lg:overflow-visible">
                  {plans.map((plan, index) => {
                    const style = getCardStyle(index, plans.length, plan.isFeatured)
                    const price = billing === 'monthly' ? plan.monthlyPrice : Math.round(plan.annualPrice / 12)
                    const credits = plan.features.find((f) => f.category === 'Credits')?.items[0]?.label || plan.creditsLabel
                    const models = plan.features.find((f) => f.category === 'Models')
                    const channels = plan.features.find((f) => f.category === 'Channels')
                    const limits = plan.features.find((f) => f.category === 'Limits')

                    return (
                      <div key={plan.id} className="flex flex-1 min-w-[160px]">
                        <div className={`relative flex flex-1 flex-col rounded-2xl p-3 xl:p-4 ${style.bg}`}>
                          <div className="size-4 flex items-center mb-2">
                            <div className={`${style.dot} size-3 rounded-full`} />
                          </div>
                          <h2 className="text-lg font-normal normal-case">{plan.name}</h2>
                          <p className="mb-3 text-sm opacity-50">
                            {plan.isFree ? 'For everyone' : plan.isFeatured ? 'Most popular' : plan.creditsLabel}
                          </p>
                          <div className="pb-3 text-2xl xl:text-3xl font-normal">
                            {plan.isFree ? 'Free' : formatPrice(price)}
                            {!plan.isFree && <span className="text-sm"> /mo</span>}
                          </div>
                          <div className="flex-1">
                            {credits && (
                              <div className={`flex items-center justify-between flex-none mt-1 pt-1 text-sm border-t ${style.border}`}>
                                <div className="flex items-center gap-1 font-normal text-pretty leading-tight">{credits}</div>
                              </div>
                            )}
                            {models && (
                              <div className={`flex items-center justify-between flex-none mt-1 pt-1 text-sm border-t ${style.border}`}>
                                <div className="flex items-center gap-1 font-normal text-pretty leading-tight">{models.items.length} AI models</div>
                              </div>
                            )}
                            {channels && (
                              <div className={`flex items-center justify-between flex-none mt-1 pt-1 text-sm border-t ${style.border}`}>
                                <div className="flex items-center gap-1 font-normal text-pretty leading-tight">{channels.items.length} channels</div>
                              </div>
                            )}
                            {limits && (
                              <div className={`flex items-center justify-between flex-none mt-1 pt-1 text-sm border-t ${style.border}`}>
                                <div className="flex items-center gap-1 font-normal text-pretty leading-tight">{limits.items[0]?.label}</div>
                              </div>
                            )}
                          </div>
                          <a
                            className={`inline-flex flex-none items-center justify-center cursor-pointer font-medium px-3 py-1.5 mt-5 w-fit h-8 rounded-[2rem] hover:rounded-none transition-all duration-200 text-sm ${style.cta}`}
                            href={plan.isFree ? '/signup' : `/signup?plan=${plan.id}`}
                          >
                            {plan.isFree ? 'Get started' : plan.isFeatured ? `Get ${plan.name}` : 'Upgrade'}
                          </a>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-clip bg-background">
          <div className="mx-auto max-w-5xl px-4 sm:px-8 flex flex-col gap-12">
            <div className="w-full text-lg">
              {/* Sticky header */}
              <div className="flex sticky top-14 gap-3 bg-background border-b border-border z-10">
                <div className="flex-1 hidden md:block" />
                {plans.map((plan) => (
                  <div key={plan.id} className="flex-1 pt-2 pb-3 flex flex-col items-start gap-1">
                    <div className="font-semibold flex items-center gap-2">
                      <span className={`size-2.5 flex-none rounded-full ${plan.isFeatured ? 'bg-primary' : 'bg-muted-foreground'}`} />
                      <span>{plan.name}</span>
                    </div>
                    <a
                      className={`rounded-2xl px-3 py-1 text-sm md:text-base font-normal hover:rounded-none transition-all duration-200 ${
                        plan.isFeatured ? 'bg-primary text-primary-foreground' : 'bg-surface text-foreground'
                      }`}
                      href={plan.isFree ? '/signup' : `/signup?plan=${plan.id}`}
                    >
                      {plan.isFree ? 'Sign up' : plan.isFeatured ? `Get ${plan.name}` : 'Upgrade'}
                    </a>
                  </div>
                ))}
              </div>

              {/* Categories */}
              {comparison.map((cat) => (
                <div key={cat.title}>
                  <div className="pb-4 pt-12 border-b border-border">
                    <h4 className="text-2xl font-semibold flex items-center gap-2 mb-1">{cat.title}</h4>
                  </div>
                  {cat.rows.map((row) => (
                    <div key={row.label} className="flex gap-3 py-2 md:items-center border-b border-border/50 text-base hover:bg-accent bg-transparent flex-wrap md:flex-nowrap">
                      <div className="w-full md:flex-1 md:w-auto md:text-foreground/70 font-semibold md:font-normal flex items-center gap-1.5">{row.label}</div>
                      {row.values.map((val, i) => (
                        <div key={i} className="flex-1 leading-tight"><CellValue value={val} /></div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
