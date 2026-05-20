import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import Button from '../components/ui/Button'
import KeepUpToDateSection from '../components/sections/KeepUpToDateSection'
import { usePage, type PageSection } from '../api/hooks'

/* ──────────────────────────────────────────────
 * /company/transparency
 *
 * Transparency Center — single-page surface backed by the CMS
 * `pages/company-transparency` document. All copy, reports, stat cards, and
 * commitments fall back to constants so the page renders correctly on fresh
 * databases or when the CMS document hasn't been populated yet.
 *
 * Layout follows the canonical CompanyPage / TechnologiesPage patterns:
 *   container > border-border border-x > grid grid-cols-12 > col-[2/-2]
 * ──────────────────────────────────────────── */

/* ── Fallback copy ── */

const DEFAULT_HERO_BADGE = 'Transparency Center'
const DEFAULT_HERO_TITLE = 'Open by default.'
const DEFAULT_HERO_SUBTITLE =
  'The numbers, the money, the roadmap, the mistakes — we publish all of it. Trust is earned by showing your work, not by asking for it.'

const DEFAULT_REPORTS_HEADING = 'Annual reports'
const DEFAULT_REPORTS_SUBHEADING =
  'A yearly snapshot of what we built, how we spent, and where we fell short.'

interface ReportItem {
  year: string
  title: string
  summary: string
  href: string
}

const DEFAULT_REPORTS: ReportItem[] = [
  {
    year: '2025',
    title: '2025 Transparency Report',
    summary:
      'Full breakdown of product launches, active users, revenue, compensation, security incidents, and the commitments we missed.',
    href: '/newsroom',
  },
  {
    year: '2024',
    title: '2024 Transparency Report',
    summary:
      'The first public transparency report — covering the launch of Oxy Inbox, the fediverse bridge, and our shift to a worker-owned governance model.',
    href: '/newsroom',
  },
]

const DEFAULT_OPEN_DATA_HEADING = 'Open data'
const DEFAULT_OPEN_DATA_SUBHEADING =
  'Inspect the ecosystem in real time. These are not dashboards we control — they are the actual source of truth.'

interface OpenDataCard {
  label: string
  title: string
  description: string
  href: string
  cta: string
}

const DEFAULT_OPEN_DATA: OpenDataCard[] = [
  {
    label: 'Source code',
    title: '100% open-source',
    description:
      'Every product in the Oxy ecosystem ships its full source code under an OSI-approved license. Audit it, fork it, self-host it.',
    href: 'https://github.com/OxyHQ',
    cta: 'Browse the org',
  },
  {
    label: 'Public infra',
    title: 'Live status page',
    description:
      'Real uptime for every public Oxy service. Incidents get post-mortems within 7 days — published, no exceptions.',
    href: '/status',
    cta: 'View status',
  },
  {
    label: 'Audited',
    title: 'Third-party audits',
    description:
      'Independent security, privacy, and accessibility reviews — published in full, including findings we are still working on.',
    href: '/newsroom',
    cta: 'Read latest audit',
  },
]

const DEFAULT_COMMITMENTS_HEADING = 'Our commitments'
const DEFAULT_COMMITMENTS_SUBHEADING =
  'The promises we make to everyone who uses, builds on, or partners with Oxy.'

const DEFAULT_COMMITMENTS: string[] = [
  'We will never sell, trade, or share your personal data with third parties for marketing.',
  'We will never run surveillance ads or profile you across products to sell your attention.',
  'We will never use your private content to train AI models without explicit, granular consent.',
  'We will publish post-mortems for every major incident within 7 days — findings and fixes.',
  'We will keep every product open-source. No proprietary lock-ins, no closed re-licensing.',
  'We will compensate contributors fairly and publish our compensation bands every year.',
]

const DEFAULT_CTA_HEADING = 'Ask us anything'
const DEFAULT_CTA_SUBHEADING =
  'Have a question about how Oxy operates, spends, or decides? We read every message and publish the answers that matter.'

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
 * Parse a "reports" section's items into ReportItem objects. Items on the
 * server are stored as Mixed, so extra fields arrive as `unknown` — each
 * field is narrowed with a runtime type guard.
 */
function parseReports(sections: PageSection[], fallback: ReportItem[]): ReportItem[] {
  const section = sections.find((s) => s.type === 'reports')
  const rawItems = section?.items ?? []
  const parsed: ReportItem[] = []
  for (const item of rawItems) {
    const title = typeof item.title === 'string' ? item.title : ''
    if (title.length === 0) continue
    const year = typeof item.year === 'string' ? item.year : ''
    const summary = typeof item.summary === 'string' ? item.summary : ''
    const href = typeof item.href === 'string' && item.href.length > 0 ? item.href : '#'
    parsed.push({ year, title, summary, href })
  }
  return parsed.length > 0 ? parsed : fallback
}

