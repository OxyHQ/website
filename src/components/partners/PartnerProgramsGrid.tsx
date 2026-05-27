import PartnerProgramCard from './PartnerProgramCard'

/* ── Icons for the three programs ── */

function OpenSourceIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  )
}

function CommunityIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function EducationIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 10 12 5 2 10l10 5 10-5z" />
      <path d="M6 12v5c3 2 9 2 12 0v-5" />
      <path d="M22 10v6" />
    </svg>
  )
}

interface ProgramConfig {
  number: string
  label: string
  title: string
  description: string
  benefits: readonly string[]
  ctaText: string
  ctaHref: string
  iconKey: 'open-source' | 'community' | 'education'
}

const PROGRAMS: readonly ProgramConfig[] = [
  {
    number: '01',
    label: 'Open source',
    title: 'Open source partners',
    description:
      'Maintain SDKs, integrations, forks, or self-hosted deployments that extend the Oxy stack.',
    benefits: [
      'Co-marketing across Oxy channels and the changelog',
      'Direct access to API, SDK, and platform engineers',
      'Featured listings in /technologies and developer docs',
    ],
    ctaText: 'Apply as open source partner',
    ctaHref: '#become-a-partner',
    iconKey: 'open-source',
  },
  {
    number: '02',
    label: 'Community',
    title: 'Community partners',
    description:
      'Run vibrant communities on top of Oxy products and help champion privacy-first technology.',
    benefits: [
      'Community credits and infrastructure support',
      'Early access to features, betas, and launches',
      'Joint events, AMAs, and content collaborations',
    ],
    ctaText: 'Apply as community partner',
    ctaHref: '#become-a-partner',
    iconKey: 'community',
  },
  {
    number: '03',
    label: 'Education',
    title: 'Education partners',
    description:
      'Bring open-source tools and digital literacy into classrooms, workshops, and university programs.',
    benefits: [
      'Free educational licenses and Oxy AI credits',
      'Curriculum templates and instructor onboarding',
      'A direct line to our research and product teams',
    ],
    ctaText: 'Apply as education partner',
    ctaHref: '#become-a-partner',
    iconKey: 'education',
  },
]

function renderIcon(key: ProgramConfig['iconKey']) {
  switch (key) {
    case 'open-source':
      return <OpenSourceIcon />
    case 'community':
      return <CommunityIcon />
    case 'education':
      return <EducationIcon />
  }
}

export default function PartnerProgramsGrid() {
  return (
    <section id="programs" className="container scroll-mt-24">
      <div className="border-x border-border">
        <header className="grid grid-cols-12 justify-items-start pb-12 pt-25 max-xl:pb-10 max-xl:pt-20 max-lg:pt-16">
          <div className="col-[2/-2] max-w-[26em] text-pretty text-heading-responsive-sm text-start mix-blend-multiply dark:mix-blend-screen">
            <h2 className="text-pretty inline">Three ways to partner.</h2>{' '}
            <p className="text-pretty inline font-medium text-muted-foreground">
              Pick the program that matches how you build, ship, or teach.
            </p>
          </div>
        </header>

        <div className="relative grid grid-cols-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 text-border/30"
            style={{
              backgroundImage:
                'repeating-linear-gradient(125deg, transparent, transparent 6px, currentColor 6px, currentColor 7px)',
            }}
          />
          <div className="relative col-[2/-2] grid grid-cols-1 gap-px bg-border p-px sm:grid-cols-2 lg:grid-cols-3">
            {PROGRAMS.map((program) => (
              <PartnerProgramCard
                key={program.number}
                number={program.number}
                label={program.label}
                title={program.title}
                description={program.description}
                benefits={program.benefits}
                ctaText={program.ctaText}
                ctaHref={program.ctaHref}
                icon={renderIcon(program.iconKey)}
              />
            ))}
          </div>
        </div>

        <div
          aria-hidden="true"
          className="grid h-25 w-full grid-cols-12 overflow-hidden max-xl:h-20 max-lg:h-15"
        >
          <div className="col-[2/-2] flex justify-between" />
        </div>
      </div>
    </section>
  )
}
