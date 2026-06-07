import { useState } from 'react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import Button from '../components/ui/Button'
import AIResearchSection from '../components/ai/AIResearchSection'
import KeepUpToDateSection from '../components/sections/KeepUpToDateSection'
import RecentNewsSection from '../components/newsroom/RecentNewsSection'
import { useJobs, useTeamMembers, usePage, type PageSection } from '../api/hooks'
import { useTranslation } from '../lib/i18n'
import {
  companyHero, companyStats, companyCulture, culturePerks,
  companyValues, companyFAQ, companyLinks,
} from '../data/company'

function sectionHeading(sections: PageSection[], type: string, fallback: string): string {
  return sections.find(s => s.type === type)?.heading || fallback
}

function sectionSubheading(sections: PageSection[], type: string, fallback: string): string {
  return sections.find(s => s.type === type)?.subheading || fallback
}

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
      {isOpen && (
        <p className="pb-5 text-muted-foreground leading-relaxed">{answer}</p>
      )}
    </div>
  )
}

export default function CompanyPage() {
  const { t } = useTranslation()
  const { data: jobs = [] } = useJobs()
  const openCount = jobs.length
  const { data: teamMembers = [] } = useTeamMembers()
  const { data: pageData } = usePage('company')
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)

  const sections = pageData?.sections ?? []
  const valuesHeading = sectionHeading(sections, 'values', t('company.valuesHeading'))
  const valuesDescription = sectionSubheading(sections, 'values', t('company.valuesDescription'))

  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <SEO
        title={t('company.seoTitle')}
        description={t('company.seoDescription')}
        canonicalPath="/company"
      />
      <Navbar />
      <main>
        {/* ═══ Hero ═══ */}
        <section className="container">
          <div>
            <div className="relative overflow-hidden">
              {/* Background image */}
              <div className="absolute inset-0 bg-cover bg-center opacity-20 dark:opacity-15" style={{ backgroundImage: 'url(/company/hero-bg.jpg)' }} />
              <header className="relative grid grid-cols-12 pt-40 pb-20 max-xl:pt-30 max-xl:pb-16 max-lg:pt-25 max-lg:pb-15 justify-items-center">
                <div className="col-[2/-2] flex flex-col items-center gap-4 text-center">
                  <div className="inline-block w-fit rounded-[13px] border border-border bg-background px-3 py-1.5 font-medium text-[13px]/[1.4em] text-foreground mb-6">
                    {companyHero.badge}
                  </div>
                  <h1 className="text-balance text-heading-responsive-lg max-w-[18em]">
                    {companyHero.title}
                  </h1>
                  <p className="mt-4 max-w-xl text-balance text-lg text-foreground lg:text-xl">
                    {companyHero.subtitle}
                  </p>
                  <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                    <Button variant="primary" size="md" responsive href="/initiative">
                      {t('company.ourInitiative')}
                    </Button>
                    <Button variant="outline" size="md" responsive href="/company/careers">
                      {t('company.viewCareers')}
                    </Button>
                  </div>
                </div>
              </header>
            </div>
          </div>
        </section>

        {/* ═══ Stats ═══ */}
        <section className="container">
          <div>
            <DashedHLine />
            <DashedVLines />
            <div className="relative grid grid-cols-12">
              {/* Dot pattern background */}
              <svg width="100%" height="100%" className="mask-t-to-50% absolute inset-0 text-muted">
                <defs>
                  <pattern id="stats-dots" width="10" height="10" patternUnits="userSpaceOnUse">
                    <rect x="5.5" y="5.5" width="1" height="1" fill="currentColor" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#stats-dots)" />
              </svg>
              <div className="relative col-[2/-2] py-20 max-lg:py-16">
                <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
                  {companyStats.map((stat) => (
                    <div key={stat.label} className="text-center">
                      <div className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">{stat.value}</div>
                      <div className="mt-1 text-sm font-medium text-foreground">{stat.label}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{stat.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DashedVLines />
          </div>
        </section>

        {/* ═══ Culture ═══ */}
        <section className="container">
          <div>
            <header className="grid grid-cols-12 pt-40 pb-20 max-xl:pt-30 max-xl:pb-16 max-lg:pt-25 max-lg:pb-15 justify-items-start">
              <div className="max-w-[20em] text-pretty text-heading-responsive-sm text-start col-[2/-2] mix-blend-multiply dark:mix-blend-screen">
                <h2 className="text-pretty inline">{companyCulture.heading}.</h2>{' '}
                <p className="inline text-pretty font-medium text-muted-foreground">
                  {companyCulture.description}
                </p>
              </div>
            </header>

            <DashedVLines />

            {/* Culture perks — pixel-gap grid (flat, no rounding) */}
            <div className="relative grid grid-cols-12">
              <div
                className="pointer-events-none absolute inset-0 text-border/30"
                style={{ backgroundImage: 'repeating-linear-gradient(125deg, transparent, transparent 6px, currentColor 6px, currentColor 7px)' }}
              />
              <div className="relative col-[2/-2] grid grid-cols-2 gap-px bg-border p-px max-lg:grid-cols-1 lg:grid-cols-3 xl:grid-cols-4">
                {culturePerks.map((perk) => (
                  <a
                    key={perk.title}
                    href={perk.href}
                    className="group relative flex items-center bg-background px-6 py-5 transition-colors"
                  >
                    <div className="pointer-events-none absolute inset-0 bg-surface opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-80 group-hover:duration-50" />
                    <span className="relative text-sm font-medium text-foreground">{perk.title}</span>
                  </a>
                ))}
              </div>
            </div>

            <DashedVLines height="h-21 md:h-40" />
          </div>
        </section>

        {/* ═══ Values ═══ */}
        <section className="container">
          <div>
            <header className="grid grid-cols-12 pt-40 pb-20 max-xl:pt-30 max-xl:pb-16 max-lg:pt-25 max-lg:pb-15 justify-items-start">
              <div className="max-w-[20em] text-pretty text-heading-responsive-sm text-start col-[2/-2] mix-blend-multiply dark:mix-blend-screen">
                <h2 className="text-pretty inline">{valuesHeading}.</h2>{' '}
                <p className="inline text-pretty font-medium text-muted-foreground">
                  {valuesDescription}
                </p>
              </div>
            </header>

            {/* Dashed vertical lines before card grid */}
            <DashedVLines />

            {/* Values card grid with diagonal stripe background — pixel-gap pattern */}
            <div className="relative grid grid-cols-12">
              <div
                className="pointer-events-none absolute inset-0 text-border/30"
                style={{ backgroundImage: 'repeating-linear-gradient(125deg, transparent, transparent 6px, currentColor 6px, currentColor 7px)' }}
              />

              <div className="relative col-[2/-2] grid grid-cols-1 gap-px bg-border p-px sm:grid-cols-2 lg:grid-cols-3">
                {companyValues.map((v) => (
                  <div key={v.title} className="bg-background p-8 lg:p-10">
                    <h3 className="text-lg font-medium text-foreground">{v.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{v.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom dashed vertical lines */}
            <DashedVLines height="h-21 md:h-40" />
          </div>
        </section>

        {/* ═══ Team ═══ */}
        <section className="container">
          <div>
            <header className="grid grid-cols-12 pt-40 pb-20 max-xl:pt-30 max-xl:pb-16 max-lg:pt-25 max-lg:pb-15 justify-items-start">
              <div className="col-[2/-2] flex w-full items-end justify-between">
                <div className="max-w-[20em] text-pretty text-heading-responsive-sm text-start mix-blend-multiply dark:mix-blend-screen">
                  <h2 className="text-pretty inline">{t('company.teamHeading')}.</h2>{' '}
                  <p className="inline text-pretty font-medium text-muted-foreground">
                    {t('company.teamSubheading')}
                  </p>
                </div>
                <Button variant="outline" size="sm" href="/company/team">
                  {t('company.teamSeeAll')}
                </Button>
              </div>
            </header>

            <DashedVLines />

            {/* Team — pixel-gap grid */}
            <div className="relative grid grid-cols-12">
              <div
                className="pointer-events-none absolute inset-0 text-border/30"
                style={{ backgroundImage: 'repeating-linear-gradient(125deg, transparent, transparent 6px, currentColor 6px, currentColor 7px)' }}
              />
              <div className="relative col-[2/-2] grid gap-px bg-border p-px sm:grid-cols-2 lg:grid-cols-4">
                {teamMembers.slice(0, 8).map((member) => (
                  <a key={member.slug} href={`/company/team`} className="group flex flex-col bg-background p-8">
                    <div className="size-14 shrink-0 rounded-full bg-surface border border-border overflow-hidden">
                      {member.avatar && <img src={member.avatar} alt={member.name} className="size-full object-cover" loading="lazy" />}
                    </div>
                    <h3 className="mt-4 font-medium text-foreground group-hover:underline">{member.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{member.role}</p>
                  </a>
                ))}
              </div>
            </div>

            <DashedVLines height="h-21 md:h-40" />
          </div>
        </section>

        {/* ═══ Open Roles ═══ */}
        <section className="container">
          <div>
            <header className="grid grid-cols-12 pt-40 pb-20 max-xl:pt-30 max-xl:pb-16 max-lg:pt-25 max-lg:pb-15 justify-items-center">
              <div className="col-[2/-2] text-center">
                <h2 className="text-heading-responsive-sm">Open roles</h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  We're a global, remote-first team building open-source technology that matters.
                  {openCount > 0 && <> We have <strong className="text-foreground">{openCount} open positions</strong>.</>}
                </p>
                <div className="mt-7 flex justify-center gap-3">
                  <Button variant="primary" size="md" responsive href="/company/careers#open-positions">
                    View open roles
                  </Button>
                </div>
              </div>
            </header>
            <DashedVLines height="h-20" />
          </div>
        </section>

        {/* ═══ AI for Research ═══ */}
        <section className="container">
          <div>
            <DashedVLines />
            <DashedHLine />
            <div className="py-20 max-lg:py-16">
              <AIResearchSection />
            </div>
            <DashedHLine />
            <DashedVLines />
          </div>
        </section>

        {/* ═══ Latest News ═══ */}
        <section className="container">
          <div>
            <DashedVLines />
            <DashedHLine />
            <div className="py-20 max-lg:py-16">
              <RecentNewsSection
                title="Latest news"
                linkText="View all"
                category="Company"
                href="/company/news"
              />
            </div>
            <DashedVLines height="h-20" />
          </div>
        </section>

        {/* ═══ FAQ ═══ */}
        <section className="container">
          <div>
            <DashedVLines />
            <DashedHLine />
            <div className="grid grid-cols-12">
              <div className="col-[2/-2] py-20 max-lg:py-16">
                <h2 className="text-heading-responsive-sm mb-10">Find answers</h2>
                <div className="mx-auto max-w-3xl">
                  {companyFAQ.map((item, i) => (
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

        {/* ═══ Quick Links ═══ */}
        <section className="container">
          <div>
            <DashedHLine />
            <div className="grid grid-cols-12">
              <div className="col-[2/-2] py-20 max-lg:py-16">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {companyLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-border p-6 pt-5.5 transition-colors duration-400 ease-in-out hover:border-input hover:duration-150"
                    >
                      <div className="pointer-events-none absolute inset-0 bg-surface opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-80 group-hover:duration-50" />
                      <div className="relative">
                        <h3 className="font-medium text-foreground">{link.label}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{link.description}</p>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="relative size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ Keep Up To Date ═══ */}
        <KeepUpToDateSection />
      </main>
      <Footer />
    </div>
  )
}