/**
 * Parse an "open-data" section into OpenDataCard objects with runtime
 * type guards on every field.
 */
function parseOpenData(sections: PageSection[], fallback: OpenDataCard[]): OpenDataCard[] {
  const section = sections.find((s) => s.type === 'open-data')
  const rawItems = section?.items ?? []
  const parsed: OpenDataCard[] = []
  for (const item of rawItems) {
    const title = typeof item.title === 'string' ? item.title : ''
    if (title.length === 0) continue
    const label = typeof item.label === 'string' ? item.label : ''
    const description = typeof item.description === 'string' ? item.description : ''
    const href = typeof item.href === 'string' && item.href.length > 0 ? item.href : '#'
    const cta = typeof item.cta === 'string' && item.cta.length > 0 ? item.cta : 'Learn more'
    parsed.push({ label, title, description, href, cta })
  }
  return parsed.length > 0 ? parsed : fallback
}

/**
 * Parse a "commitments" section's items into a list of strings. Each item
 * is expected to hold its copy in `text` or fall back to `value`.
 */
function parseCommitments(sections: PageSection[], fallback: string[]): string[] {
  const section = sections.find((s) => s.type === 'commitments')
  const rawItems = section?.items ?? []
  const parsed: string[] = []
  for (const item of rawItems) {
    const text = typeof item.text === 'string' && item.text.length > 0
      ? item.text
      : (typeof item.value === 'string' ? item.value : '')
    if (text.length > 0) parsed.push(text)
  }
  return parsed.length > 0 ? parsed : fallback
}

/* ── Layout primitives ── */

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

function ArrowRightIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className={className}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </svg>
  )
}

function CheckIcon({ className = '' }: { className?: string }) {
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
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  )
}

/* ── Page ── */

