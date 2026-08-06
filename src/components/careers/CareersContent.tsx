import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useInView, useReducedMotion, useScroll, useTransform, motion, type MotionValue } from 'framer-motion'
import { useJobs, useProducts } from '../../api/hooks'
import { getStaticChangelog } from '../../content/changelog-loader'
import RollingNumber from '../ui/RollingNumber'
import Button from '../ui/Button'
import JobBoard, { type JobListing } from '../slices/JobBoard'

/* ──────────────────────────────────────────────
 * /company/careers
 *
 * Hero, the figures, what we hold ourselves to, what we believe, how we work,
 * where we are, and every open role grouped by department.
 *
 * The values and beliefs are the Founding Charter's own words rather than copy
 * written for a careers page, and the figures count records the site already
 * publishes. What this page deliberately does not carry is a benefits list with
 * numbers on it: the charter commits to fair pay, rest and long-term stability,
 * and anything more specific would be an employment claim nobody has published.
 * ──────────────────────────────────────────── */

/** A dot-prefixed eyebrow, the template's marker for the start of a block. */
function Eyebrow({ children, className = '' }: { children: string; className?: string }) {
  return (
    <div
      className={`flex items-center before:mr-2 before:inline-block before:size-3 before:shrink-0 before:rounded-full before:bg-current ${className}`}
    >
      <div className="shrink-0">{children}</div>
    </div>
  )
}

/** Full-bleed band whose image drifts against the scroll. */
function ImageBand({ src, alt, bleed = false }: { src: string; alt: string; bleed?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['0px', '-120px'])

  // `bleed` drops the site frame so the photo runs the full width of the
  // window instead of stopping at the 110rem measure.
  return (
    <div className={bleed ? 'w-full' : 'mx-auto w-full max-w-(--layout-max-width)'}>
      <div ref={ref} className="relative overflow-hidden pt-[100vw] sm:pt-[35vw] xl:pt-[590px]">
        <motion.div className="absolute left-0 top-0 size-full" style={reduceMotion ? undefined : { y }}>
          <img
            src={src}
            alt={alt}
            className="absolute left-0 top-0 min-h-[calc(100%+120px)] w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </motion.div>
      </div>
    </div>
  )
}

function StatsSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.3 })
  const { data: jobs = [] } = useJobs()
  const { data: products = [] } = useProducts({ surface: 'products' })
  const { repos } = getStaticChangelog()

  const stats = [
    { value: String(jobs.length), label: 'Open roles' },
    { value: String(products.length || 18), label: 'Apps you could work on' },
    { value: String(repos.length), label: 'Repositories in the open' },
  ]

  return (
    <div>
      <div className="container py-20">
        <div ref={ref} className="flex w-full flex-col gap-8 sm:flex-row">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex w-full flex-col gap-1 pr-8 sm:border-border sm:border-l sm:pl-4 md:pl-8"
            >
              <span className="block whitespace-nowrap font-display text-heading-responsive-lg">
                <RollingNumber value={stat.value} active={inView} />
              </span>
              <span className="block text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const VALUES = [
  {
    eyebrow: 'Disagreement is not disloyalty',
    lead: 'Disagreement is not disloyalty.',
    body: 'We need people who will say when something is badly designed, or when an ethical idea would create a different kind of harm. Criticism of architecture, policy or leadership is how the work gets better, not a sign that someone is on the wrong side of it.',
    className: 'bg-primary/15 text-foreground',
    top: 'top-[var(--site-header-height)]',
  },
  {
    eyebrow: 'Fix it at the root',
    lead: 'Fix it at the root.',
    body: 'No hidden abstractions, no compatibility shims accumulating in the corners, no temporary hack that outlives whoever wrote it. When the foundation is wrong we rebuild the foundation, including when that costs a week.',
    className: 'bg-surface text-foreground',
    top: 'top-[calc(var(--site-header-height)+80px)]',
  },
  {
    eyebrow: 'Ethical work does not require poverty',
    lead: 'Ethical work does not require poverty.',
    body: 'Fair pay, rest and long-term stability are part of the mission, not a reward for reaching it. An institution that needs anyone awake and watching forever has not become an institution yet.',
    className: 'bg-foreground text-background',
    top: 'top-[calc(var(--site-header-height)+160px)]',
  },
]

