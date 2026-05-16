import { useCallback, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DollarSign, HeartHandshake, Share2 } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import Button from '../components/ui/Button'
import KeepUpToDateSection from '../components/sections/KeepUpToDateSection'
import { HorizontalLine } from '../components/ui/GridDecoration'
import { API_BASE } from '../api/client'
import { useReferral, usePage, type PageSection } from '../api/hooks'

/* ──────────────────────────────────────────────────────────────────────────
 * /referrals — public referral landing
 *
 * Three-program pitch: paid affiliates, ambassadors, casual share.
 * Reads `?ref=<code>` from the URL. If the code resolves (active referral),
 * shows a "Welcome via {name}" badge above the hero and fires a one-shot
 * POST /api/referrals/:code/click via a callback ref attached to a hidden
 * sentinel — exactly one ping per page load, no useEffect.
 *
 * Layout shell matches every other marketing page:
 *   container > border-border border-x > grid grid-cols-12 > col-[2/-2]
 * ────────────────────────────────────────────────────────────────────── */

// ── Fallback copy (used when the CMS `pages/referrals` doc is empty) ──

const DEFAULT_HERO_BADGE = 'Earn with Oxy. Or just share what you love.'
const DEFAULT_HERO_TITLE = 'Refer people to Oxy. Get paid, get perks, or just pass it on.'
const DEFAULT_HERO_SUBTITLE = 'Three ways to share the Oxy ecosystem with the people around you — pick the one that fits. Every link is tracked, every referrer is credited, nothing is hidden.'

const DEFAULT_PROGRAMS_HEADING = 'Three ways to refer'
const DEFAULT_PROGRAMS_SUBHEADING = 'Every program runs on the same infrastructure — attribution windows, dashboards, and transparent reporting. The only thing that changes is how you get rewarded.'

interface ProgramCard {
  key: 'paid' | 'ambassador' | 'user'
  icon: ReactNode
  title: string
  description: string
  cta: string
  ctaHref: string
}

const DEFAULT_PROGRAMS: ProgramCard[] = [
  {
    key: 'paid',
    icon: <DollarSign className="size-6" aria-hidden="true" />,
    title: 'Paid affiliates',
    description: 'Commission-based partners who earn a percentage of every signup and renewal they bring in. Built for creators, agencies, and professional reviewers.',
    cta: 'Apply for the program',
    ctaHref: '/partners',
  },
  {
    key: 'ambassador',
    icon: <HeartHandshake className="size-6" aria-hidden="true" />,
    title: 'Ambassadors',
    description: 'Unpaid-but-tracked advocates who get perks, early access, and community recognition. For the people who would recommend Oxy anyway.',
    cta: 'Become an ambassador',
    ctaHref: '/partners',
  },
  {
    key: 'user',
    icon: <Share2 className="size-6" aria-hidden="true" />,
    title: 'Just share',
    description: 'Grab a personal share link in seconds. No application, no paperwork — just a way to send Oxy to a friend and get credit for the assist.',
    cta: 'Get a share link',
    ctaHref: '/referrals/dashboard',
  },
]

const DEFAULT_STEPS_HEADING = 'How it works'
const DEFAULT_STEPS_SUBHEADING = 'Same three steps for every program. The difference is what happens after someone signs up.'

const DEFAULT_STEPS: Array<{ title: string; description: string }> = [
  {
    title: 'Pick a program',
    description: 'Apply as a paid affiliate, request an ambassador spot, or grab a personal share link from your dashboard.',
  },
  {
    title: 'Share your link',
    description: 'We give you a short URL with your code baked in. Share it anywhere — socials, newsletter, a DM to your brother.',
  },
  {
    title: 'Track what happens',
    description: 'Every visit, every signup, and (for paid affiliates) every payout shows up in your dashboard in real time.',
  },
]

const DEFAULT_FAQ_HEADING = 'Common questions'