export default function TransparencyPage() {
  const { data: pageData } = usePage('company-transparency')
  const sections = pageData?.sections ?? []

  const heroBadge = sectionContent(sections, 'hero', DEFAULT_HERO_BADGE)
  const heroTitle = sectionHeading(sections, 'hero', DEFAULT_HERO_TITLE)
  const heroSubtitle = sectionSubheading(sections, 'hero', DEFAULT_HERO_SUBTITLE)

  const reportsHeading = sectionHeading(sections, 'reports', DEFAULT_REPORTS_HEADING)
  const reportsSubheading = sectionSubheading(sections, 'reports', DEFAULT_REPORTS_SUBHEADING)
  const reports = parseReports(sections, DEFAULT_REPORTS)

  const openDataHeading = sectionHeading(sections, 'open-data', DEFAULT_OPEN_DATA_HEADING)
  const openDataSubheading = sectionSubheading(sections, 'open-data', DEFAULT_OPEN_DATA_SUBHEADING)
  const openData = parseOpenData(sections, DEFAULT_OPEN_DATA)

  const commitmentsHeading = sectionHeading(sections, 'commitments', DEFAULT_COMMITMENTS_HEADING)
  const commitmentsSubheading = sectionSubheading(sections, 'commitments', DEFAULT_COMMITMENTS_SUBHEADING)
  const commitments = parseCommitments(sections, DEFAULT_COMMITMENTS)

  const ctaHeading = sectionHeading(sections, 'cta', DEFAULT_CTA_HEADING)
  const ctaSubheading = sectionSubheading(sections, 'cta', DEFAULT_CTA_SUBHEADING)

  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <SEO
        title="Transparency Center"
        description="Open by default. Every Oxy annual report, every live metric, every commitment — published in full. Trust is earned by showing your work."
        canonicalPath="/company/transparency"
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
                <h1 className="max-w-[16em] text-balance text-heading-responsive-lg">
                  {heroTitle}
                </h1>
                <p className="mt-4 max-w-2xl text-balance text-lg text-foreground lg:text-xl">
                  {heroSubtitle}
                </p>
                <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                  <Button variant="primary" size="md" responsive href="/status">
                    Live status
                  </Button>
                  <Button variant="outline" size="md" responsive href="https://github.com/OxyHQ">
                    Browse the source
                  </Button>
                </div>
              </div>
            </header>
          </div>
        </section>

        {/* ═══ Annual reports ═══ */}
        <section className="container">
          <div className="border-border border-x">
            <DashedHLine />
            <DashedVLines />

            <header className="grid grid-cols-12 pt-20 pb-12 max-lg:pt-16 max-lg:pb-10 justify-items-start">
              <div className="col-[2/-2] max-w-[24em] text-pretty text-heading-responsive-sm text-start mix-blend-multiply dark:mix-blend-screen">
                <h2 className="text-pretty inline">{reportsHeading}.</h2>{' '}
                <p className="inline text-pretty font-medium text-muted-foreground">
                  {reportsSubheading}
                </p>
              </div>
            </header>

            <DashedVLines />

            <div className="grid grid-cols-12 pb-20 max-lg:pb-16">
              <div className="col-[2/-2] flex flex-col gap-4">
                {reports.map((report) => (
                  <a
                    key={report.title}
                    href={report.href}
                    className="group relative flex items-start justify-between gap-6 overflow-hidden rounded-2xl border border-border p-6 pt-5.5 transition-colors duration-400 ease-in-out hover:border-input hover:duration-150"
                  >
                    <div className="pointer-events-none absolute inset-0 bg-surface opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-80 group-hover:duration-50" />
                    <div className="relative flex flex-1 items-start gap-6 max-md:flex-col max-md:gap-3">
                      {report.year.length > 0 && (
                        <span className="shrink-0 font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground md:mt-1">
                          {report.year}
                        </span>
                      )}
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-foreground">{report.title}</h3>
                        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{report.summary}</p>
                      </div>
                    </div>
                    <ArrowRightIcon className="relative mt-1 size-5 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══ Open data ═══ */}
        <section className="container">
          <div className="border-border border-x">
            <DashedHLine />

            <header className="grid grid-cols-12 pt-20 pb-12 max-lg:pt-16 max-lg:pb-10 justify-items-start">
              <div className="col-[2/-2] max-w-[24em] text-pretty text-heading-responsive-sm text-start mix-blend-multiply dark:mix-blend-screen">
                <h2 className="text-pretty inline">{openDataHeading}.</h2>{' '}
                <p className="inline text-pretty font-medium text-muted-foreground">
                  {openDataSubheading}
                </p>
              </div>
            </header>

            <DashedVLines />

            {/* Pixel-gap 1/3 grid */}
            <div className="relative grid grid-cols-12">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 text-border/30"
                style={{ backgroundImage: 'repeating-linear-gradient(125deg, transparent, transparent 6px, currentColor 6px, currentColor 7px)' }}
              />
              <div className="relative col-[2/-2] grid grid-cols-1 gap-px bg-border p-px md:grid-cols-3">
                {openData.map((card) => {
                  const isInternal = card.href.startsWith('/')
                  const linkProps = isInternal
                    ? { href: card.href }
                    : { href: card.href, target: '_blank', rel: 'noopener noreferrer' }
                  return (
                    <a
                      key={card.title}
                      {...linkProps}
                      className="group relative flex flex-col bg-background p-8 transition-colors duration-300 hover:bg-surface lg:p-10"
                    >
                      {card.label.length > 0 && (
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {card.label}
                        </span>
                      )}
                      <h3 className="mt-4 text-2xl font-medium text-foreground">{card.title}</h3>
                      <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground">
                        {card.description}
                      </p>
                      <span className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                        {card.cta}
                        <ArrowRightIcon className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </span>
                    </a>
                  )
                })}
              </div>
            </div>

            <DashedVLines height="h-21 md:h-40" />
          </div>
        </section>

        {/* ═══ Our commitments ═══ */}
        <section className="container">
          <div className="border-border border-x">
            <DashedHLine />

            <header className="grid grid-cols-12 pt-20 pb-12 max-lg:pt-16 max-lg:pb-10 justify-items-start">
              <div className="col-[2/-2] max-w-[24em] text-pretty text-heading-responsive-sm text-start mix-blend-multiply dark:mix-blend-screen">
                <h2 className="text-pretty inline">{commitmentsHeading}.</h2>{' '}
                <p className="inline text-pretty font-medium text-muted-foreground">
                  {commitmentsSubheading}
                </p>
              </div>
            </header>

            <div className="grid grid-cols-12 pb-20 max-lg:pb-16">
              <div className="col-[2/-2]">
                <ul className="mx-auto flex max-w-3xl flex-col gap-4">
                  {commitments.map((commitment) => (
                    <li key={commitment} className="flex items-start gap-3">
                      <span className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border border-border bg-surface">
                        <CheckIcon className="size-3 text-foreground" />
                      </span>
                      <span className="text-base text-foreground leading-relaxed">{commitment}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ Ask us anything CTA ═══ */}
        <section className="container">
          <div className="border-border border-x">
            <DashedHLine />
            <div className="grid grid-cols-12">
              <div className="col-[2/-2] py-20 max-lg:py-16">
                <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
                  <h2 className="text-balance text-heading-responsive-md">{ctaHeading}.</h2>
                  <p className="max-w-xl text-pretty text-muted-foreground">{ctaSubheading}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
                    <Button variant="primary" size="md" responsive href="/help">
                      Go to help center
                    </Button>
                    <Button variant="outline" size="md" responsive href="/company/business">
                      How our business works
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
