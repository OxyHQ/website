import { Sparkles, CircleDollarSign, Megaphone } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import Button from '../components/ui/Button'
import DotPattern from '../components/ui/DotPattern'
import KeepUpToDateSection from '../components/sections/KeepUpToDateSection'
import { usePage, useFundingProgress, type PageSection, type FundingProgress } from '../api/hooks'

/* ──────────────────────────────────────────────
 * /sustain
 *
 * Public "we will never ship ads" commitment page with a live
 * crowdfunding-style funding dashboard. Backed by the CMS
 * `pages/sustain` document. Every section falls back to constant
 * copy when the CMS document is missing or the relevant section
 * hasn't been populated, so the page renders identically on fresh
 * databases.
 *
 * Layout follows the canonical ManifestoPage / CompanyPage patterns:
 *   container > > grid grid-cols-12 > col-[2/-2]
 * Dashed rule helpers match ManifestoPage.
 * ──────────────────────────────────────────── */

/* ── Fallback copy ── */

const DEFAULT_HERO_BADGE = 'Funding Oxy'
const DEFAULT_HERO_TITLE = 'We will never ship ads. Here\'s how.'
const DEFAULT_HERO_SUBTITLE =
  'Most platforms sell your attention to advertisers. We sell a product worth paying for. This page shows — in real time — how subscriptions and donations keep Oxy running without compromising your privacy.'

const DEFAULT_WHY_HEADING = 'Why this page exists'
const DEFAULT_WHY_CONTENT =
  'Running a platform that respects your privacy costs real money — servers, bandwidth, engineering, security audits, legal compliance. Most companies cover those costs by selling ads, which means selling your data and your attention. We refuse.\n\nInstead, we ask the people who use Oxy to fund it directly. Subscriptions, donations, and partnerships — money that comes with no strings attached and no incentive to spy on anyone. This page is our public ledger. Every dollar is accounted for, and the goal is simple: reach full sustainability so Oxy can run indefinitely without ever needing ads.'

const DEFAULT_COMMITMENT_HEADING = 'Our commitment'
const DEFAULT_COMMITMENT_SUBHEADING =
  'Six promises that define how we fund Oxy — and what we\'ll never compromise.'

interface Commitment {
  title: string
  description: string
}

const DEFAULT_COMMITMENTS: Commitment[] = [
  { title: 'No ads, ever', description: 'We will never show ads in any Oxy product. Not "privacy-friendly" ads, not "contextual" ads, not sponsored content disguised as features. Zero.' },
  { title: 'No data sales', description: 'Your data is never sold, shared, or used for profiling. Not now, not if we\'re struggling, not if an acquirer offers. This is non-negotiable.' },
  { title: 'Full transparency', description: 'This page shows real numbers. How much we need, how much we have, where it comes from. Updated in real time, no spin.' },
  { title: 'Community-funded', description: 'Every subscriber and donor keeps Oxy independent. No VC pressure to monetize attention, no board pushing for ad revenue.' },
  { title: 'Open roadmap', description: 'Supporters shape what we build next. The people who fund Oxy get a voice in its direction — not advertisers, not investors.' },
  { title: 'Sustainable by design', description: 'We optimize for decades, not quarters. Lean operations, boring infrastructure, no growth-at-all-costs. Oxy should outlive its founders.' },
]

const DEFAULT_FUNDING_HEADING = 'The numbers'
const DEFAULT_FUNDING_SUBHEADING = 'Live funding status — updated every minute.'

const DEFAULT_HELP_HEADING = 'How you can help'
const DEFAULT_HELP_CONTENT =
  'Every subscription moves the bar. If you use Oxy and find it valuable, a paid plan is the single most impactful thing you can do. If a plan isn\'t right for you, a one-time donation helps too. And if money isn\'t an option, just using Oxy and telling others about it matters more than you think.'

const DEFAULT_CTA_HEADING = 'Keep Oxy ad-free.'
const DEFAULT_CTA_SUBHEADING =
  'Subscribe, donate, or spread the word. Every bit helps us stay independent.'

const DONATE_URL = 'https://opencollective.com/oxy'

/* ── CMS helpers (mirrors ManifestoPage) ── */

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
 * Parse a "commitment" section's items into strongly-typed Commitment objects.
 * Falls back to the provided defaults if the section is missing or its items
 * don't contain at least a title. Items on the server are stored as Mixed so
 * extra fields (`title`, `description`) arrive as `unknown` — narrow them
 * with runtime guards, never with `as any`.
 */
