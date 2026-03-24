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

interface CardPlan {
  name: string; tagline: string; price: string; priceNote?: string
  features: Array<{ label: string; extra?: string }>
  description?: string; cta: string; ctaHref: string
}

function formatPrice(cents: number) {
  if (cents === 0) return '$0'
  const d = cents / 100
  return `$${d % 1 === 0 ? d : d.toFixed(2)}`
}

function StarIcon() {
  return (
    <svg width="38" height="38" viewBox="0 0 38 38" fill="none" className="size-6 text-background/60 mb-4">
      <path d="M21.542 4.61914C21.542 10.9992 26.6555 16.1726 32.9609 16.1729H38V20.666H32.9609C26.6556 20.6662 21.5421 25.8397 21.542 32.2197V38H16.4668V32.2197C16.4667 25.8396 11.3534 20.666 5.04785 20.666H0V16.1729H5.04785C11.3535 16.1729 16.4668 10.9994 16.4668 4.61933V0H21.542V4.61914Z" fill="currentColor" />
    </svg>
  )
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

function buildCards(plans: APIPlan[], billing: 'monthly' | 'annual'): [CardPlan, CardPlan, CardPlan] {
  const free = plans.find((p) => p.isFree) || plans[0]
  const pro = plans.find((p) => p.isFeatured) || plans[2]
  const top = plans[plans.length - 1]

  const price = (p: APIPlan) => billing === 'monthly' ? p.monthlyPrice : Math.round(p.annualPrice / 12)

  const creditsFeature = (p: APIPlan) => {
    const c = p.features.find((f) => f.category === 'Credits')
    return c?.items[0]?.label || p.creditsLabel
  }
  const modelsCount = (p: APIPlan) => {
    const m = p.features.find((f) => f.category === 'Models')
    return m ? `${m.items.length} AI models` : ''
  }
  const limitsFeature = (p: APIPlan) => {
    const l = p.features.find((f) => f.category === 'Limits')
    return l?.items[0]?.label || ''
  }
  const channelsCount = (p: APIPlan) => {
    const ch = p.features.find((f) => f.category === 'Channels')
    return ch ? `${ch.items.length} channels` : ''
  }

  return [
    {
      name: free.name,
      tagline: 'For everyone',
      price: formatPrice(price(free)),
      priceNote: free.isFree ? undefined : '/ month',
      features: [
        { label: creditsFeature(free) },
        { label: modelsCount(free) },
        { label: channelsCount(free) },
        { label: limitsFeature(free) },
      ].filter((f) => f.label),
      cta: 'Get started',
      ctaHref: '/signup',
    },
    {
      name: pro.name,
      tagline: 'Most popular',
      price: formatPrice(price(pro)),
      priceNote: '/ month',
      features: [
        { label: creditsFeature(pro) },
        { label: modelsCount(pro) },
        { label: channelsCount(pro) },
        { label: limitsFeature(pro) },
      ].filter((f) => f.label),
      cta: 'Get Pro',
      ctaHref: '/signup?plan=pro',
    },
    {
      name: top.name,
      tagline: 'For power users',
      price: formatPrice(price(top)),
      priceNote: '/ month',
      description: `${creditsFeature(top)}. ${modelsCount(top)}, ${channelsCount(top)}, and ${limitsFeature(top)}.`,
      features: [],
      cta: 'Get ' + top.name,
      ctaHref: `/signup?plan=${top.id}`,
    },
  ]
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

    const rows = [...allItems.values()].map((item) => ({
      label: item.label,
      values: plans.map((plan) => {
        const has = plan.features.find((f) => f.category === cat.category)?.items.some((i) => i.label === item.label)
        return has ? '✓' : '—'
      }),
    }))

    return { title: cat.category, rows }
  })
}