const DEFAULT_FAQ: Array<{ question: string; answer: string }> = [
  {
    question: 'What commission do paid affiliates earn?',
    answer: 'Commission rates are set per partner and range from 15% to 30% of first-year plan value, with bonuses on multi-year renewals. Final terms are agreed before your first link goes live.',
  },
  {
    question: 'When do payouts happen?',
    answer: 'Paid affiliates are paid monthly, on the 15th, for signups that cleared the 30-day refund window. Payouts run via Stripe, bank transfer, or the Oxy wallet — your choice.',
  },
  {
    question: 'How long is the attribution window?',
    answer: 'Every referral link uses a 30-day cookie plus a server-side code binding. If someone signs up within 30 days of clicking your link — even on a different device where they were already logged in — you still get credit.',
  },
  {
    question: 'Can I share without applying to a program?',
    answer: 'Yes. Anyone with an Oxy account can generate a personal share link from their dashboard. You will not get a commission, but you will get recognition in the community and early access to new features.',
  },
]

// ── CMS helpers ─────────────────────────────────────────────────────────────

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
 * Merge the default program cards with any CMS overrides. The CMS `programs`
 * section supports items[] with prefixed keys like `paid.title`, `paid.desc`,
 * `paid.cta`, `paid.href` — missing keys fall through to the hard-coded copy
 * so an empty CMS entry still produces a complete page.
 */
function resolvePrograms(sections: PageSection[]): ProgramCard[] {
  const items = sections.find((s) => s.type === 'programs')?.items ?? []
  if (items.length === 0) return DEFAULT_PROGRAMS
  const overrides = new Map(items.map((i) => [i.key, i.value]))
  const pick = (key: string, fallback: string): string => overrides.get(key) ?? fallback
  return DEFAULT_PROGRAMS.map((card) => ({
    ...card,
    title: pick(`${card.key}.title`, card.title),
    description: pick(`${card.key}.desc`, card.description),
    cta: pick(`${card.key}.cta`, card.cta),
    ctaHref: pick(`${card.key}.href`, card.ctaHref),
  }))
}

// ── Layout primitives — match CompanyPage / ProductsPage helpers ────────────

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

// ── FAQ item — same pattern as CompanyPage::FAQItem ────────────────────────

