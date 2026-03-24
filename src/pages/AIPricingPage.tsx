import { Check } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import { plans, comparisonData, sidebarLabels } from '../data/ai-pricing'

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

export default function AIPricingPage() {
  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <Navbar />
      <main>
        {/* Hero + Cards */}
        <div className="overflow-x-hidden">
          <div className="container mx-auto">
            {/* Hero */}
            <section className="mt-24 mb-8 lg:mb-0">
              <h1 className="text-5xl xl:text-6xl text-balance">
                Predictable pricing. <span className="text-gray-500">Designed to scale.</span>
              </h1>
            </section>

            {/* Pricing Cards */}
            <section className="mb-6 flex md:mt-12 md:mb-10 lg:mt-12 lg:mb-15">
              <div id="pricing-plans" className="flex flex-col gap-2 lg:flex-row w-full">
                {/* Left sidebar (desktop only) */}
                <div className="hidden lg:flex lg:w-[220px] xl:w-[260px] shrink-0 flex-col pt-[148px] xl:pt-[162px] mt-1 pr-3">
                  <div className="pb-6 text-2xl">Start building for free</div>
                  <div className="flex-1">
                    {sidebarLabels.map((label) => (
                      <div key={label} className="flex items-center justify-between flex-none mt-2 pt-2 font-sans text-xl border-t border-gray-500/30">
                        <div className="flex items-center gap-2 font-normal xl:text-xl text-lg text-pretty text-gray-500">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cards */}
                <div className="flex flex-1 gap-2">
                  {/* Starter */}
                  <div className="relative flex flex-1 flex-col rounded-2xl p-4 xl:p-8 bg-secondary text-secondary-foreground">
                    <div className="size-6 flex items-center mb-4">
                      <div className="bg-primary size-5 rounded-full" />
                    </div>
                    <h2 className="text-2xl font-normal normal-case">{plans[0].name}</h2>
                    <p className="mb-6 xl:text-xl text-lg opacity-50">{plans[0].tagline}</p>
                    <div className="pb-6 text-4xl font-normal">{plans[0].price}<span className="text-xl"> {plans[0].priceNote}</span></div>
                    <div className="flex-1">
                      {plans[0].features.map((f) => (
                        <div key={f.label} className="flex items-center justify-between flex-none mt-2 pt-2 text-xl border-t border-primary/20">
                          <div className="flex items-center gap-2 font-normal xl:text-xl text-lg text-pretty leading-tight">{f.label}</div>
                          {f.extra && <div className="xl:text-xl text-lg text-primary">{f.extra}</div>}
                        </div>
                      ))}
                    </div>
                    <a className="inline-flex flex-none items-center justify-center cursor-pointer font-medium px-4 py-2 mt-9 w-fit h-9 rounded-[2rem] hover:rounded-none transition-all duration-200 bg-primary text-primary-foreground hover:bg-primary/90 text-base xl:text-lg" href={plans[0].ctaHref}>{plans[0].cta}</a>
                  </div>

                  {/* Pro */}
                  <div className="flex flex-1">
                    <div className="relative flex flex-1 flex-col rounded-2xl p-4 xl:p-8 bg-primary text-primary-foreground">
                      <div className="size-6 flex items-center mb-4">
                        <div className="bg-primary-foreground size-5 rounded-full" />
                      </div>
                      <h2 className="text-2xl font-normal normal-case">{plans[1].name}</h2>
                      <p className="mb-6 xl:text-xl text-lg opacity-50">{plans[1].tagline}</p>
                      <div className="pb-6 text-4xl font-normal">{plans[1].price}<span className="text-xl"> {plans[1].priceNote}</span></div>
                      <div className="flex-1">
                        {plans[1].features.map((f) => (
                          <div key={f.label} className="flex items-center justify-between flex-none mt-2 pt-2 text-xl border-t border-primary-foreground/20">
                            <div className="flex items-center gap-2 font-normal xl:text-xl text-lg text-pretty">{f.label}</div>
                            {f.extra && <div className="xl:text-xl text-lg text-primary-foreground/70">{f.extra}</div>}
                          </div>
                        ))}
                      </div>
                      <a className="inline-flex flex-none items-center justify-center cursor-pointer font-medium px-4 py-2 mt-9 w-fit h-9 rounded-[2rem] bg-primary-foreground hover:rounded-none transition-all duration-200 text-primary text-base xl:text-lg" href={plans[1].ctaHref}>{plans[1].cta}</a>
                    </div>
                  </div>

                  {/* Enterprise */}
                  <div className="flex flex-1">
                    <div className="relative flex flex-1 flex-col items-start rounded-2xl p-4 xl:p-8 bg-foreground text-background">
                      <StarIcon />
                      <h2 className="text-2xl font-normal normal-case">{plans[2].name}</h2>
                      <p className="mb-6 xl:text-xl text-lg opacity-50">{plans[2].tagline}</p>
                      <div className="pb-6 text-4xl font-normal">{plans[2].price}</div>
                      <div className="flex-1 text-pretty xl:text-xl text-lg leading-tight">{plans[2].description}</div>
                      <a className="inline-flex flex-none items-center justify-center cursor-pointer font-medium px-4 py-2 mt-9 h-9 rounded-[2rem] bg-background hover:rounded-none transition-all duration-200 text-foreground text-base xl:text-lg" href={plans[2].ctaHref}>{plans[2].cta}</a>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Trusted by */}
            <div className="mb-6 font-sans text-xs tracking-wider uppercase text-gray-600">Trusted by the best AI teams</div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-clip bg-background">
          <div className="container mx-auto flex flex-col gap-12">
            <div className="w-full text-lg">
              {/* Sticky header */}
              <div className="flex sticky top-14 gap-3 bg-background border-b border-border z-10">
                <div className="flex-1 hidden md:block" />
                {/* Starter header */}
                <div className="flex-1 pt-2 pb-3 flex flex-col items-start gap-1">
                  <div className="font-semibold flex items-center gap-2">
                    <span className="size-3 flex-none rounded-full bg-primary" />
                    <span className="flex-1">Starter <span className="text-muted-foreground font-normal hidden lg:inline">for everyone</span></span>
                  </div>
                  <a className="bg-secondary text-secondary-foreground rounded-2xl px-3 py-1 text-sm md:text-base hover:rounded-none transition-all duration-200 font-normal" href="/signup">Sign up</a>
                </div>
                {/* Pro header */}
                <div className="flex-1 pt-2 pb-3 flex flex-col items-start gap-1">
                  <div className="font-semibold flex items-center justify-center gap-2">
                    <span className="size-2.5 flex-none bg-primary-foreground rounded-full" />
                    <span>Pro <span className="text-muted-foreground font-normal hidden lg:inline">for growing teams</span></span>
                  </div>
                  <a className="bg-primary text-primary-foreground rounded-2xl text-sm md:text-base px-3 py-1 font-normal flex-none hover:rounded-none transition-all duration-200" href="/signup">Get Pro</a>
                </div>
                {/* Enterprise header */}
                <div className="flex-1 pt-2 pb-3 flex flex-col items-start gap-1">
                  <div className="font-semibold flex items-center justify-center gap-2">
                    <svg width="38" height="38" viewBox="0 0 38 38" fill="none" className="size-3 flex-none">
                      <path d="M21.542 4.61914C21.542 10.9992 26.6555 16.1726 32.9609 16.1729H38V20.666H32.9609C26.6556 20.6662 21.5421 25.8397 21.542 32.2197V38H16.4668V32.2197C16.4667 25.8396 11.3534 20.666 5.04785 20.666H0V16.1729H5.04785C11.3535 16.1729 16.4668 10.9994 16.4668 4.61933V0H21.542V4.61914Z" fill="currentColor" />
                    </svg>
                    <span>Enterprise</span>
                  </div>
                  <a className="bg-foreground text-background text-nowrap hover:rounded-none rounded-2xl block px-3 gap-2 py-1 flex-none text-sm md:text-base transition-all duration-200" href="/contact">Contact sales</a>
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