export default function AIPricingPage() {
  const [apiPlans, setApiPlans] = useState<APIPlan[]>([])
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')

  useEffect(() => {
    fetch('https://api.alia.onl/billing/plans?product=alia')
      .then((r) => r.json())
      .then((data) => setApiPlans(data.plans?.sort((a: APIPlan, b: APIPlan) => a.sortOrder - b.sortOrder) || []))
      .catch(() => {})
  }, [])

  const cards = apiPlans.length >= 3 ? buildCards(apiPlans, billing) : null
  const comparison = apiPlans.length > 0 ? buildComparison(apiPlans) : []
  const sidebarLabels = ['Credits', 'Models', 'Channels', 'Limits']

  if (!cards) return (
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

                {/* Cards */}
                <div className="flex flex-1 gap-2">
                  {/* Card 1 — Starter */}
                  <div className="relative flex flex-1 flex-col rounded-2xl p-4 xl:p-8 bg-secondary text-secondary-foreground">
                    <div className="size-6 flex items-center mb-4">
                      <div className="bg-primary size-5 rounded-full" />
                    </div>
                    <h2 className="text-2xl font-normal normal-case">{cards[0].name}</h2>
                    <p className="mb-6 xl:text-xl text-lg opacity-50">{cards[0].tagline}</p>
                    <div className="pb-6 text-4xl font-normal">{cards[0].price}{cards[0].priceNote && <span className="text-xl"> {cards[0].priceNote}</span>}</div>
                    <div className="flex-1">
                      {cards[0].features.map((f) => (
                        <div key={f.label} className="flex items-center justify-between flex-none mt-2 pt-2 text-xl border-t border-primary/20">
                          <div className="flex items-center gap-2 font-normal xl:text-xl text-lg text-pretty leading-tight">{f.label}</div>
                          {f.extra && <div className="xl:text-xl text-lg text-primary">{f.extra}</div>}
                        </div>
                      ))}
                    </div>
                    <a className="inline-flex flex-none items-center justify-center cursor-pointer font-medium px-4 py-2 mt-9 w-fit h-9 rounded-[2rem] hover:rounded-none transition-all duration-200 bg-primary text-primary-foreground hover:bg-primary/90 text-base xl:text-lg" href={cards[0].ctaHref}>{cards[0].cta}</a>
                  </div>

                  {/* Card 2 — Pro */}
                  <div className="flex flex-1">
                    <div className="relative flex flex-1 flex-col rounded-2xl p-4 xl:p-8 bg-primary text-primary-foreground">
                      <div className="size-6 flex items-center mb-4">
                        <div className="bg-primary-foreground size-5 rounded-full" />
                      </div>
                      <h2 className="text-2xl font-normal normal-case">{cards[1].name}</h2>
                      <p className="mb-6 xl:text-xl text-lg opacity-50">{cards[1].tagline}</p>
                      <div className="pb-6 text-4xl font-normal">{cards[1].price}<span className="text-xl"> {cards[1].priceNote}</span></div>
                      <div className="flex-1">
                        {cards[1].features.map((f) => (
                          <div key={f.label} className="flex items-center justify-between flex-none mt-2 pt-2 text-xl border-t border-primary-foreground/20">
                            <div className="flex items-center gap-2 font-normal xl:text-xl text-lg text-pretty">{f.label}</div>
                            {f.extra && <div className="xl:text-xl text-lg text-primary-foreground/70">{f.extra}</div>}
                          </div>
                        ))}
                      </div>
                      <a className="inline-flex flex-none items-center justify-center cursor-pointer font-medium px-4 py-2 mt-9 w-fit h-9 rounded-[2rem] bg-primary-foreground hover:rounded-none transition-all duration-200 text-primary text-base xl:text-lg" href={cards[1].ctaHref}>{cards[1].cta}</a>
                    </div>
                  </div>

                  {/* Card 3 — Top tier */}
                  <div className="flex flex-1">
                    <div className="relative flex flex-1 flex-col items-start rounded-2xl p-4 xl:p-8 bg-foreground text-background">
                      <StarIcon />
                      <h2 className="text-2xl font-normal normal-case">{cards[2].name}</h2>
                      <p className="mb-6 xl:text-xl text-lg opacity-50">{cards[2].tagline}</p>
                      <div className="pb-6 text-4xl font-normal">{cards[2].price}<span className="text-xl"> {cards[2].priceNote}</span></div>
                      <div className="flex-1 text-pretty xl:text-xl text-lg leading-tight">{cards[2].description}</div>
                      <a className="inline-flex flex-none items-center justify-center cursor-pointer font-medium px-4 py-2 mt-9 h-9 rounded-[2rem] bg-background hover:rounded-none transition-all duration-200 text-foreground text-base xl:text-lg" href={cards[2].ctaHref}>{cards[2].cta}</a>
                    </div>
                  </div>
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
                {apiPlans.map((plan) => (
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
                      {plan.isFree ? 'Sign up' : plan.isFeatured ? 'Get Pro' : 'Upgrade'}
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