function ValuesSection() {
  return (
    <div>
      <div className="container py-10 md:py-20">
        <h2 className="relative block pb-1 text-heading-responsive-md">Our values</h2>
      </div>
      {VALUES.map((value, i) => (
        <div
          key={value.eyebrow}
          className={`sticky rounded-t-[40px] pb-24 pt-7 md:pb-36 ${value.top} ${value.className} ${i > 0 ? '-mt-10' : ''}`}
        >
          <div className="container">
            <div className="flex md:justify-end">
              <Eyebrow className="pb-1">{value.eyebrow}</Eyebrow>
            </div>
            <span className="block pb-6 pt-8 font-display text-[clamp(5.5rem,2.327rem+12.69vw,13.75rem)] leading-none tracking-tight md:pb-14">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="grid grid-cols-12 gap-2 sm:gap-4 md:gap-8">
              <div className="col-span-full flex flex-col gap-4 text-heading-responsive-sm lg:col-span-9">
                <p className="w-full opacity-80">
                  <span className="opacity-100">{value.lead}</span> {value.body}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

const BELIEFS = [
  {
    tab: 'Alternatives are possible',
    title: 'Alternatives are possible.',
    summary:
      'Every system that exploits people was built by someone, which means a different one can be built too. Oxy started because a twelve-year-old saw advertising, data collection and artificial restrictions and decided that was not the only way the internet could work.',
    points: [
      {
        lead: 'Build the alternative, do not just describe it.',
        body: 'Criticism is cheap. What counts is a working service people can move to.',
      },
      {
        lead: 'The mission is not a marketing layer.',
        body: 'It is the part we are trying to protect, and the reason some easy revenue is off the table.',
      },
    ],
  },
  {
    tab: 'People are never the product',
    title: 'People are never the product.',
    summary:
      'Oxy does not finance its core services by selling access to human attention, and it does not build engagement systems whose purpose is to keep people present for advertisers.',
    points: [
      {
        lead: 'No ads, no data sales, ever.',
        body: 'That constraint decides the roadmap, the pricing and which investors are welcome.',
      },
      {
        lead: 'Free must be genuinely useful.',
        body: 'Not a deceptive preview designed to create dependency before the essential parts are removed.',
      },
    ],
  },
  {
    tab: 'Power should be limited by design',
    title: 'Power should be limited by design.',
    summary:
      'A trustworthy institution limits its own power through its design. Decisions should be visible, contestable and distributed, including decisions made by the founder.',
    points: [
      {
        lead: 'Leaders inherit responsibility, not ownership.',
        body: 'Selection, removal and major powers are governed by transparent process, not by whoever got there first.',
      },
      {
        lead: 'A principle counts when breaking it is costly.',
        body: 'Protections belong in bylaws, licences, ownership structures and architecture, not only in words.',
      },
    ],
  },
  {
    tab: 'Open by default',
    title: 'Open by default.',
    summary:
      'Core code that affects the public interest is open when privacy, security and law allow. Open source is both an invitation to participate and a form of accountability.',
    points: [
      {
        lead: 'You can read what we ship.',
        body: 'Every repository, every release, every architectural decision is inspectable before you trust it.',
      },
      {
        lead: 'Leaving must always be possible.',
        body: 'Identity and data belong to the person, so staying is a choice rather than a trap.',
      },
    ],
  },
]

function BeliefsSection() {
  const [active, setActive] = useState(0)

  return (
    <div className="overflow-hidden bg-surface pb-20 text-foreground">
      <div className="container py-10 md:py-20">
        <h2 className="mb-6 text-heading-responsive-md">Our beliefs</h2>
        <p className="max-w-[60ch] text-balance text-muted-foreground">
          Beliefs are the convictions behind the work: what we think is wrong with how software is built today, and what
          has to be true of anything we put in its place.
        </p>
      </div>
      <div className="container">
        <div className="mb-6 flex flex-col rounded-3xl bg-background p-2 md:inline-flex md:flex-row md:rounded-full">
          {BELIEFS.map((belief, i) => (
            <button
              key={belief.tab}
              type="button"
              onClick={() => setActive(i)}
              aria-pressed={i === active}
              className={`relative whitespace-nowrap rounded-full px-3 py-2 text-left font-medium transition-colors duration-200 ${
                i === active ? 'text-background' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {i === active && <span className="absolute inset-0 rounded-full bg-foreground" />}
              <span className="relative z-10">{belief.tab}</span>
            </button>
          ))}
        </div>

      </div>

      {/* The track is clipped by the window, not by the frame: the slide on its
          way in comes from the page edge instead of being cut at the gutter,
          while the active one still lines up with everything above it. */}
      <div className="w-full overflow-hidden">
        <div className="layout-px-bleed">
          <div
            className="flex w-full items-stretch gap-2 transition-transform duration-500 ease-out sm:gap-4"
            style={{ transform: `translate3d(calc(${-active * 100}% - ${active}rem), 0px, 0px)` }}
          >
            {BELIEFS.map((belief, i) => (
              <div
                key={belief.tab}
                aria-hidden={i !== active}
                className="relative flex w-full shrink-0 flex-col items-start gap-5 rounded-[1.25rem] bg-background p-5 md:grid md:grid-cols-2 md:items-center md:gap-24 md:p-12"
              >
                <div className="md:py-10">
                  <h3 className="text-balance text-heading-responsive-sm text-muted-foreground">
                    <span className="text-foreground">{belief.title}</span> {belief.summary}
                  </h3>
                </div>
                <div className="h-px w-full bg-border md:absolute md:inset-y-12 md:left-1/2 md:h-auto md:w-px" />
                <div className="md:py-10">
                  <p className="mb-3 text-muted-foreground text-sm md:mb-5">What this means at Oxy</p>
                  <div className="flex flex-col gap-[1.4em] text-muted-foreground">
                    {belief.points.map((point) => (
                      <p key={point.lead} className="text-balance">
                        <span className="text-foreground">{point.lead}</span> {point.body}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container">
        <div className="flex items-center justify-center gap-8 pt-4">
          <div className="flex">
            {BELIEFS.map((belief, i) => (
              <button key={belief.tab} type="button" className="p-1" onClick={() => setActive(i)} aria-label={belief.tab}>
                <span
                  className={`block size-2 rounded-full ${i === active ? 'bg-foreground' : 'bg-border hover:bg-foreground'}`}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function HowWeWorkSection() {
  return (
    <div>
      <div className="container py-10 md:py-20">
        <h2 className="relative block pb-1 text-heading-responsive-md">How we work</h2>
      </div>
      <div className="container">
        <div className="mb-28 md:mb-30 md:grid md:h-[630px] md:grid-cols-3">
          <div className="flex w-full flex-col-reverse md:block">
            <div className="relative flex w-full flex-col justify-center px-12 py-20 md:h-1/3 md:px-14 md:py-0">
              <div className="absolute left-0 top-0 z-0 size-full bg-primary/15" />
              <div className="relative z-10">
                <span className="block">Remote, with a base in Barcelona</span>
                <p className="text-muted-foreground">
                  The work happens wherever you are. Barcelona is where the company is registered and where we meet.
                </p>
              </div>
            </div>
            <div className="relative flex w-full flex-col justify-center px-12 py-16 md:h-2/3 md:px-14 md:py-0">
              <div className="absolute left-0 top-0 z-0 size-full bg-surface" />
              <div className="relative z-10">
                <span className="block">Fair pay, rest, stability</span>
                <p className="text-muted-foreground">
                  Ethical work does not require poverty from the people doing it. Surplus funds reserves, fair
                  compensation and better infrastructure before anything else.
                </p>
              </div>
            </div>
          </div>

          <div className="w-full">
            <Link
              to="/company/charter"
              className="group relative flex flex-col justify-center px-12 py-44 md:size-full md:px-14 md:py-0"
            >
              <div className="absolute left-0 top-0 z-0 size-full bg-foreground" />
              <div className="relative z-10 text-background">
                <span className="block">The charter is the contract</span>
                <p className="text-background/70">
                  What Oxy will and will not do is written down, in public, before anyone joins. If a decision breaks it,
                  you are entitled to say so and point at the clause.
                </p>
              </div>
              <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2">
                <span className="flex size-12 items-center justify-center rounded-full bg-background/30 text-background transition-colors duration-300 group-hover:bg-background/50">
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" className="size-5">
                    <path d="m12 4 6 6-6 6M2 10h16" />
                  </svg>
                </span>
              </div>
            </Link>
          </div>

          <div className="w-full">
            <div className="relative flex w-full flex-col justify-center px-12 py-16 md:h-2/3 md:px-14 md:py-0">
              <div className="absolute left-0 top-0 z-0 size-full bg-surface" />
              <div className="relative z-10">
                <span className="block">Your work stays readable</span>
                <p className="text-muted-foreground">
                  Core code is open by default, so what you build here remains inspectable, citable and yours to point at
                  long after you have moved on.
                </p>
              </div>
            </div>
            <div className="relative flex w-full flex-col justify-center px-12 py-16 md:h-1/3 md:px-14 md:py-0">
              <div className="absolute left-0 top-0 z-0 size-full bg-primary/10" />
              <div className="relative z-10">
                <span className="block">Many ways in</span>
                <p className="text-muted-foreground">
                  Code, design, writing, translation, research, moderation, community. One mission, several doors.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Where the work happens. Barcelona is where the company is registered; the
 * rest is where people are, which is the point of a remote team. Each name
 * carries its city, so the line reads as a strip of places rather than a list.
 */
const PLACES: { name: string; image: string }[] = [
  { name: 'Barcelona', image: '/images/cities/barcelona.jpg' },
  { name: 'Berlin', image: '/images/cities/berlin.jpg' },
  { name: 'London', image: '/images/cities/london.jpg' },
  { name: 'Amsterdam', image: '/images/cities/amsterdam.jpg' },
  { name: 'Athens', image: '/images/cities/athens.jpg' },
  { name: 'Rome', image: '/images/cities/rome.jpg' },
  { name: 'Paris', image: '/images/cities/paris.jpg' },
]

function PlaceRow({ places, x }: { places: typeof PLACES; x: MotionValue<string> | undefined }) {
  // Listed twice so the row is always wider than the page and never ends
  // mid-screen while it travels.
  return (
    <motion.div style={x ? { x } : undefined} className="flex w-max items-center whitespace-nowrap">
      {[...places, ...places].map((place, i) => (
        <div
          key={`${place.name}-${i}`}
          className="flex items-center whitespace-nowrap font-display text-[clamp(3.5rem,8vw,8rem)]/[1.05] tracking-[-0.02em]"
        >
          <span className="inline-block px-3 md:px-5">{place.name}</span>
          <img
            src={place.image}
            alt=""
            aria-hidden="true"
            className="h-[1em] w-[1.15em] rounded-[20px] object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>
      ))}
    </motion.div>
  )
}

function PlacesSection() {
  const ref = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  // The two rows travel opposite ways as the section crosses the viewport, so
  // the block reads as one moving surface rather than two static lines.
  const firstRowX = useTransform(scrollYProgress, [0, 1], ['-4%', '-28%'])
  const secondRowX = useTransform(scrollYProgress, [0, 1], ['-28%', '-2%'])

  return (
    <div className="bg-surface pb-20 text-foreground md:pb-32">
      <div className="container py-10 md:py-20">
        <h2 className="relative block pb-1 text-heading-responsive-md">Where we are</h2>
      </div>
      <div ref={ref} className="flex w-full flex-col gap-2 overflow-hidden md:gap-4">
        <PlaceRow places={PLACES.filter((_, i) => i % 2 === 0)} x={reduceMotion ? undefined : firstRowX} />
        <PlaceRow places={PLACES.filter((_, i) => i % 2 === 1)} x={reduceMotion ? undefined : secondRowX} />
      </div>
    </div>
  )
}

const SPOTLIGHTS = [
  {
    href: '/technologies',
    image: '/images/nav-ecosystem-card.webp',
    title: 'Engineering at Oxy',
    body: 'One identity, one SDK and one design system underneath every app in the ecosystem. See what is already running.',
  },
  {
    href: '/company/team',
    image: '/images/nav-careers-card.webp',
    title: 'The people building Oxy',
    body: 'A small team and a wider community of contributors, artists, moderators and researchers. Meet them.',
  },
]

function SpotlightSection() {
  return (
    <div className="py-20">
      <div className="container">
        <h2 className="mb-4 text-heading-responsive-md">Team spotlight</h2>
        <p className="text-muted-foreground">Where the work happens, and who it happens with.</p>
        <div className="grid grid-rows-2 gap-8 pt-12 lg:grid-cols-2 lg:grid-rows-1">
          {SPOTLIGHTS.map((item) => (
            <Link key={item.href} to={item.href} className="w-full bg-surface sm:flex">
              <div className="aspect-square w-full shrink-0 sm:h-full sm:w-auto">
                <img
                  src={item.image}
                  alt=""
                  aria-hidden="true"
                  className="aspect-square w-full object-cover sm:w-72 md:w-80"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="flex flex-col items-start justify-between p-8">
                <div className="pb-7">
                  <h3>{item.title}</h3>
                  <p className="text-muted-foreground">{item.body}</p>
                </div>
                <Button variant="outline" size="md">
                  Learn more
                </Button>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * The open roles, on the board this page has always used: a sticky filter band
 * over rows grouped by team, each group's name pinned while its rows scroll.
 */
function OpenPositionsSection() {
  const { data: jobs, isPending } = useJobs()

  const listings = useMemo<JobListing[]>(
    () =>
      (jobs ?? [])
        .filter((job) => job.slug)
        .map((job) => ({
          title: job.title,
          team: job.department || 'Other',
          location: job.location,
          href: `/company/careers/${job.slug}`,
        })),
    [jobs],
  )

  return (
    <div id="open-positions" className="scroll-mt-[var(--site-header-height)] py-20 md:py-28">
      <JobBoard jobs={listings} isPending={isPending} emptyMessage="No open roles right now. Check back soon." />
    </div>
  )
}

export default function CareersContent() {
  return (
    <>
      <div>
        <div className="container">
          <div className="grid grid-cols-12 gap-2 pb-16 pt-28 sm:gap-4 md:gap-8 md:pb-20 md:pt-40">
            <div className="col-span-full md:col-span-9">
              <Eyebrow className="mb-1">Careers</Eyebrow>
              <h1 className="mb-10 font-display font-medium tracking-[-0.02em] text-[2.75rem]/[3rem] md:text-[3.75rem]/[3.9rem] lg:text-[4.5rem]/[4.6rem] sm:pr-10">
                Help prove that useful systems can grow without treating people as inventory
              </h1>
              <Button variant="primary" size="md" href="#open-positions">
                See open roles
              </Button>
            </div>
          </div>
        </div>
        <ImageBand src="/images/landing/team-banner.jpg" alt="The Oxy team at work" />
      </div>

      <StatsSection />
      <ValuesSection />

      <div className="bg-surface sm:pb-9 md:pb-10 xl:pb-12">
        <ImageBand src="/images/hero/hero-2.jpg" alt="Building the Oxy ecosystem" bleed />
      </div>

      <BeliefsSection />
      <HowWeWorkSection />
      <PlacesSection />
      <SpotlightSection />
      <OpenPositionsSection />
    </>
  )
}
