import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import Button from '../components/ui/Button'
import KeepUpToDateSection from '../components/sections/KeepUpToDateSection'
import { HorizontalLine } from '../components/ui/GridDecoration'
import { usePage, type PageSection } from '../api/hooks'

/* ──────────────────────────────────────────────
 * /company/business
 *
 * How our business works — single-page marketing surface backed by the CMS
 * `pages/company-business` document. Every block falls back to constant copy
 * so the page renders fully on fresh databases.
 *
 * Layout follows the canonical CompanyPage / ProductsPage patterns:
 *   container > border-border border-x > grid grid-cols-12 > col-[2/-2]
 * ──────────────────────────────────────────── */

/* ── Fallback copy ── */

const DEFAULT_HERO_BADGE = 'How our business works'
const DEFAULT_HERO_TITLE = 'We pay the bills without selling you.'
const DEFAULT_HERO_SUBTITLE =
  'Where our money comes from, where it goes, and what we refuse to do to earn it. The full picture — no asterisks, no fine print.'

const DEFAULT_REVENUE_HEADING = 'How we make money'
const DEFAULT_REVENUE_SUBHEADING =
  'Three honest revenue lines. No surveillance ads, no data sales, no attention brokerage.'

interface RevenueLine {
  label: string
  title: string
  description: string
}

const DEFAULT_REVENUE: RevenueLine[] = [
  {
    label: '01',
    title: 'Managed hosting',
    description:
      'Teams and businesses pay us to run Oxy products on reliable infrastructure they do not have to babysit. Self-hosting is always an option — we just make the easy path paid.',
  },
  {
    label: '02',
    title: 'Professional services',
    description:
      'Onboarding, migrations, custom integrations, and long-term support contracts for organizations running Oxy at scale. Priced transparently, not gate-kept.',
  },
  {
    label: '03',
    title: 'Partner programs',
    description:
      'Education, community, and ecosystem partners who build on top of Oxy. Fair revenue splits, no exclusivity traps, no lock-ins.',
  },
]

const DEFAULT_NO_HEADING = "What we don't do"
const DEFAULT_NO_SUBHEADING =
  'The revenue lines we refuse. These are not aspirational — they are hard rules baked into how every product is designed.'

interface NoItem {
  title: string
  description: string
}

const DEFAULT_NO_ITEMS: NoItem[] = [
  {
    title: 'No surveillance advertising',
    description:
      'We do not serve ads, we do not profile users, and we do not broker attention. Our products have never had an ad unit and never will.',
  },
  {
    title: 'No data sales',
    description:
      'We do not sell, rent, or trade user data — not to advertisers, not to brokers, not to anyone. Our terms of service legally bind us to this.',
  },
  {
    title: 'No dark patterns',
    description:
      'No manufactured urgency, no hidden opt-outs, no cancellation mazes. If a choice matters, we ask you plainly and respect your answer.',
  },
  {
    title: 'No closed re-licensing',
    description:
      'We will not take an open-source project, lock it behind a proprietary license, and force users onto a paid cloud. Open stays open.',
  },
]

const DEFAULT_SPEND_HEADING = 'Where the money goes'
const DEFAULT_SPEND_SUBHEADING =
  'A rough breakdown of how every dollar of revenue is spent. Refined every quarter, published every year.'

interface SpendRow {
  label: string
  percent: number
  description: string
}

const DEFAULT_SPEND: SpendRow[] = [
  {
    label: 'Engineering',
    percent: 65,
    description: 'Salaries for the people building and maintaining every Oxy product.',
  },
  {
    label: 'Community',
    percent: 20,
    description: 'Grants, contributor bounties, documentation, and community programs.',
  },
  {
    label: 'Infrastructure',
    percent: 10,
    description: 'Hosting, bandwidth, third-party services, and security tooling.',
  },
  {
    label: 'Legal & ops',
    percent: 5,
    description: 'Legal counsel, accounting, compliance, and business operations.',
  },
]

const DEFAULT_CTA_HEADING = 'Want the full picture?'
const DEFAULT_CTA_SUBHEADING =
  'Annual transparency reports, partner terms, and live operational data — everything is public.'

/* ── CMS helpers ── */

function sectionHeading(sections: PageSection[], type: string, fallback: string): string {
  return sections.find((s) => s.type === type)?.heading || fallback
}

function sectionSubheading(sections: PageSection[], type: string, fallback: string): string {
  return sections.find((s) => s.type === type)?.subheading || fallback
}

function sectionContent(sections: PageSection[], type: string, fallback: string): string {
  return sections.find((s) => s.type === type)?.content || fallback
}

/**
 * Parse a "revenue" section's items into RevenueLine objects. Items on the
 * server are stored as Mixed, so every field is read via runtime type guards.
 */
function parseRevenue(sections: PageSection[], fallback: RevenueLine[]): RevenueLine[] {
  const section = sections.find((s) => s.type === 'revenue')
  const rawItems = section?.items ?? []
  const parsed: RevenueLine[] = []
  rawItems.forEach((item, idx) => {
    const title = typeof item.title === 'string' ? item.title : ''
    if (title.length === 0) return
    const description = typeof item.description === 'string' ? item.description : ''
    const label = typeof item.label === 'string' && item.label.length > 0
      ? item.label
      : String(idx + 1).padStart(2, '0')
    parsed.push({ label, title, description })
  })
  return parsed.length > 0 ? parsed : fallback
}

