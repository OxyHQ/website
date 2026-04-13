import { useState } from 'react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import Button from '../components/ui/Button'
import AIResearchSection from '../components/ai/AIResearchSection'
import KeepUpToDateSection from '../components/sections/KeepUpToDateSection'
import { useNewsroomPosts, useJobs } from '../api/hooks'
import {
  companyHero, companyStats, companyCulture, culturePerks,
  companyValues, teamMembers, companyFAQ, companyLinks,
} from '../data/company'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' })
}

function DashedHLine() {
  return (
    <svg width="100%" height="1" className="text-border">
      <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
    </svg>
  )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-border">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left"
      >
        <span className="font-medium text-foreground">{question}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className={`size-5 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <p className="pb-5 text-muted-foreground leading-relaxed">{answer}</p>
      )}
    </div>
  )
}

export default function CompanyPage() {
  const { data: newsData } = useNewsroomPosts({ featured: true, limit: 3 })
  const articles = newsData?.posts ?? []
  const { data: jobs = [] } = useJobs()
  const openCount = jobs.length

  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <SEO
        title="Company"
        description="We build ethical technology that solves real problems, giving people the tools to shape their own futures. Learn about our mission, values, culture, and team."
        canonicalPath="/company"
      />
      <Navbar />
      <main>
        {/* ═══ Hero ═══ */}
        <section className="container">
          <div className="border-border border-x">
            <header className="grid grid-cols-12 pt-40 pb-20 max-xl:pt-30 max-xl:pb-16 max-lg:pt-25 max-lg:pb-15 justify-items-center">
              <div className="col-[2/-2] flex flex-col items-center gap-4 text-center">
                <div className="inline-block w-fit rounded-[13px] border border-border bg-background px-3 py-1.5 font-medium text-[13px]/[1.4em] text-foreground mb-2">
                  {companyHero.badge}
                </div>
                <h1 className="text-balance text-heading-responsive-lg max-w-[18em]">
                  {companyHero.title}
                </h1>
                <p className="mt-4 max-w-xl text-balance text-lg text-muted-foreground lg:text-xl">
                  {companyHero.subtitle}
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <Button variant="primary" size="md" responsive href="/initiative">
                    Our initiative
                  </Button>
                  <Button variant="outline" size="md" responsive href="/company/careers">
                    View careers
                  </Button>
                </div>
              </div>
            </header>
            <DashedHLine />
          </div>
        </section>

        {/* ═══ Stats ═══ */}
        <section className="container">
          <div className="border-border border-x">
            <div className="grid grid-cols-12">
              <div className="col-[2/-2] py-16">
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
            <DashedHLine />
          </div>
        </section>

        {/* ═══ Culture ═══ */}
        <section className="container">
          <div className="border-border border-x">
            <div className="grid grid-cols-12">
              <div className="col-[2/-2] py-20 max-lg:py-16">
                <h2 className="text-pretty text-heading-responsive-sm">
                  <span className="inline">{companyCulture.heading}.</span>{' '}
                  <span className="inline font-medium text-muted-foreground">{companyCulture.description}</span>
                </h2>
                <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {culturePerks.map((perk) => (
                    <a
                      key={perk.title}
                      href={perk.href}
                      className="group rounded-2xl border border-border p-5 transition-colors hover:bg-surface"
                    >
                      <span className="font-medium text-foreground group-hover:underline">{perk.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
            <DashedHLine />
          </div>
        </section>

        {/* ═══ Values ═══ */}
        <section className="container">
          <div className="border-border border-x">
            <div className="grid grid-cols-12">
              <div className="col-[2/-2] py-20 max-lg:py-16">
                <h2 className="text-pretty text-heading-responsive-sm mb-10">Our values</h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {companyValues.map((v) => (
                    <div key={v.title} className="rounded-2xl border border-border bg-surface p-8">
                      <h3 className="text-lg font-medium text-foreground">{v.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{v.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DashedHLine />
          </div>
        </section>

        {/* ═══ Team ═══ */}
        <section className="container">
          <div className="border-border border-x">
            <div className="grid grid-cols-12">
              <div className="col-[2/-2] py-20 max-lg:py-16">
                <div className="flex items-end justify-between mb-10">
                  <h2 className="text-heading-responsive-sm">Team</h2>
                  <Button variant="outline" size="sm" href="/company/team">
                    All team
                  </Button>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  {teamMembers.map((member) => (
                    <a
                      key={member.slug}
                      href={`/company/team/${member.slug}`}
                      className="group rounded-2xl border border-border p-6 transition-colors hover:bg-surface"
                    >
                      <div className="flex items-start gap-4">
                        <div className="size-12 shrink-0 rounded-full bg-surface border border-border" />
                        <div>
                          <h3 className="font-medium text-foreground group-hover:underline">{member.name}</h3>
                          <p className="text-sm text-muted-foreground">{member.role}</p>
                          <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-2">{member.description}</p>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
            <DashedHLine />
          </div>
        </section>

        {/* ═══ Open Roles ═══ */}
        <section className="container">
          <div className="border-border border-x">
            <div className="grid grid-cols-12">
              <div className="col-[2/-2] py-20 max-lg:py-16 text-center">
                <h2 className="text-heading-responsive-sm">Open roles</h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  We're a global, remote-first team building open-source technology that matters.
                  {openCount > 0 && <> We have <strong className="text-foreground">{openCount} open positions</strong>.</>}
                </p>
                <div className="mt-8 flex justify-center gap-3">
                  <Button variant="primary" size="md" responsive href="/company/careers#open-positions">
                    View open roles
                  </Button>
                </div>
              </div>
            </div>
            <DashedHLine />
          </div>
        </section>

        {/* ═══ AI for Research ═══ */}
        <section className="container">
          <div className="border-border border-x">
            <div className="grid grid-cols-12">
              <div className="col-[2/-2] py-20 max-lg:py-16">
                <AIResearchSection />
              </div>
            </div>
            <DashedHLine />
          </div>
        </section>

        {/* ═══ Latest News ═══ */}
        {articles.length > 0 && (
          <section className="container">
            <div className="border-border border-x">
              <div className="grid grid-cols-12">
                <div className="col-[2/-2] py-20 max-lg:py-16">
                  <div className="flex items-end justify-between mb-10">
                    <h2 className="text-heading-responsive-sm">Latest news</h2>
                    <Button variant="outline" size="sm" href="/newsroom">
                      View all
                    </Button>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {articles.map((article) => (
                      <a
                        key={article.slug}
                        href={`/newsroom/${article.slug}`}
                        className="group rounded-2xl border border-border bg-surface p-6 transition-colors hover:bg-surface/80"
                      >
                        {article.coverImage && (
                          <img
                            src={article.coverImage}
                            alt={article.imageAlt || article.title}
                            className="aspect-[16/10] w-full rounded-lg object-cover"
                            loading="lazy"
                          />
                        )}
                        <div className={article.coverImage ? 'mt-4' : ''}>
                          <p className="text-xs text-muted-foreground">{formatDate(article.publishedAt)}</p>
                          <h3 className="mt-2 text-lg font-medium text-foreground group-hover:underline">{article.title}</h3>
                          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{article.resume}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
              <DashedHLine />
            </div>
          </section>
        )}

        {/* ═══ FAQ ═══ */}
        <section className="container">
          <div className="border-border border-x">
            <div className="grid grid-cols-12">
              <div className="col-[2/-2] py-20 max-lg:py-16">
                <h2 className="text-heading-responsive-sm mb-10">Find answers</h2>
                <div className="mx-auto max-w-3xl">
                  {companyFAQ.map((item) => (
                    <FAQItem key={item.question} question={item.question} answer={item.answer} />
                  ))}
                </div>
              </div>
            </div>
            <DashedHLine />
          </div>
        </section>

        {/* ═══ Quick Links ═══ */}
        <section className="container">
          <div className="border-border border-x">
            <div className="grid grid-cols-12">
              <div className="col-[2/-2] py-20 max-lg:py-16">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {companyLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      className="group flex items-center justify-between rounded-2xl border border-border p-6 transition-colors hover:bg-surface"
                    >
                      <div>
                        <h3 className="font-medium text-foreground">{link.label}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{link.description}</p>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true">
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
