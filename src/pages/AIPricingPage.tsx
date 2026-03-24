import { Check } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import { plans, comparisonData, sidebarLabels } from '../data/ai-pricing'

function StarIcon() {
  return (
    <svg width="38" height="38" viewBox="0 0 38 38" fill="none" className="size-6 text-[#60a5fa] mb-4">
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

export default function AIPricingPage() {
  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <Navbar />
      <main>
        {/* Hero + Cards */}
        <div className="overflow-x-hidden px-4 sm:px-8">
          <div className="mx-auto max-w-5xl">
            {/* Hero */}
            <section className="mt-24 mb-8 lg:mb-0">
              <h1 className="text-5xl xl:text-6xl text-balance">
                Predictable pricing. <span className="text-muted-foreground">Designed to scale.</span>
              </h1>
            </section>

            {/* Pricing Cards */}
            <section className="mb-6 flex md:mt-12 md:mb-10 lg:mt-12 lg:mb-15">
              <div className="flex flex-col gap-2 lg:flex-row w-full">
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
                  {plans.map((plan) => (
                    <div key={plan.name} className="flex flex-1">
                      <div className={`relative flex flex-1 flex-col ${plan.dotShape === 'star' ? 'items-start' : ''} rounded-2xl p-4 xl:p-8 ${plan.bgColor} text-white`}>
                        {/* Icon */}
                        {plan.dotShape === 'circle' && (
                          <div className="size-6 flex items-center mb-4">
                            <div className={`${plan.dotColor} size-5 rounded-full`} />
                          </div>
                        )}
                        {plan.dotShape === 'square' && (
                          <div className="size-6 flex items-center mb-4">
                            <div className={`${plan.dotColor} size-5`} />
                          </div>
                        )}
                        {plan.dotShape === 'star' && <StarIcon />}

                        <h2 className="text-2xl font-normal normal-case">{plan.name}</h2>
                        <p className="mb-6 xl:text-xl text-lg opacity-50">{plan.tagline}</p>

                        {/* Price */}
                        <div className="pb-6 text-4xl font-normal">
                          {plan.price}
                          {plan.priceNote && <span className="text-xl"> {plan.priceNote}</span>}
                        </div>

                        {/* Features or description */}
                        {plan.description ? (
                          <div className="flex-1 text-pretty xl:text-xl text-lg leading-tight">
                            {plan.description}
                          </div>
                        ) : (
                          <div className="flex-1">
                            {plan.features.map((f) => (
                              <div key={f.label} className={`flex items-center justify-between flex-none mt-2 pt-2 text-xl border-t ${plan.borderColor}`}>
                                <div className="flex items-center gap-2 font-normal xl:text-xl text-lg text-pretty leading-tight">{f.label}</div>
                                {f.extra && <div className={`xl:text-xl text-lg ${plan.accentColor}`}>{f.extra}</div>}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* CTA */}
                        <a
                          href={plan.ctaHref}
                          className="inline-flex flex-none items-center justify-center cursor-pointer font-medium px-4 py-2 mt-9 w-fit h-9 rounded-[2rem] bg-white hover:rounded-none transition-all duration-200 text-base xl:text-lg text-black"
                        >
                          {plan.cta}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-clip bg-background px-4 sm:px-8">
          <div className="mx-auto flex max-w-5xl flex-col gap-12">
            <div className="w-full text-lg">
              {/* Sticky header */}
              <div className="flex sticky top-14 gap-3 bg-background border-b border-border z-10">
                <div className="flex-1 hidden md:block" />
                {/* Starter */}
                <div className="flex-1 pt-2 pb-3 flex flex-col items-start gap-1">
                  <div className="font-semibold flex items-center gap-2">
                    <span className="size-3 flex-none rounded-full bg-[#22c55e]" />
                    <span className="flex-1">Starter <span className="text-muted-foreground font-normal hidden lg:inline">for everyone</span></span>
                  </div>
                  <a className="bg-[#1a4a3a] rounded-[2rem] px-3 py-1 text-sm md:text-base text-white hover:rounded-none transition-all duration-200 font-normal" href="/signup">Sign up</a>
                </div>
                {/* Pro */}
                <div className="flex-1 pt-2 pb-3 flex flex-col items-start gap-1">
                  <div className="font-semibold flex items-center justify-center gap-2">
                    <span className="size-2.5 flex-none bg-[#ec4899]" />
                    <span>Pro <span className="text-muted-foreground font-normal hidden lg:inline">for growing teams</span></span>
                  </div>
                  <a className="bg-[#9f1239] rounded-[2rem] text-sm md:text-base px-3 py-1 font-normal flex-none text-white hover:rounded-none transition-all duration-200" href="/signup">Get Pro</a>
                </div>
                {/* Enterprise */}
                <div className="flex-1 pt-2 pb-3 flex flex-col items-start gap-1">
                  <div className="font-semibold flex items-center justify-center gap-2">
                    <svg width="38" height="38" viewBox="0 0 38 38" fill="none" className="size-3 flex-none">
                      <path d="M21.542 4.61914C21.542 10.9992 26.6555 16.1726 32.9609 16.1729H38V20.666H32.9609C26.6556 20.6662 21.5421 25.8397 21.542 32.2197V38H16.4668V32.2197C16.4667 25.8396 11.3534 20.666 5.04785 20.666H0V16.1729H5.04785C11.3535 16.1729 16.4668 10.9994 16.4668 4.61933V0H21.542V4.61914Z" fill="currentColor" />
                    </svg>
                    <span>Enterprise</span>
                  </div>
                  <a className="bg-[#2563eb] text-nowrap hover:rounded-none text-white rounded-[2rem] block px-3 gap-2 py-1 flex-none text-sm md:text-base transition-all duration-200" href="/contact">Contact sales</a>
                </div>
              </div>

              {/* Categories */}
              {comparisonData.map((cat) => (
                <div key={cat.title}>
                  <div className="pb-4 pt-12 border-b border-border">
                    <h4 className="text-2xl font-semibold flex items-center gap-2 mb-1">{cat.title}</h4>
                    <p className="text-base text-muted-foreground leading-tight text-pretty">{cat.description}</p>
                  </div>
                  {cat.rows.map((row) => (
                    <div key={row.label} className="flex gap-3 py-2 md:items-center border-b border-border/50 text-base hover:bg-accent bg-transparent flex-wrap md:flex-nowrap">
                      <div className="w-full md:flex-1 md:w-auto md:text-foreground/70 font-semibold md:font-normal flex items-center gap-1.5">{row.label}</div>
                      <div className="flex-1 leading-tight"><CellValue value={row.starter} /></div>
                      <div className="flex-1 leading-tight"><CellValue value={row.pro} /></div>
                      <div className="flex-1 leading-tight"><CellValue value={row.enterprise} /></div>
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