/**
 * Parse a "no" (what-we-don't-do) section's items into NoItem objects.
 */
function parseNoItems(sections: PageSection[], fallback: NoItem[]): NoItem[] {
  const section = sections.find((s) => s.type === 'no')
  const rawItems = section?.items ?? []
  const parsed: NoItem[] = []
  for (const item of rawItems) {
    const title = typeof item.title === 'string' ? item.title : ''
    if (title.length === 0) continue
    const description = typeof item.description === 'string' ? item.description : ''
    parsed.push({ title, description })
  }
  return parsed.length > 0 ? parsed : fallback
}

/**
 * Parse a "spend" section's items into SpendRow objects. Percentages arrive
 * as either numbers or numeric strings and are coerced via Number() with a
 * finite-number check.
 */
function parseSpend(sections: PageSection[], fallback: SpendRow[]): SpendRow[] {
  const section = sections.find((s) => s.type === 'spend')
  const rawItems = section?.items ?? []
  const parsed: SpendRow[] = []
  for (const item of rawItems) {
    const label = typeof item.label === 'string' ? item.label : ''
    if (label.length === 0) continue
    const rawPercent = item.percent
    let percent = 0
    if (typeof rawPercent === 'number' && Number.isFinite(rawPercent)) {
      percent = rawPercent
    } else if (typeof rawPercent === 'string') {
      const coerced = Number(rawPercent)
      if (Number.isFinite(coerced)) percent = coerced
    }
    const description = typeof item.description === 'string' ? item.description : ''
    parsed.push({ label, percent, description })
  }
  return parsed.length > 0 ? parsed : fallback
}

/* ── Layout primitives ── */

const DashedHLine = () => <HorizontalLine className="w-full text-border" dashed />

function DashedVLines({ height = 'h-5' }: { height?: string }) {
  return (
    <div className={`grid w-full grid-cols-12 overflow-hidden ${height}`}>
      <div className="col-[2/-2] flex justify-between">
        <svg width="1" height="100%" className="text-border">
          <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
        </svg>
        <svg width="1" height="100%" className="text-border">
          <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
        </svg>
        <svg width="1" height="100%" className="text-border">
          <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  )
}

function XMarkIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={className}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  )
}

/* ── Page ── */