function FAQItem({ question, answer, isOpen, onToggle }: { question: string; answer: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-border">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between py-5 text-left"
      >
        <span className="font-medium text-foreground">{question}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className={`size-5 shrink-0 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {isOpen && <p className="pb-5 leading-relaxed text-muted-foreground">{answer}</p>}
    </div>
  )
}

// ── Click-tracking sentinel ────────────────────────────────────────────────
//
// Fire-and-forget ping to POST /api/referrals/:code/click. A React 19 callback
// ref runs exactly once when the sentinel mounts — no useEffect, no retries,
// and the response is ignored so unknown/inactive codes are silently dropped.
function ClickTracker({ code }: { code: string }) {
  const track = useCallback((node: HTMLSpanElement | null) => {
    if (!node || !code) return
    const url = `${API_BASE}/referrals/${encodeURIComponent(code)}/click`
    void fetch(url, { method: 'POST' }).catch(() => {
      // Network hiccup on a vanity ping isn't worth surfacing to the user.
    })
  }, [code])
  return <span ref={track} aria-hidden="true" className="hidden" />
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function ReferralsPage() {
  const [searchParams] = useSearchParams()
  const refCode = searchParams.get('ref') ?? ''
  const { data: referral } = useReferral(refCode)
  const { data: pageData } = usePage('referrals')
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)

  const sections = pageData?.sections ?? []
  const heroBadge = sectionContent(sections, 'hero', DEFAULT_HERO_BADGE)
  const heroTitle = sectionHeading(sections, 'hero', DEFAULT_HERO_TITLE)
  const heroSubtitle = sectionSubheading(sections, 'hero', DEFAULT_HERO_SUBTITLE)
  const programsHeading = sectionHeading(sections, 'programs', DEFAULT_PROGRAMS_HEADING)
  const programsSubheading = sectionSubheading(sections, 'programs', DEFAULT_PROGRAMS_SUBHEADING)
  const programs = resolvePrograms(sections)
  const stepsHeading = sectionHeading(sections, 'steps', DEFAULT_STEPS_HEADING)
  const stepsSubheading = sectionSubheading(sections, 'steps', DEFAULT_STEPS_SUBHEADING)
  const faqHeading = sectionHeading(sections, 'faq', DEFAULT_FAQ_HEADING)

  // Only treat the code as valid when the server confirms it resolves AND is
  // active — unknown/paused codes simply render as a clean landing.
  const hasValidCode = Boolean(referral && referral.status === 'active')

  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <SEO
        title="Referrals"
        description="Earn with Oxy through paid affiliate commissions, join the ambassador program, or just share what you love. Three ways to refer people to the Oxy ecosystem."
        canonicalPath="/referrals"
      />
      <Navbar />
      <main>
        {hasValidCode && referral && <ClickTracker code={referral.code} />}

        {/* ═══ Hero ═══ */}
        <section className="container">
          <div className="lg:border-border lg:border-x">
            <header className="grid grid-cols-12 pt-40 pb-20 max-xl:pt-30 max-xl:pb-16 max-lg:pt-25 max-lg:pb-15 justify-items-center">
              <div className="col-[2/-2] flex flex-col items-center gap-4 text-center">
                {hasValidCode && referral && (
                  <div className="mb-2 inline-flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-[13px]/[1.4em] font-medium text-primary">
                    <span className="relative flex size-2">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex size-2 rounded-full bg-primary" />
                    </span>
                    Welcome via {referral.name}
                  </div>
                )}
                <div className="mb-6 inline-block w-fit rounded-[13px] border border-border bg-background px-3 py-1.5 text-[13px]/[1.4em] font-medium text-foreground">
                  {heroBadge}
                </div>
                <h1 className="max-w-[18em] text-balance text-heading-responsive-lg">
                  {heroTitle}
                </h1>
                <p className="mt-4 max-w-2xl text-balance text-lg text-muted-foreground lg:text-xl">
                  {heroSubtitle}
                </p>
                <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                  <Button variant="primary" size="md" responsive href="#programs">
                    See the programs
                  </Button>
                  <Button variant="outline" size="md" responsive href="/partners">
                    Partner program
                  </Button>
                </div>
              </div>
            </header>
          </div>
        </section>

        {/* ═══ Programs ═══ */}
        <section className="container scroll-mt-24" id="programs">
          <div className="border-border border-x">
            <DashedHLine />
            <DashedVLines />

            <header className="grid grid-cols-12 justify-items-start pt-20 pb-12 max-lg:pt-16 max-lg:pb-10">
              <div className="col-[2/-2] max-w-[24em] text-pretty text-heading-responsive-sm text-start mix-blend-multiply dark:mix-blend-screen">
                <h2 className="inline text-pretty">{programsHeading}.</h2>{' '}
                <p className="inline text-pretty font-medium text-muted-foreground">
                  {programsSubheading}
                </p>
              </div>
            </header>

            <DashedVLines />

            {/* Pixel-gap card grid */}
            <div className="relative grid grid-cols-12">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 text-border/30"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(125deg, transparent, transparent 6px, currentColor 6px, currentColor 7px)',
                }}
              />
              <div className="relative col-[2/-2] grid grid-cols-1 gap-px bg-border p-px sm:grid-cols-3">
                {programs.map((program) => (
                  <div key={program.key} className="flex flex-col bg-background p-8 lg:p-10">
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      {program.icon}
                    </span>
                    <h3 className="mt-6 text-2xl font-medium text-foreground">{program.title}</h3>
                    <p className="mt-3 flex-1 text-pretty text-sm leading-relaxed text-muted-foreground">
                      {program.description}
                    </p>
                    <span className="mt-8 inline-flex">
                      <Button variant="outline" size="sm" href={program.ctaHref}>
                        {program.cta}
                      </Button>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <DashedVLines height="h-21 md:h-40" />
          </div>
        </section>

        {/* ═══ How it works ═══ */}
        <section className="container">
          <div className="border-border border-x">
            <header className="grid grid-cols-12 justify-items-start pt-20 pb-12 max-lg:pt-16 max-lg:pb-10">
              <div className="col-[2/-2] max-w-[24em] text-pretty text-heading-responsive-sm text-start mix-blend-multiply dark:mix-blend-screen">
                <h2 className="inline text-pretty">{stepsHeading}.</h2>{' '}
                <p className="inline text-pretty font-medium text-muted-foreground">
                  {stepsSubheading}
                </p>
              </div>
            </header>

            <DashedVLines />

            <div className="relative grid grid-cols-12">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 text-border/30"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(125deg, transparent, transparent 6px, currentColor 6px, currentColor 7px)',
                }}
              />
              <div className="relative col-[2/-2] grid grid-cols-1 gap-px bg-border p-px sm:grid-cols-3">
                {DEFAULT_STEPS.map((step, index) => (
                  <div key={step.title} className="flex flex-col bg-background p-8 lg:p-10">
                    <span
                      aria-hidden="true"
                      className="flex size-10 items-center justify-center rounded-full border border-border text-lg font-semibold text-foreground"
                    >
                      {index + 1}
                    </span>
                    <h3 className="mt-6 text-lg font-medium text-foreground">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <DashedVLines height="h-21 md:h-40" />
          </div>
        </section>

        {/* ═══ FAQ ═══ */}
        <section className="container">
          <div className="border-border border-x">
            <DashedVLines />
            <DashedHLine />
            <div className="grid grid-cols-12">
              <div className="col-[2/-2] py-20 max-lg:py-16">
                <h2 className="mb-10 text-heading-responsive-sm">{faqHeading}</h2>
                <div className="mx-auto max-w-3xl">
                  {DEFAULT_FAQ.map((item, i) => (
                    <FAQItem
                      key={item.question}
                      question={item.question}
                      answer={item.answer}
                      isOpen={openFaqIndex === i}
                      onToggle={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ Become a partner CTA ═══ */}
        <section className="container">
          <div className="relative isolate border-x border-border">
            <svg width="100%" height="100%" aria-hidden="true" className="mask-t-to-50% absolute inset-0 text-muted">
              <defs>
                <pattern id="referrals-cta-dots" width="10" height="10" patternUnits="userSpaceOnUse">
                  <rect x="5.5" y="5.5" width="1" height="1" fill="currentColor" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#referrals-cta-dots)" />
            </svg>

            <div className="relative z-10 grid grid-cols-12">
              <div className="col-[2/-2] flex flex-col items-center pt-25 pb-25 text-center max-xl:pt-20 max-xl:pb-20 max-lg:pt-16 max-lg:pb-16">
                <p className="mb-6 inline-block w-fit rounded-[13px] border border-border bg-background px-3 py-1.5 text-[13px]/[1.4em] font-medium text-foreground">
                  Become a partner
                </p>
                <h2 className="max-w-[18em] text-balance text-heading-responsive-md">
                  Want a custom deal? Let&rsquo;s talk.
                </h2>
                <p className="mt-4 max-w-xl text-balance text-lg text-muted-foreground lg:text-xl">
                  Bigger audience, a specific niche, or an idea we haven&rsquo;t thought of yet? Reach out and we&rsquo;ll set up the program that fits.
                </p>
                <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                  <Button variant="primary" size="md" responsive href="/partners">
                    Visit the partners page
                  </Button>
                  <Button variant="outline" size="md" responsive href="/referrals/dashboard">
                    Get a share link
                  </Button>
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