function parseCommitments(sections: PageSection[], fallback: Commitment[]): Commitment[] {
  const section = sections.find((s) => s.type === 'commitment')
  const rawItems = section?.items ?? []
  const parsed: Commitment[] = []
  for (const item of rawItems) {
    const title = typeof item.title === 'string' ? item.title : ''
    const description = typeof item.description === 'string' ? item.description : ''
    if (title.length > 0) parsed.push({ title, description })
  }
  return parsed.length > 0 ? parsed : fallback
}

/* ── Layout primitives (copied from ManifestoPage / CompanyPage) ── */

function DashedHLine() {
  return (
    <svg width="100%" height="1" className="text-border">
      <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
    </svg>
  )
}

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

/* ── Funding bar ── */

function FundingBar({ raised, target }: { raised: number; target: number }) {
  const pct = target > 0 ? Math.min(100, (raised / target) * 100) : 0
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
        style={{ width: `${pct}%` }}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  )
}

/* ── Currency formatter ── */

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(cents / 100)
}

/* ── Relative time formatter ── */

function relativeTime(dateString: string): string {
  const now = Date.now()
  const then = new Date(dateString).getTime()
  const diffMs = now - then
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return 'just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay}d ago`
}

/* ── Funding widget (data loaded) ── */

function FundingWidget({ data }: { data: FundingProgress }) {
  const pct = data.targetAmount > 0 ? Math.min(100, (data.raisedAmount / data.targetAmount) * 100) : 0

  const breakdownItems = [
    { label: 'Subscriptions', value: formatCurrency(data.breakdown.subscriptions) },
    { label: 'Donations', value: formatCurrency(data.breakdown.donations) },
    { label: 'Partnerships', value: formatCurrency(data.breakdown.partnerships) },
    { label: 'Services', value: formatCurrency(data.breakdown.services) },
  ]

  return (
    <div className="flex flex-col gap-8">
      {/* Headline row */}
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <p className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          {formatCurrency(data.raisedAmount)}{' '}
          <span className="text-lg font-medium text-muted-foreground md:text-xl">
            / {formatCurrency(data.targetAmount)} per month
          </span>
        </p>
        <p className="text-lg font-semibold text-primary">{Math.round(pct)}% funded</p>
      </div>

      {/* Sustainable banner */}
      {data.sustainable && (
        <div className="rounded-xl bg-primary/10 p-4 text-primary">
          Fully funded. Oxy is ad-free thanks to {data.supporters.toLocaleString()} supporters.
        </div>
      )}

      {/* Progress bar */}
      <FundingBar raised={data.raisedAmount} target={data.targetAmount} />

      {/* Breakdown stats */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border lg:grid-cols-4">
        {breakdownItems.map((item) => (
          <div key={item.label} className="bg-background p-6 text-center">
            <div className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">{item.value}</div>
            <div className="mt-1 text-sm font-medium text-muted-foreground">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <p className="text-sm text-muted-foreground">
        {data.supporters.toLocaleString()} supporters &middot; Updated {relativeTime(data.updatedAt)}
      </p>
    </div>
  )
}

/* ── Page ── */

export default function SustainPage() {
  const { data: pageData } = usePage('sustain')
  const sections = pageData?.sections ?? []

  const { data: fundingData, isPending: fundingPending, isError: fundingError } = useFundingProgress()

  const heroBadge = sectionContent(sections, 'hero', DEFAULT_HERO_BADGE)
  const heroTitle = sectionHeading(sections, 'hero', DEFAULT_HERO_TITLE)
  const heroSubtitle = sectionSubheading(sections, 'hero', DEFAULT_HERO_SUBTITLE)

  const commitmentHeading = sectionHeading(sections, 'commitment', DEFAULT_COMMITMENT_HEADING)
  const commitmentSubheading = sectionSubheading(sections, 'commitment', DEFAULT_COMMITMENT_SUBHEADING)
  const commitments = parseCommitments(sections, DEFAULT_COMMITMENTS)

  const whyHeading = sectionHeading(sections, 'why', DEFAULT_WHY_HEADING)
  const whyContent = sectionContent(sections, 'why', DEFAULT_WHY_CONTENT)
  const whyParagraphs = whyContent.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)

  const fundingHeading = sectionHeading(sections, 'funding', DEFAULT_FUNDING_HEADING)
  const fundingSubheading = sectionSubheading(sections, 'funding', DEFAULT_FUNDING_SUBHEADING)

  const helpHeading = sectionHeading(sections, 'help', DEFAULT_HELP_HEADING)
  const helpContent = sectionContent(sections, 'help', DEFAULT_HELP_CONTENT)
  const helpParagraphs = helpContent.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)

  const ctaHeading = sectionHeading(sections, 'cta', DEFAULT_CTA_HEADING)
  const ctaSubheading = sectionSubheading(sections, 'cta', DEFAULT_CTA_SUBHEADING)

  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <SEO
        title="Sustain"
        description="We will never ship ads. See how subscriptions and donations keep Oxy running without compromising your privacy — updated in real time."
        canonicalPath="/sustain"
      />
      <Navbar />
      <main>
        {/* ═══ Hero ═══ */}
        <section className="container">
          <div>
            <div className="relative overflow-hidden">
              <DotPattern id="sustain-hero-dots" className="opacity-40 dark:opacity-20" />
            <header className="relative grid grid-cols-12 pt-40 pb-20 max-xl:pt-30 max-xl:pb-16 max-lg:pt-25 max-lg:pb-15 justify-items-center">
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
                  <Button variant="primary" size="md" responsive href="/pricing">
                    Subscribe to a plan
                  </Button>
                  <Button variant="outline" size="md" responsive href={DONATE_URL} target="_blank" rel="noopener noreferrer">
                    Make a donation
                  </Button>
                </div>
              </div>
            </header>
            </div>
          </div>
        </section>

        {/* ═══ Why this page exists ═══ */}
        <section className="container">
          <div>
            <DashedHLine />
            <div className="grid grid-cols-12">
              <div className="col-[2/-2] py-20 max-lg:py-16">
                <div className="mx-auto max-w-2xl">
                  <h2 className="text-heading-responsive-sm">{whyHeading}</h2>
                  <div className="mt-6 flex flex-col gap-5 text-lg leading-relaxed text-muted-foreground">
                    {whyParagraphs.map((paragraph, idx) => (
                      <p key={idx} className="text-pretty">{paragraph}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <DashedHLine />
          </div>
        </section>

        {/* ═══ Our commitment ═══ */}
        <section className="container">
          <div>
            <DashedVLines height="h-10" />

            <header className="grid grid-cols-12 pt-20 pb-12 max-lg:pt-16 max-lg:pb-10 justify-items-start">
              <div className="col-[2/-2] max-w-[24em] text-pretty text-heading-responsive-sm text-start mix-blend-multiply dark:mix-blend-screen">
                <h2 className="text-pretty inline">{commitmentHeading}.</h2>{' '}
                <p className="inline text-pretty font-medium text-muted-foreground">
                  {commitmentSubheading}
                </p>
              </div>
            </header>

            <DashedVLines />

            {/* Pixel-gap card grid with diagonal stripe background */}
            <div className="relative grid grid-cols-12">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 text-border/30"
                style={{ backgroundImage: 'repeating-linear-gradient(125deg, transparent, transparent 6px, currentColor 6px, currentColor 7px)' }}
              />
              <div className="relative col-[2/-2] grid grid-cols-1 gap-px bg-border p-px sm:grid-cols-2 lg:grid-cols-3">
                {commitments.map((commitment, idx) => (
                  <div key={commitment.title} className="bg-background p-8 lg:p-10">
                    <span className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <h3 className="mt-4 text-lg font-medium text-foreground">{commitment.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{commitment.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <DashedVLines height="h-21 md:h-40" />
          </div>
        </section>

        {/* ═══ Funding progress ═══ */}
        <section className="container">
          <div>
            <DashedHLine />
            <DashedVLines />
            <div className="relative grid grid-cols-12">
              {/* Dot pattern background */}
              <svg width="100%" height="100%" className="mask-t-to-50% absolute inset-0 text-muted">
                <defs>
                  <pattern id="funding-dots" width="10" height="10" patternUnits="userSpaceOnUse">
                    <rect x="5.5" y="5.5" width="1" height="1" fill="currentColor" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#funding-dots)" />
              </svg>
              <div className="relative col-[2/-2] py-20 max-lg:py-16">
                <div className="mx-auto max-w-3xl">
                  <h2 className="text-heading-responsive-sm">{fundingHeading}</h2>
                  <p className="mt-2 text-muted-foreground">{fundingSubheading}</p>

                  <div className="mt-10">
                    {fundingPending && (
                      <div className="flex flex-col gap-6">
                        <div className="h-10 w-3/4 animate-pulse rounded-lg bg-muted" />
                        <div className="h-3 w-full animate-pulse rounded-full bg-muted" />
                        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
                          {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex flex-col items-center gap-2">
                              <div className="h-10 w-24 animate-pulse rounded-lg bg-muted" />
                              <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {!fundingPending && (fundingError || !fundingData) && (
                      <div className="flex flex-col items-center gap-5 text-center">
                        <p className="text-lg text-muted-foreground">
                          Live funding numbers are temporarily unavailable. Subscribe or donate to help us reach sustainability.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-3">
                          <Button variant="primary" size="md" responsive href="/pricing">
                            Subscribe
                          </Button>
                          <Button variant="outline" size="md" responsive href={DONATE_URL} target="_blank" rel="noopener noreferrer">
                            Donate
                          </Button>
                        </div>
                      </div>
                    )}

                    {!fundingPending && !fundingError && fundingData && (
                      <FundingWidget data={fundingData} />
                    )}
                  </div>
                </div>
              </div>
            </div>
            <DashedVLines />
            <DashedHLine />
          </div>
        </section>

        {/* ═══ How you can help ═══ */}
        <section className="container">
          <div>
            <div className="grid grid-cols-12">
              <div className="col-[2/-2] py-20 max-lg:py-16">
                <div className="mx-auto max-w-2xl">
                  <h2 className="text-heading-responsive-sm">{helpHeading}</h2>
                  <div className="mt-6 flex flex-col gap-5 text-lg leading-relaxed text-muted-foreground">
                    {helpParagraphs.map((paragraph, idx) => (
                      <p key={idx} className="text-pretty">{paragraph}</p>
                    ))}
                  </div>
                </div>

                <div className="mt-12 grid grid-cols-1 gap-px bg-border p-px sm:grid-cols-3">
                  <div className="flex flex-col bg-background p-8 lg:p-10">
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Sparkles className="size-6" aria-hidden="true" />
                    </span>
                    <h3 className="mt-6 text-lg font-medium text-foreground">Subscribe</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">Choose a plan that fits. Every subscriber directly funds development and infrastructure.</p>
                    <span className="mt-6 inline-flex">
                      <Button variant="outline" size="sm" href="/pricing">View plans</Button>
                    </span>
                  </div>
                  <div className="flex flex-col bg-background p-8 lg:p-10">
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <CircleDollarSign className="size-6" aria-hidden="true" />
                    </span>
                    <h3 className="mt-6 text-lg font-medium text-foreground">Donate</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">One-time or recurring. Every donation moves the bar and keeps Oxy independent.</p>
                    <span className="mt-6 inline-flex">
                      <Button variant="outline" size="sm" href={DONATE_URL} target="_blank" rel="noopener noreferrer">Donate now</Button>
                    </span>
                  </div>
                  <div className="flex flex-col bg-background p-8 lg:p-10">
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Megaphone className="size-6" aria-hidden="true" />
                    </span>
                    <h3 className="mt-6 text-lg font-medium text-foreground">Spread the word</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">Tell a friend, write about us, or just keep using Oxy. Growth without ads means growth through people.</p>
                    <span className="mt-6 inline-flex">
                      <Button variant="outline" size="sm" href="/referrals">Referral program</Button>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <DashedHLine />
          </div>
        </section>

        {/* ═══ CTA ═══ */}
        <section className="container">
          <div>
            <DashedVLines height="h-10" />
            <div className="grid grid-cols-12">
              <div className="col-[2/-2] py-20 max-lg:py-16">
                <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
                  <h2 className="text-balance text-heading-responsive-md">{ctaHeading}.</h2>
                  <p className="max-w-xl text-pretty text-muted-foreground">
                    {ctaSubheading}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
                    <Button variant="primary" size="md" responsive href="/pricing">
                      Subscribe
                    </Button>
                    <Button variant="outline" size="md" responsive href={DONATE_URL} target="_blank" rel="noopener noreferrer">
                      Donate
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