export default function BusinessPage() {
  const { data: pageData } = usePage('company-business')
  const sections = pageData?.sections ?? []

  const heroBadge = sectionContent(sections, 'hero', DEFAULT_HERO_BADGE)
  const heroTitle = sectionHeading(sections, 'hero', DEFAULT_HERO_TITLE)
  const heroSubtitle = sectionSubheading(sections, 'hero', DEFAULT_HERO_SUBTITLE)

  const revenueHeading = sectionHeading(sections, 'revenue', DEFAULT_REVENUE_HEADING)
  const revenueSubheading = sectionSubheading(sections, 'revenue', DEFAULT_REVENUE_SUBHEADING)
  const revenue = parseRevenue(sections, DEFAULT_REVENUE)

  const noHeading = sectionHeading(sections, 'no', DEFAULT_NO_HEADING)
  const noSubheading = sectionSubheading(sections, 'no', DEFAULT_NO_SUBHEADING)
  const noItems = parseNoItems(sections, DEFAULT_NO_ITEMS)

  const spendHeading = sectionHeading(sections, 'spend', DEFAULT_SPEND_HEADING)
  const spendSubheading = sectionSubheading(sections, 'spend', DEFAULT_SPEND_SUBHEADING)
  const spend = parseSpend(sections, DEFAULT_SPEND)
  const spendTotal = spend.reduce((sum, row) => sum + row.percent, 0)

  const ctaHeading = sectionHeading(sections, 'cta', DEFAULT_CTA_HEADING)
  const ctaSubheading = sectionSubheading(sections, 'cta', DEFAULT_CTA_SUBHEADING)

  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <SEO
        title="How our business works"
        description="Where Oxy's money comes from, where it goes, and what we refuse to do to earn it. No surveillance ads, no data sales, no dark patterns."
        canonicalPath="/company/business"
      />
      <Navbar />
      <main>
        {/* ═══ Hero ═══ */}
        <section className="container">
          <div className="lg:border-border lg:border-x">
            <header className="grid grid-cols-12 pt-40 pb-20 max-xl:pt-30 max-xl:pb-16 max-lg:pt-25 max-lg:pb-15 justify-items-center">
              <div className="col-[2/-2] flex flex-col items-center gap-4 text-center">
                <div className="mb-6 inline-block w-fit rounded-[13px] border border-border bg-background px-3 py-1.5 font-medium text-[13px]/[1.4em] text-foreground">
                  {heroBadge}
                </div>
                <h1 className="max-w-[18em] text-balance text-heading-responsive-lg">
                  {heroTitle}
                </h1>
                <p className="mt-4 max-w-2xl text-balance text-lg text-foreground lg:text-xl">
                  {heroSubtitle}
                </p>
                <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                  <Button variant="primary" size="md" responsive href="/company/transparency">
                    Transparency Center
                  </Button>
                  <Button variant="outline" size="md" responsive href="/partners">
                    Partner programs
                  </Button>
                </div>
              </div>
            </header>
          </div>
        </section>

        {/* ═══ How we make money ═══ */}
        <section className="container">
          <div className="border-border border-x">
            <DashedHLine />
            <DashedVLines />

            <header className="grid grid-cols-12 pt-20 pb-12 max-lg:pt-16 max-lg:pb-10 justify-items-start">
              <div className="col-[2/-2] max-w-[24em] text-pretty text-heading-responsive-sm text-start mix-blend-multiply dark:mix-blend-screen">
                <h2 className="text-pretty inline">{revenueHeading}.</h2>{' '}
                <p className="inline text-pretty font-medium text-muted-foreground">
                  {revenueSubheading}
                </p>
              </div>
            </header>

            <DashedVLines />

            <div className="relative grid grid-cols-12">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 text-border/30"
                style={{ backgroundImage: 'repeating-linear-gradient(125deg, transparent, transparent 6px, currentColor 6px, currentColor 7px)' }}
              />
              <div className="relative col-[2/-2] grid grid-cols-1 gap-px bg-border p-px md:grid-cols-3">
                {revenue.map((line) => (
                  <div key={line.title} className="bg-background p-8 lg:p-10">
                    <span className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      {line.label}
                    </span>
                    <h3 className="mt-4 text-lg font-medium text-foreground">{line.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{line.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <DashedVLines height="h-21 md:h-40" />
          </div>
        </section>

        {/* ═══ What we don't do ═══ */}
        <section className="container">
          <div className="border-border border-x">
            <DashedHLine />

            <header className="grid grid-cols-12 pt-20 pb-12 max-lg:pt-16 max-lg:pb-10 justify-items-start">
              <div className="col-[2/-2] max-w-[24em] text-pretty text-heading-responsive-sm text-start mix-blend-multiply dark:mix-blend-screen">
                <h2 className="text-pretty inline">{noHeading}.</h2>{' '}
                <p className="inline text-pretty font-medium text-muted-foreground">
                  {noSubheading}
                </p>
              </div>
            </header>

            <div className="grid grid-cols-12 pb-20 max-lg:pb-16">
              <div className="col-[2/-2]">
                <ul className="mx-auto flex max-w-3xl flex-col gap-4">
                  {noItems.map((item) => (
                    <li
                      key={item.title}
                      className="flex items-start gap-4 rounded-2xl border border-border bg-surface/40 p-5"
                    >
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-background">
                        <XMarkIcon className="size-4 text-muted-foreground" />
                      </span>
                      <div>
                        <h3 className="font-medium text-foreground">{item.title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ Where the money goes ═══ */}
        <section className="container">
          <div className="border-border border-x">
            <DashedHLine />

            <header className="grid grid-cols-12 pt-20 pb-12 max-lg:pt-16 max-lg:pb-10 justify-items-start">
              <div className="col-[2/-2] max-w-[24em] text-pretty text-heading-responsive-sm text-start mix-blend-multiply dark:mix-blend-screen">
                <h2 className="text-pretty inline">{spendHeading}.</h2>{' '}
                <p className="inline text-pretty font-medium text-muted-foreground">
                  {spendSubheading}
                </p>
              </div>
            </header>

            <div className="grid grid-cols-12 pb-20 max-lg:pb-16">
              <div className="col-[2/-2]">
                <div className="mx-auto flex max-w-3xl flex-col gap-5">
                  {spend.map((row) => {
                    const width = spendTotal > 0 ? Math.min(100, (row.percent / spendTotal) * 100) : 0
                    return (
                      <div key={row.label} className="flex flex-col gap-2">
                        <div className="flex items-baseline justify-between gap-4">
                          <span className="text-base font-medium text-foreground">{row.label}</span>
                          <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
                            {row.percent}%
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
                          <div
                            className="h-full rounded-full bg-foreground/80"
                            style={{ width: `${width}%` }}
                            aria-hidden="true"
                          />
                        </div>
                        {row.description.length > 0 && (
                          <p className="text-sm text-muted-foreground">{row.description}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ Read more CTA ═══ */}
        <section className="container">
          <div className="border-border border-x">
            <DashedHLine />
            <div className="grid grid-cols-12">
              <div className="col-[2/-2] py-20 max-lg:py-16">
                <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
                  <h2 className="text-balance text-heading-responsive-md">{ctaHeading}</h2>
                  <p className="max-w-xl text-pretty text-muted-foreground">{ctaSubheading}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
                    <Button variant="primary" size="md" responsive href="/company/transparency">
                      Transparency Center
                    </Button>
                    <Button variant="outline" size="md" responsive href="/partners">
                      Partner with us
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ Keep up to date ═══ */}
        <KeepUpToDateSection />
      </main>
      <Footer />
    </div>
  )
}
