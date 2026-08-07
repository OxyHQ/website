import { useRef, useState } from 'react'
import { AnimatePresence, motion, useInView, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import Button from '../components/ui/Button'
import RollingNumber from '../components/ui/RollingNumber'
import { useJobs, useProducts } from '../api/hooks'
import { getStaticChangelog } from '../content/changelog-loader'
import { useTranslation } from '../lib/i18n'

/* ──────────────────────────────────────────────
 * /company
 *
 * Hero mosaic, the mission and its figures, a full-bleed band, the history
 * timeline, a quote, everything else worth reading, and the careers CTA.
 *
 * Every figure and every date comes from data the site already publishes — the
 * product records, the tracked repositories, the open roles, the newsroom — or
 * from the founder interview, so the page cannot claim something the rest of
 * the site does not.
 * ──────────────────────────────────────────── */

const IMG = '/images/landing'

/* ── Hero ──────────────────────────────────── */

/**
 * The apps, dealt out along the bottom edge like a hand of cards: each one
 * keeps its own size, tilt and stacking order, and names itself on hover.
 */
const HERO_APPS = [
  { name: 'Mention', icon: '/images/apps/mention.png', size: 100, y: -80, rotate: -8, z: 10 },
  { name: 'Alia', icon: '/images/apps/alia.svg', size: 200, y: -20, rotate: 5, z: 7 },
  { name: 'Allo', icon: '/images/apps/allo.png', size: 120, y: -25, rotate: 12, z: 20 },
  { name: 'Oxy OS', icon: '/images/apps/oxyos.png', size: 220, y: -10, rotate: -4, z: 6 },
  { name: 'Astro', icon: '/images/apps/astro.svg', size: 140, y: -10, rotate: -12, z: 3 },
  { name: 'Oxy Inbox', icon: '/images/apps/inbox.png', size: 160, y: -8, rotate: 3, z: 9 },
  { name: 'Accounts', icon: '/images/apps/accounts.png', size: 70, y: -30, rotate: 10, z: 20 },
  { name: 'Auth', icon: '/images/apps/auth.svg', size: 130, y: -3, rotate: 7, z: 5 },
  { name: 'Clarity', icon: '/images/apps/clarity.png', size: 90, y: 5, rotate: -6, z: 4 },
]

function HeroSection() {
  return (
    <section className="relative flex flex-col items-center justify-center overflow-hidden border-border border-b bg-surface pt-[var(--site-header-height)] pb-50 md:min-h-200 md:pt-0 md:pb-20">
      {/* The ruled backdrop, drawn rather than tiled so it always fills. */}
      <svg className="absolute inset-0 z-0 text-border" width="100%" height="100%" aria-hidden="true">
        <defs>
          <pattern id="company-hero-grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 80" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#company-hero-grid)" />
      </svg>

      <div className="relative mx-auto flex h-auto w-full max-w-5xl flex-col items-center gap-4 pt-20 text-center md:gap-10 md:pt-0">
        <ul className="flex w-full justify-center gap-2">
          <li className="text-muted-foreground">
            <p className="font-mono text-xs uppercase tracking-wider">About</p>
          </li>
        </ul>

        <div className="flex flex-col items-center gap-4 px-4 md:px-0">
          <h1 className="font-display text-[2.75rem]/[1.05] tracking-[-0.02em] md:text-[4rem]/[1.05] lg:text-[5rem]/[1.02]">
            It starts with
            <br />a refusal.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground md:text-xl">
            Oxy builds practical alternatives to systems that exploit people: one identity you own, no advertising, and
            code anyone can read.
          </p>
        </div>

        <div className="shrink-0">
          <Button variant="primary" size="md" href="/company/careers">
            Explore careers
          </Button>
        </div>
      </div>

      <div className="absolute -bottom-10 left-0 flex h-50 w-full items-end justify-center">
        {HERO_APPS.map((app, i) => (
          <div
            key={app.name}
            style={{
              height: app.size,
              width: app.size,
              transform: `translateY(${app.y}px) rotate(${app.rotate}deg)`,
              zIndex: app.z,
              marginLeft: i === 0 ? 0 : -10,
            }}
            className="group/app relative flex shrink-0 flex-col items-center hover:z-50!"
          >
            <p
              style={{ transform: `rotate(${-app.rotate}deg)` }}
              className="pointer-events-none absolute -top-24 w-fit scale-90 whitespace-nowrap rounded bg-background p-1 font-mono text-xs uppercase opacity-0 transition-all group-hover/app:scale-100 group-hover/app:opacity-100"
            >
              {app.name}
            </p>
            <article className="flex size-full items-center justify-center border border-border bg-background shadow-xl transition-all group-hover/app:-translate-y-10 group-hover/app:scale-110">
              <img className="block w-3/5" src={app.icon} alt="" aria-hidden="true" loading="lazy" decoding="async" />
            </article>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ── Mission ───────────────────────────────── */

function MissionSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.2 })
  const { data: products = [] } = useProducts({ surface: 'products' })
  const { data: jobs = [] } = useJobs()
  const { repos } = getStaticChangelog()

  const stats = [
    { value: '0', label: 'Ads served, ever' },
    { value: String(products.length || 18), label: 'Apps, one account' },
    { value: String(repos.length), label: 'Repositories you can read' },
    { value: String(jobs.length), label: 'Open roles' },
  ]

  return (
    <section
      id="our-mission"
      className="relative scroll-mt-[var(--site-header-height)] bg-surface text-foreground"
    >
      <div className="container py-24 md:py-32">
        <p className="font-mono text-muted-foreground text-xs uppercase tracking-wider">Our mission</p>
        <h2 className="mt-8 max-w-[16ch] font-display text-[2.25rem]/[1.1] tracking-[-0.02em] md:text-[3.5rem]/[1.05] lg:text-[4.25rem]/[1.03]">
          Software you can inspect, leave and hold to account.
        </h2>
        <p className="mt-8 max-w-[56ch] text-lg text-muted-foreground md:text-xl">
          Paid for without turning anyone into the product. That single constraint decides the architecture, the
          pricing and which money is welcome, and it is written down in the charter so breaking it is visible.
        </p>
      </div>

      {/* The figures on the same ruled grid as the hero, held on the site frame
          so they line up with the words above them. */}
      <div ref={ref} className="container grid grid-cols-2 border-border border-t md:grid-cols-4">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            // The first cell of each row keeps no left padding, so the figure
            // starts exactly where the heading above it does.
            className={`border-border px-6 py-6 max-md:odd:pl-0 md:px-10 md:py-10 md:first:pl-0 ${
              i < 2 ? 'border-b md:border-b-0' : ''
            } ${i % 2 === 0 ? 'border-r' : 'md:border-r'} ${i === 3 ? 'md:border-r-0' : ''}`}
          >
            <span className="block font-display text-[2.5rem]/[1] tracking-[-0.03em] md:text-[4rem]/[1]">
              <RollingNumber value={stat.value} active={inView} />
            </span>
            <span className="mt-3 block text-muted-foreground text-sm md:text-base">{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ── Full-bleed band ───────────────────────── */

function ImageBandSection() {
  const ref = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['0px', '-120px'])

  return (
    <section className="relative bg-surface">
      {/* No lead-in: the figures above sit straight on top of the photo. */}
      <div className="w-full pb-8 md:pb-12">
        <div className="mx-auto w-full max-w-(--layout-max-width)">
          <div ref={ref} className="relative overflow-hidden pt-[100vw] sm:pt-[35vw] xl:pt-[590px]">
            <motion.div className="absolute left-0 top-0 size-full" style={reduceMotion ? undefined : { y }}>
              <img
                src={`${IMG}/company-band.jpg`}
                alt="Two friends talking by a lake"
                // The band is nearly 3:1 and the photo is 3:2, so a centred
                // crop would take the middle third and cut both faces off the
                // top. 25% puts the window over them.
                className="absolute left-0 top-0 min-h-[calc(100%+120px)] w-full object-cover object-[center_25%]"
                loading="lazy"
                decoding="async"
              />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── History ───────────────────────────────── */

/**
 * The milestones, newest first. Every date here is documented: the early ones
 * from the founder interview, the rest from the day each repository was opened
 * in public. Nothing is dated by guesswork, which is why the axis has real gaps
 * in it: those years were spent rebuilding, not shipping.
 */
const HISTORY: { date: string; label: string; lead: string; body: string }[] = [
  {
    date: '2026-07',
    label: 'July 2026',
    lead: 'CrowdSource opens,',
    body: 'putting the collective side of the ecosystem in public: the part where a community decides what gets funded and built, rather than being told afterwards.',
  },
  {
    date: '2026-06',
    label: 'June 2026',
    lead: 'Payments and commerce arrive together,',
    body: 'with Oxy Pay and its SDK, Mercaria for sellers and Moovo, plus oxy-infra so the whole platform stops being hand-deployed and starts being reproducible.',
  },
  {
    date: '2026-05',
    label: 'May 2026',
    lead: 'The Founding Charter is written down,',
    body: 'stating what Oxy will and will not do: no advertising, no data sales, no capital with authority over the mission. It is published while the institution is still small enough for the promises to cost something.',
  },
  {
    date: '2026-04',
    label: 'April 2026',
    lead: 'Astro brings the desktop in,',
    body: 'alongside Clarity as the reference for how every app should be built, while FairCoin gets its node, wallet, core and bridge. The ecosystem stops being phone-shaped.',
  },
  {
    date: '2026-03',
    label: 'March 2026',
    lead: 'Bloom becomes the shared design system,',
    body: 'so one theme engine drives every surface, native and web. TNP lands the same month for names and DNS, and this website is rebuilt on top of both.',
  },
  {
    date: '2026-02',
    label: 'February 2026',
    lead: 'OxyOS is published,',
    body: 'a full desktop distribution with its own shell, themes, menus and packages. The stack now runs from the operating system up to the apps.',
  },
  {
    date: '2026-01',
    label: 'January 2026',
    lead: 'Alia and Codea open the AI work,',
    body: 'a multi-provider AI platform and a coding studio with its own extension, both built on the same identity as everything else rather than as separate products.',
  },
  {
    date: '2025-12',
    label: 'December 2025',
    lead: 'Syra opens for artists,',
    body: 'music inside the ecosystem instead of licensed to it, with the people who make the work holding the account that publishes it.',
  },
  {
    date: '2025-11',
    label: 'November 2025',
    lead: 'Allo brings encrypted messaging,',
    body: 'so private conversation is a first-class part of the platform and not an afterthought bolted onto a social app.',
  },
  {
    date: '2025-08',
    label: 'August 2025',
    lead: 'FairCoin becomes inspectable,',
    body: 'with a public explorer and an RPC API, so the money layer can be audited by anyone instead of taken on trust.',
  },
  {
    date: '2025-05',
    label: 'May 2025',
    lead: 'The company is registered,',
    body: 'turning years of experiments and rebuilds into something that can hold contracts, servers and accounts. This is where Oxy starts being built to last rather than rebuilt from scratch.',
  },
  {
    date: '2025-04',
    label: 'April 2025',
    lead: 'One identity for the whole ecosystem,',
    body: 'as the shared SDK opens: one account, one session, device-first, reused by every app instead of each one inventing its own login.',
  },
  {
    date: '2025-03',
    label: 'March 2025',
    lead: 'Homiio takes the work off the screen,',
    body: 'into housing, on the argument that a housing profile is not a home and software should connect to material outcomes or admit that it does not. FAIRNode opens the same month.',
  },
  {
    date: '2025-02',
    label: 'February 2025',
    lead: 'The authenticator ships,',
    body: 'making two-factor sign-in part of the platform rather than a dependency on somebody else\u2019s app.',
  },
  {
    date: '2024-12',
    label: 'December 2024',
    lead: 'Mention opens the first social surface,',
    body: 'built on the shared identity rather than beside it, and federated from the start so the network is not a walled garden with a nicer paint job.',
  },
  {
    date: '2024-04',
    label: 'April 2024',
    lead: 'The website gets its own backend,',
    body: 'so what is being built becomes something anyone can read, on infrastructure that belongs to the project.',
  },
  {
    date: '2023-06',
    label: 'June 2023',
    lead: 'FairCoin opens its repository,',
    body: 'the first public work on an economic layer that is not owned by whoever happens to run the payment rails.',
  },
  {
    date: '2022-03',
    label: 'March 2022',
    lead: 'The money question gets its own home,',
    body: 'when the FairCoin organisation is created. If people are not the product, something has to pay for the infrastructure, and that answer has to be built too.',
  },
  {
    date: '2021-01',
    label: 'January 2021',
    lead: 'The Oxy Foundation gets an address in the open,',
    body: 'when the GitHub organisation is created. From here the work stops being private files on one machine and becomes repositories other people can inspect, fork and argue with.',
  },
  {
    date: '2016-01',
    label: '2016 to 2020',
    lead: 'The years that broke and got rebuilt,',
    body: 'server migrations that nearly lost everything, systems that failed after months of work, whole foundations replaced because they were wrong. There were points where leaving looked reasonable. The infrastructure underneath Oxy was learned here, the hard way.',
  },
  {
    date: '2014-01',
    label: '2014',
    lead: 'The work starts going public,',
    body: 'with a GitHub account and the habit that follows from it: writing code other people can read, and being wrong where it can be seen.',
  },
  {
    date: '2012-01',
    label: '2012 to 2013',
    lead: 'DumDarac becomes Kaana,',
    body: 'and one early version reaches about a thousand people. That was exciting and it exposed everything weak: servers that did not cope, parts that broke, work that looked finished and was not ready.',
  },
  {
    date: '2011-01',
    label: '2011',
    lead: 'A twelve-year-old opens Facebook and refuses it,',
    body: 'and starts building a social network instead. DumDarac, written in PHP found across the web, rebuilt every time it broke. After the Kaana domain was lost the project became Oxy: a name taken from oxygen.',
  },
]

/** Fractional year, so several milestones inside one year keep their order. */
function timeOf(date: string): number {
  const [year, month] = date.split('-').map(Number)
  return year + (month - 1) / 12
}

function HistorySection() {
  const [{ active, direction }, setState] = useState({ active: 0, direction: 1 })
  const stripRef = useRef<HTMLDivElement>(null)
  const yearRefs = useRef(new Map<string, HTMLButtonElement>())

  const entries = HISTORY
  const last = entries.length - 1
  const min = timeOf(entries[last].date)
  const span = timeOf(entries[0].date) - min

  // The strip shows each year once; picking one jumps to its first milestone.
  const years = entries.map((entry, index) => ({ year: entry.date.slice(0, 4), index }))
  const yearStrip = years.filter((item, i) => i === 0 || years[i - 1].year !== item.year)
  const activeEntry = entries[active]
  const activeYear = activeEntry.date.slice(0, 4)

  /** Move to a milestone and bring its year to the front of the strip. */
  const select = (index: number) => {
    const next = Math.min(last, Math.max(0, index))
    setState((current) => ({ active: next, direction: next > current.active ? 1 : -1 }))
    const button = yearRefs.current.get(entries[next].date.slice(0, 4))
    if (button && stripRef.current) {
      stripRef.current.scrollTo({ left: button.offsetLeft, behavior: 'smooth' })
    }
  }

  return (
    <section id="history" className="relative scroll-mt-[var(--site-header-height)] bg-surface text-foreground">
      <div className="w-full">
        <div className="flex flex-col gap-0">
          <div className="container grid grid-cols-12 gap-2 py-20 sm:gap-4 md:gap-8">
            <div className="col-span-full md:col-span-9">
              <h2 className="relative block pb-6">History</h2>
              <p className="text-heading-responsive-md">Our evolution</p>
            </div>
          </div>

          {/* The years as one line: the selected one at full strength, the rest
              fading with distance from it, and the line scrolls itself so the
              selection always sits at the start. */}
          {/* The strip runs to the page edge; its first year still starts on the
              site frame, which is what `layout-px-bleed` is for. */}
          <div
            ref={stripRef}
            className="layout-px-bleed w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="flex w-max pb-8 md:pb-12">
              {yearStrip.map((item, i) => {
                const distance = Math.abs(i - yearStrip.findIndex((entry) => entry.year === activeYear))
                return (
                  <button
                    key={item.year}
                    ref={(node) => {
                      if (node) yearRefs.current.set(item.year, node)
                    }}
                    type="button"
                    onClick={() => select(item.index)}
                    className={`pr-6 font-display text-[clamp(3.5rem,9vw,8rem)]/[1] tracking-[-0.02em] transition-opacity duration-500 md:pr-10 ${
                      distance === 0
                        ? 'opacity-100'
                        : distance === 1
                          ? 'opacity-30 hover:opacity-70'
                          : distance === 2
                            ? 'opacity-20 hover:opacity-70'
                            : 'opacity-10 hover:opacity-70'
                    }`}
                  >
                    {item.year}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <div className="container">
              <div className="relative border-border border-t pt-14 pb-10">
                {/* The axis: every milestone placed by its own date, so the gaps
                    between them are the real gaps in time. */}
                <div className="absolute left-0 top-0 flex h-6 w-full -translate-y-1/2">
                  {entries.map((entry, i) => (
                    <button
                      key={entry.date}
                      type="button"
                      aria-label={entry.label}
                      onClick={() => select(i)}
                      style={{ marginRight: `${((timeOf(entry.date) - min) / span) * 100}%` }}
                      className="group absolute right-0 top-0 flex size-6 translate-x-1/2 items-center justify-center"
                    >
                      <span
                        className={`block rounded-full transition-all duration-500 ${
                          i === active ? 'size-3 bg-foreground' : 'size-2 bg-border group-hover:bg-foreground'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                {/* Only the selected milestone is mounted: it enters from the
                    side you are travelling towards and the one it replaces
                    leaves the other way. */}
                <div className="flex min-h-44 flex-col gap-8 pb-4 md:min-h-40 md:flex-row md:items-end md:justify-between md:gap-16">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={activeEntry.date}
                      initial={{ opacity: 0, x: direction * 40 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: direction * -40 }}
                      transition={{ duration: 0.4, ease: [0.65, 0, 0.35, 1] }}
                      className="flex w-full flex-col gap-4 text-muted-foreground md:max-w-xl"
                    >
                      <p className="text-muted-foreground text-xs uppercase tracking-wider">{activeEntry.label}</p>
                      <p className="w-full text-lg leading-relaxed">
                        <span className="text-foreground">{activeEntry.lead}</span> {activeEntry.body}
                      </p>
                    </motion.div>
                  </AnimatePresence>

                  <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    aria-label="Previous milestone"
                    onClick={() => select(active - 1)}
                    disabled={active === 0}
                    className="flex size-12 items-center justify-center rounded-full bg-foreground/10 transition-[opacity,background-color] duration-200 hover:bg-foreground/20 disabled:opacity-40"
                  >
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" className="size-5">
                      <path d="m8 4-6 6 6 6M18 10H2" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    aria-label="Next milestone"
                    onClick={() => select(active + 1)}
                    disabled={active === last}
                    className="flex size-12 items-center justify-center rounded-full bg-foreground/10 transition-[opacity,background-color] duration-200 hover:bg-foreground/20 disabled:opacity-40"
                  >
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" className="size-5">
                      <path d="m12 4 6 6-6 6M2 10h16" />
                    </svg>
                  </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}


/* ── Quote ─────────────────────────────────── */

/**
 * The founder in his own words, from the August 2026 interview. This page
 * carries no quote attributed to someone who did not say it.
 */
function QuoteSection() {
  return (
    <section id="quote" className="relative scroll-mt-[var(--site-header-height)] bg-surface">
      {/* Edge to edge: the portrait is the section, and only the words keep to
          the site frame. */}
      <figure className="relative flex min-h-[28rem] w-full overflow-hidden md:min-h-[38rem]">
        <img
          src={`${IMG}/founder-quote.jpg`}
          alt="Nate Isern Álvarez"
          className="absolute inset-0 size-full object-cover object-[25%_center]"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/40 to-black/10 md:bg-linear-to-l md:from-black/85 md:via-black/50 md:to-transparent" />

        <div className="container relative flex flex-1 flex-col justify-end py-10 text-white md:py-20">
          <div className="flex flex-col gap-10 md:ml-auto md:max-w-[38rem]">
            <blockquote className="font-display text-[1.75rem]/[1.15] tracking-[-0.01em] md:text-[2.75rem]/[1.1] lg:text-[3.25rem]/[1.08]">
              I built a lot of infrastructure. Now I need to build the human structure around it.
            </blockquote>
            <figcaption>
              <div className="font-bold">Nate Isern Álvarez</div>
              <div className="text-white/70">Creator and founder of Oxy</div>
            </figcaption>
          </div>
        </div>
      </figure>
    </section>
  )
}

/* ── More ──────────────────────────────────── */

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
    <section id="resources" className="relative scroll-mt-[var(--site-header-height)] bg-surface text-foreground">
      <div className="container relative grid gap-8 pt-8 md:grid-cols-12 md:pt-12">
        <div className="col-span-full min-w-0">
          <div className="flex flex-col gap-0">
            <div className="flex w-full flex-col gap-4">
              <h2 className="w-full text-heading-responsive-md">More</h2>
              <p className="w-full text-muted-foreground">
                The documents this page summarises, the people behind them, and the code underneath.
              </p>
            </div>
            <div className="block h-16 w-full" />
            <ul>
              {MORE_LINKS.map((link) => (
                <li key={link.href} className="border-border border-b first:border-t">
                  <a
                    href={link.href}
                    {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="group relative flex items-start justify-between gap-4 px-1 py-4 transition-colors duration-150 hover:bg-background md:px-4 md:py-5"
                  >
                    <div className="flex items-start">
                      <div className="flex flex-col gap-1">
                        <div className="flex flex-col-reverse px-3 sm:block md:px-5">
                          <span>{link.label}</span>
                          <span className="text-muted-foreground sm:pl-2">{link.kind}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-0.5 text-muted-foreground">
                      <svg
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                        className="size-5 transition-transform duration-150 group-hover:translate-x-1"
                      >
                        <path d="m12 4 6 6-6 6M2 10h16" />
                      </svg>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Careers CTA ───────────────────────────── */

/** The closing band: one line, one action, sitting on the brand colour. */
function CareersCtaSection() {
  return (
    <section id="footer-cta" className="relative flex flex-col">
      <div className="flex min-h-85 items-end bg-primary p-4 text-primary-foreground md:min-h-95 md:p-10 md:pb-20">
        <div className="container relative flex h-auto w-full flex-col justify-between gap-4 md:flex-row md:items-end md:gap-12">
          <div className="relative z-2 flex max-w-2xl flex-col gap-4 md:gap-6">
            <p className="font-mono text-xs uppercase tracking-wider">Ready to build the alternative?</p>
            <p className="font-display text-[2rem]/[1.1] tracking-[-0.02em] md:text-[2.75rem]/[1.08]">
              Explore the open roles, read the charter you would be working under, and see what is already running.
            </p>
          </div>

          <div className="relative z-2 flex shrink-0 flex-col items-end">
            {/* On the brand band the page's own primary would disappear, so
                both pills are stated against it: a solid one and a quiet one. */}
            <div className="flex w-full flex-col gap-3 md:flex-row">
              <Button
                variant="primary"
                size="lg"
                responsive
                href="/company/careers"
                className="border-transparent bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                Explore careers
              </Button>
              <Button
                variant="ghost"
                size="lg"
                responsive
                href="/company/charter"
                className="text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground"
              >
                Read the charter
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function CompanyPage() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-surface">
      <SEO title={t('company.seoTitle')} description={t('company.seoDescription')} canonicalPath="/company" />
      <Navbar transparent />
      <main>
        <HeroSection />
        <MissionSection />
        <ImageBandSection />
        <HistorySection />
        <QuoteSection />
        <MoreSection />
        <CareersCtaSection />
      </main>
      <Footer />
    </div>
  )
}
