import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import Button from '../components/ui/Button'
import KeepUpToDateSection from '../components/sections/KeepUpToDateSection'
import { usePage, type PageSection } from '../api/hooks'

/* ──────────────────────────────────────────────
 * /company/manifesto
 *
 * Single-page marketing surface backed by the CMS `pages/company-manifesto`
 * document. Every section falls back to constant copy when the CMS document
 * is missing or the relevant section hasn't been populated, so the page
 * renders identically even on fresh databases.
 *
 * Layout follows the canonical CompanyPage / ProductsPage patterns:
 *   container > border-border border-x > grid grid-cols-12 > col-[2/-2]
 * Dashed rule helpers match CompanyPage.
 * ──────────────────────────────────────────── */

/* ── Fallback copy ── */

const DEFAULT_HERO_BADGE = 'The Oxy Manifesto'
const DEFAULT_HERO_TITLE = 'Technology should serve people, not the other way around.'
const DEFAULT_HERO_SUBTITLE =
  'We build software the way we wish the whole industry did — open, honest, and accountable to the people who actually use it. This is what we stand for, and what we refuse to do.'

const DEFAULT_PRINCIPLES_HEADING = 'Our principles'
const DEFAULT_PRINCIPLES_SUBHEADING =
  'Six commitments that shape every product we ship and every decision we make.'

interface Principle {
  title: string
  description: string
}

const DEFAULT_PRINCIPLES: Principle[] = [
  {
    title: 'People before profit',
    description:
      'Every product decision starts with the question: does this actually help the people using it? Profit follows — it never leads.',
  },
  {
    title: 'Open by default',
    description:
      'Our source code, our APIs, our infrastructure. If we can open it, we do. Trust is earned by showing your work, not by asking for it.',
  },
  {
    title: 'Privacy is a right',
    description:
      'Your data is yours. Not a product, not a training set, not a growth lever. We design every system so surveillance is impossible, not just forbidden.',
  },
  {
    title: 'Honest interfaces',
    description:
      'No dark patterns, no manufactured urgency, no manipulative defaults. If a choice matters, we ask you plainly and respect whatever you pick.',
  },
  {
    title: 'Built with, not for',
    description:
      'We build in public, ship small, and listen hard. The people who use Oxy shape the roadmap — not quarterly ad targets or vanity metrics.',
  },
  {
    title: 'Long-term over loud-term',
    description:
      'We optimize for the next decade, not the next quarter. Boring, durable, maintainable technology beats hype every single time.',
  },
]

const DEFAULT_WHY_HEADING = 'Why this matters'
const DEFAULT_WHY_CONTENT =
  'The last two decades of consumer technology taught us what happens when software is built to extract rather than to serve. Feeds became casinos. Data became currency. Attention became the thing being sold. The people whose lives were being rewired had no meaningful say in any of it.\n\nWe think there is another way. Software can be open, honest, and aligned with the people who use it — and still be good software. Still be beautiful, useful, fast, and financially sustainable. We know because we are building it every day. None of this is idealism. It is a design constraint, and it produces better products.'

const DEFAULT_CTA_HEADING = 'Sign the manifesto'
const DEFAULT_CTA_SUBHEADING =
  'If any of this resonates, join us. Build with us, work with us, or just hold us to it in public.'

/* ── CMS helpers (mirrors ProductsPage) ── */

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
 * Parse a "principles" section's items into strongly-typed Principle objects.
 * Falls back to the provided defaults if the section is missing or its items
 * don't contain at least a title. Items on the server are stored as Mixed so
 * extra fields (`title`, `description`) arrive as `unknown` — narrow them
 * with runtime guards, never with `as any`.
 */
function parsePrinciples(sections: PageSection[], fallback: Principle[]): Principle[] {
  const section = sections.find((s) => s.type === 'principles')
  const rawItems = section?.items ?? []
  const parsed: Principle[] = []
  for (const item of rawItems) {
    const title = typeof item.title === 'string' ? item.title : ''
    const description = typeof item.description === 'string' ? item.description : ''
    if (title.length > 0) parsed.push({ title, description })
  }
  return parsed.length > 0 ? parsed : fallback
}

/* ── Layout primitives (copied from CompanyPage) ── */

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

/* ── Page ── */

export default function ManifestoPage() {
  const { data: pageData } = usePage('company-manifesto')
  const sections = pageData?.sections ?? []

  const heroBadge = sectionContent(sections, 'hero', DEFAULT_HERO_BADGE)
  const heroTitle = sectionHeading(sections, 'hero', DEFAULT_HERO_TITLE)
  const heroSubtitle = sectionSubheading(sections, 'hero', DEFAULT_HERO_SUBTITLE)

  const principlesHeading = sectionHeading(sections, 'principles', DEFAULT_PRINCIPLES_HEADING)
  const principlesSubheading = sectionSubheading(sections, 'principles', DEFAULT_PRINCIPLES_SUBHEADING)
  const principles = parsePrinciples(sections, DEFAULT_PRINCIPLES)

  const whyHeading = sectionHeading(sections, 'why', DEFAULT_WHY_HEADING)
  const whyContent = sectionContent(sections, 'why', DEFAULT_WHY_CONTENT)
  const whyParagraphs = whyContent.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)

  const ctaHeading = sectionHeading(sections, 'cta', DEFAULT_CTA_HEADING)
  const ctaSubheading = sectionSubheading(sections, 'cta', DEFAULT_CTA_SUBHEADING)

  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <SEO
        title="Manifesto"
        description="The Oxy Manifesto — the principles that guide every product, partnership, and hire. Technology built to serve people, not exploit them."
        canonicalPath="/company/manifesto"
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
                  <Button variant="primary" size="md" responsive href="/partners">
                    Partner with us
                  </Button>
                  <Button variant="outline" size="md" responsive href="/company/careers">
                    Join the team
                  </Button>
                </div>
              </div>
            </header>
          </div>
        </section>

        {/* ═══ Principles ═══ */}
        <section className="container">
          <div className="border-border border-x">
            <DashedHLine />
            <DashedVLines />

            <header className="grid grid-cols-12 pt-20 pb-12 max-lg:pt-16 max-lg:pb-10 justify-items-start">
              <div className="col-[2/-2] max-w-[24em] text-pretty text-heading-responsive-sm text-start mix-blend-multiply dark:mix-blend-screen">
                <h2 className="text-pretty inline">{principlesHeading}.</h2>{' '}
                <p className="inline text-pretty font-medium text-muted-foreground">
                  {principlesSubheading}
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
                {principles.map((principle, idx) => (
                  <div key={principle.title} className="bg-background p-8 lg:p-10">
                    <span className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <h3 className="mt-4 text-lg font-medium text-foreground">{principle.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{principle.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <DashedVLines height="h-21 md:h-40" />
          </div>
        </section>

        {/* ═══ Why this matters ═══ */}
        <section className="container">
          <div className="border-border border-x">
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

        {/* ═══ Sign the manifesto ═══ */}
        <section className="container">
          <div className="border-border border-x">
            <div className="grid grid-cols-12">
              <div className="col-[2/-2] py-20 max-lg:py-16">
                <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
                  <h2 className="text-balance text-heading-responsive-md">{ctaHeading}.</h2>
                  <p className="max-w-xl text-pretty text-muted-foreground">
                    {ctaSubheading}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
                    <Button variant="primary" size="md" responsive href="/partners">
                      Become a partner
                    </Button>
                    <Button variant="outline" size="md" responsive href="/company/careers">
                      View open roles
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
