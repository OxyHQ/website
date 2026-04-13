import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import Button from '../components/ui/Button'
import ValuesSection from '../components/careers/ValuesSection'
import TeamSizeSection from '../components/careers/TeamSizeSection'
import TestimonialsSection from '../components/sections/TestimonialsSection'
import KeepUpToDateSection from '../components/sections/KeepUpToDateSection'
import AIResearchSection from '../components/ai/AIResearchSection'
import { useNewsroomPosts, useJobs } from '../api/hooks'
import {
  companyHero, companyStats, companyMission,
  companyPrinciples, companyLinks,
} from '../data/company'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' })
}

/** Reusable dashed horizontal SVG line spanning the full border-x width */
function DashedHLine() {
  return (
    <svg width="100%" height="1" className="text-border">
      <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
    </svg>
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
        description="Oxy is an open-source technology company building tools that empower people, protect privacy, and advance human understanding. Learn about our mission, values, and team."
        canonicalPath="/company"
      />
      <Navbar />
      <main>
        {/* ═══ Hero ═══ */}
        <section className="container">
          <div className="border-border border-x">
            <header className="grid grid-cols-12 pt-40 pb-20 max-xl:pt-30 max-xl:pb-16 max-lg:pt-25 max-lg:pb-15 justify-items-center">
              <div className="col-[2/-2] flex flex-col items-center gap-4 text-center">
                <h1 className="text-balance text-heading-responsive-lg">
                  {companyHero.title}
                </h1>
                <p className="mt-4 max-w-xl text-balance text-lg text-muted-foreground lg:text-xl">
                  {companyHero.description}
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

            {/* Dashed separator */}
            <DashedHLine />
          </div>
        </section>

        {/* ═══ Stats ═══ */}
        <section className="container">
          <div className="border-border border-x">
            <div className="grid grid-cols-12">
              <div className="col-[2/-2] py-16">
                <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
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

            {/* Dashed separator */}
            <DashedHLine />
          </div>
        </section>

        {/* ═══ Mission ═══ */}
        <section className="container">
          <div className="border-border border-x">
            <div className="grid grid-cols-12">
              <div className="col-[2/-2] py-20 max-lg:py-16">
                <div className="mx-auto max-w-3xl text-center">
                  <h2 className="text-pretty text-heading-responsive-sm">
                    <span className="inline">{companyMission.heading}.</span>{' '}
                    <span className="inline font-medium text-muted-foreground">{companyMission.description}</span>
                  </h2>
                </div>
              </div>
            </div>

            {/* Dashed separator */}
            <DashedHLine />
          </div>
        </section>

        {/* ═══ Principles ═══ */}
        <section className="container">
          <div className="border-border border-x">
            <div className="grid grid-cols-12">
              <div className="col-[2/-2] py-20 max-lg:py-16">
                <div className="grid gap-6 sm:grid-cols-2 lg:gap-8">
                  {companyPrinciples.map((p) => (
                    <div key={p.title} className="rounded-2xl border border-border bg-surface p-8 lg:p-10">
                      <h3 className="text-xl font-medium text-foreground">{p.title}</h3>
                      <p className="mt-3 text-muted-foreground leading-relaxed">{p.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ Values (reused from Careers — has its own container + border-x) ═══ */}
        <ValuesSection />

        {/* ═══ Team (reused from Careers — has its own container + border-x) ═══ */}
        <TeamSizeSection />

        {/* ═══ AI for Research ═══ */}
        <section className="container">
          <div className="border-border border-x">
            <div className="grid grid-cols-12">
              <div className="col-[2/-2] py-20 max-lg:py-16">
                <AIResearchSection />
              </div>
            </div>

            {/* Dashed separator */}
            <DashedHLine />
          </div>
        </section>

        {/* ═══ Testimonials (from CMS) — full-bleed carousel, borders resume after ═══ */}
        <section className="container">
          <div className="border-border border-x">
            <DashedHLine />
          </div>
        </section>
        <TestimonialsSection />
        <section className="container">
          <div className="border-border border-x">
            <DashedHLine />
          </div>
        </section>

        {/* ═══ Latest News ═══ */}
        {articles.length > 0 && (
          <section className="container">
            <div className="border-border border-x">
              <div className="grid grid-cols-12">
                <div className="col-[2/-2] py-20 max-lg:py-16">
                  <div className="flex items-end justify-between">
                    <h2 className="text-heading-responsive-sm">Latest news</h2>
                    <Button variant="outline" size="sm" href="/newsroom">
                      View all
                    </Button>
                  </div>
                  <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

              {/* Dashed separator */}
              <DashedHLine />
            </div>
          </section>
        )}

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

            {/* Dashed separator */}
            <DashedHLine />
          </div>
        </section>

        {/* ═══ Careers CTA ═══ */}
        <section className="container">
          <div className="border-border border-x">
            <div className="grid grid-cols-12">
              <div className="col-[2/-2] py-20 max-lg:py-16 text-center">
                <h2 className="text-heading-responsive-sm">Join the team</h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  We're a global, remote-first team building open-source technology that matters.
                  {openCount > 0 && <> We have <strong className="text-foreground">{openCount} open positions</strong>.</>}
                </p>
                <div className="mt-8">
                  <Button variant="primary" size="lg" responsive href="/company/careers">
                    View open positions
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ Keep Up To Date (reused — has its own container + border-x) ═══ */}
        <KeepUpToDateSection />
      </main>
      <Footer />
    </div>
  )
}
