import { useRef, type ReactNode } from 'react'
import { useInView } from 'framer-motion'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import Button from '../components/ui/Button'
import RollingNumber from '../components/ui/RollingNumber'
import { useJobs, useNewsroomPosts, useProducts } from '../api/hooks'
import { getStaticChangelog } from '../content/changelog-loader'
import { useTranslation } from '../lib/i18n'

/* ──────────────────────────────────────────────
 * /company
 *
 * Reads top to bottom as one argument: who this is for, what it is trying to do
 * and by what measures, what has actually shipped, what it commits to, and
 * where to read the rest.
 *
 * Every figure and every date comes from data the site already publishes — the
 * product records, the tracked repositories, the open roles, the newsroom — so
 * the page cannot claim something the rest of the site does not.
 * ──────────────────────────────────────────── */

const IMG = '/images/landing'

/** Who the ecosystem is built for, as the hero mosaic. */
const AUDIENCES: { label: string; icon: ReactNode }[] = [
  {
    label: 'People',
    icon: <path d="M10 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 0c-3.314 0-6 2.239-6 5v3h12v-3c0-2.761-2.686-5-6-5Z" />,
  },
  { label: 'Developers', icon: <path d="m7 6-5 4 5 4m6-8 5 4-5 4M11.5 3l-3 14" /> },
  {
    label: 'Communities',
    icon: (
      <path d="M6.5 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM1 18v-2.5C1 13 3.5 11 6.5 11S12 13 12 15.5V18m2-7c3 0 5 2 5 4.5V18" />
    ),
  },
  { label: 'Institutions', icon: <path d="M2 8 10 3l8 5M4 8v9m12-9v9M2 17h16M8 17v-5h4v5" /> },
]

function AudienceTile({ label, icon, className }: { label: string; icon: ReactNode; className: string }) {
  return (
    <div className={`relative z-10 flex flex-col items-center justify-center gap-3 p-4 ${className}`}>
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1" className="size-6 sm:size-7">
        {icon}
      </svg>
      <span className="text-center text-[11px] uppercase tracking-wider sm:text-xs">{label}</span>
    </div>
  )
}

function MosaicImage({ src, className }: { src: string; className: string }) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <img src={src} alt="" aria-hidden="true" className="size-full object-cover" loading="lazy" decoding="async" />
    </div>
  )
}

function HeroSection() {
  return (
    <section className="bg-foreground text-background">
      <div className="container pt-28 pb-16 md:pt-36 md:pb-24">
        <p className="flex items-center gap-2 text-sm">
          <span className="size-2.5 rounded-full bg-current" />
          About
        </p>
        <h1 className="mt-6 max-w-[16em] text-balance text-heading-responsive-lg">
          Oxy builds practical alternatives to systems that exploit people
        </h1>
        <Button variant="primary" size="md" responsive href="/company/careers" className="mt-8">
          Explore careers
        </Button>

        {/* One grid for the mosaic, so the tiles hold their proportions at every
            width: four rows on a phone, three columns of twelve from `md`. */}
        <div className="mt-14 grid aspect-[4/5] grid-cols-4 grid-rows-4 gap-0.5 border border-background/15 md:mt-20 md:aspect-[22/9] md:grid-cols-12 md:grid-rows-3">
          <AudienceTile
            label={AUDIENCES[0].label}
            icon={AUDIENCES[0].icon}
            className="col-span-2 bg-background/10 md:col-span-3"
          />
          <MosaicImage src={`${IMG}/team-banner.jpg`} className="col-span-2 row-span-2 md:col-span-6 md:row-span-2" />
          <AudienceTile
            label={AUDIENCES[1].label}
            icon={AUDIENCES[1].icon}
            className="col-span-2 bg-background/10 md:col-span-3"
          />
          <AudienceTile
            label={AUDIENCES[2].label}
            icon={AUDIENCES[2].icon}
            className="col-span-2 bg-background/10 md:col-span-3"
          />
          <AudienceTile
            label={AUDIENCES[3].label}
            icon={AUDIENCES[3].icon}
            className="col-span-2 bg-background/10 md:col-span-3"
          />
          <MosaicImage src={`${IMG}/commons-night.webp`} className="col-span-4 md:col-span-6" />
          <MosaicImage src="/images/nav-careers-card.webp" className="col-span-4 md:col-span-6" />
        </div>
      </div>
    </section>
  )
}

function MissionSection() {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.2 })
  const { data: products = [] } = useProducts({ surface: 'products' })
  const { data: jobs = [] } = useJobs()
  const { repos } = getStaticChangelog()

  const stats = [
    { value: String(products.length || 18), label: 'Apps sharing one identity' },
    { value: String(repos.length), label: 'Repositories you can read' },
    { value: String(jobs.length), label: 'Open roles' },
    { value: '0', label: 'Ads served, ever' },
  ]

  return (
    <section ref={ref} className="container py-20 md:py-28">
      <p className="text-muted-foreground text-sm">Our mission</p>
      <h2 className="mt-4 max-w-[20em] text-balance text-heading-responsive-md">
        Software people can inspect, leave and hold to account, paid for without turning them into the product.
      </h2>

      <div className="mt-12 grid gap-8 sm:grid-cols-2 md:mt-16 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col gap-1 border-border sm:border-l sm:pl-4 md:pl-6">
            <span className="font-display text-[clamp(2.5rem,5vw,4rem)] leading-none">
              <RollingNumber value={stat.value} active={inView} />
            </span>
            <span className="text-muted-foreground text-sm">{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

/** What shipped, by year, read from the newsroom rather than written twice. */
function HistorySection() {
  const { data } = useNewsroomPosts({ limit: 20 })
  const posts = data?.posts ?? []
  if (posts.length === 0) return null

  const byYear = new Map<string, typeof posts>()
  for (const post of posts) {
    const year = new Date(post.publishedAt ?? Date.now()).getFullYear().toString()
    const bucket = byYear.get(year)
    if (bucket) bucket.push(post)
    else byYear.set(year, [post])
  }
  const years = [...byYear.entries()].sort((a, b) => Number(b[0]) - Number(a[0]))

  return (
    <section className="bg-foreground text-background">
      <div className="container py-20 md:py-28">
        <p className="text-sm opacity-70">History</p>
        <h2 className="mt-3 text-heading-responsive-md">What we have shipped</h2>

        <div className="mt-12 flex flex-col gap-12 md:mt-16">
          {years.map(([year, entries]) => (
            <div key={year} className="grid gap-6 border-background/20 border-t pt-6 md:grid-cols-12">
              <p className="font-display text-[clamp(3rem,7vw,6rem)] leading-none opacity-30 md:col-span-3">{year}</p>
              <ul className="flex flex-col gap-5 md:col-span-9">
                {entries.map((post) => (
                  <li key={post.slug} className="max-w-[60ch]">
                    <a href={`/newsroom/${post.slug}`} className="group block">
                      <p className="font-medium transition-opacity group-hover:opacity-70">{post.title}</p>
                      {post.resume && <p className="mt-1 text-sm opacity-60">{post.resume}</p>}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/**
 * A line from the charter rather than an endorsement: this page carries no
 * quote attributed to someone who did not say it.
 */
function CharterQuoteSection() {
  return (
    <section className="container py-16 md:py-24">
      <figure className="rounded-2xl bg-surface p-8 md:p-14">
        <blockquote className="max-w-[54ch] text-balance text-heading-responsive-sm">
          A trustworthy institution must limit power through its design. Decisions should be visible, contestable and
          distributed.
        </blockquote>
        <figcaption className="mt-8 text-muted-foreground text-sm">
          <a href="/company/charter" className="font-medium text-foreground hover:underline">
            The Oxy Founding Charter
          </a>
          , preamble
        </figcaption>
      </figure>
    </section>
  )
}

const MORE_LINKS = [
  { href: '/company/charter', label: 'The Oxy Founding Charter', kind: 'Document' },
  { href: '/company/manifesto', label: 'The Oxy Manifesto', kind: 'Document' },
  { href: '/company/business', label: 'How our business works', kind: 'Document' },
  { href: '/company/transparency', label: 'Transparency Center', kind: 'Document' },
  { href: '/company/team', label: 'The people building Oxy', kind: 'Team' },
  { href: '/initiative', label: 'The Oxy Initiative', kind: 'Community' },
  { href: '/newsroom', label: 'Newsroom', kind: 'Updates' },
  { href: 'https://github.com/OxyHQ', label: 'Every repository on GitHub', kind: 'Open source', external: true },
]

function MoreSection() {
  return (
    <section className="container pb-16 md:pb-24">
      <h2 className="text-heading-responsive-md">More</h2>
      <p className="mt-3 max-w-[52ch] text-muted-foreground">
        The documents this page summarises, the people behind them, and the code underneath.
      </p>
      <ul className="mt-10">
        {MORE_LINKS.map((link) => (
          <li key={link.href} className="border-border border-b first:border-t">
            <a
              href={link.href}
              {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="group flex items-center justify-between gap-4 px-1 py-5 transition-colors hover:bg-surface md:px-4"
            >
              <span className="flex flex-wrap items-baseline gap-x-3">
                <span>{link.label}</span>
                <span className="text-muted-foreground text-sm">{link.kind}</span>
              </span>
              <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1"
              >
                <path d="m12 4 6 6-6 6M2 10h16" />
              </svg>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

function CareersCtaSection() {
  return (
    <section className="container pb-20 md:pb-28">
      <div className="grid overflow-hidden rounded-2xl bg-surface md:grid-cols-2">
        <div className="flex flex-col justify-between gap-10 p-8 sm:p-10 md:p-14">
          <h2 className="max-w-[20ch] text-balance text-heading-responsive-sm">
            Help build software that answers to the people who use it.
          </h2>
          <Button variant="primary" size="md" responsive href="/company/careers" className="w-fit">
            Explore careers
          </Button>
        </div>
        <img
          src="/images/nav-careers-card.webp"
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover max-md:aspect-[2/1]"
          loading="lazy"
          decoding="async"
        />
      </div>
    </section>
  )
}

export default function CompanyPage() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <SEO title={t('company.seoTitle')} description={t('company.seoDescription')} canonicalPath="/company" />
      <Navbar />
      <main>
        <HeroSection />
        <MissionSection />
        <HistorySection />
        <CharterQuoteSection />
        <MoreSection />
        <CareersCtaSection />
      </main>
      <Footer />
    </div>
  )
}
