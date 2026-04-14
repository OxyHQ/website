import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import Button from '../components/ui/Button'
import PartnersHeroSection from '../components/sections/PartnersHeroSection'
import PartnerProgramsSection from '../components/sections/PartnerProgramsSection'
import KeepUpToDateSection from '../components/sections/KeepUpToDateSection'
import { partnerLogos, getPartnerDisplayName } from '../data/partners'

const LANDING_IMG = '/images/landing'

/**
 * Why-partner pillars shown above the program grid. Static copy so the page
 * can render without a server round-trip.
 */
const PARTNER_PILLARS = [
  {
    title: 'Open by default',
    description:
      'Every Oxy product ships with open-source code, public APIs, and self-host instructions. Build on top without lock-in.',
  },
  {
    title: 'Privacy is the spec',
    description:
      'No surveillance, no data brokering. Your users — and theirs — own their data, and you can prove it line by line.',
  },
  {
    title: 'A real ecosystem',
    description:
      'Plug into Mention, Inbox, Oxy AI, Codea, Homiio, and the rest of the stack through one identity layer and one contract.',
  },
  {
    title: 'Built with people',
    description:
      'Roadmaps shaped by partners and the community, not quarterly ad targets. We ship what users actually need.',
  },
] as const

function PartnerPillarsSection() {
  return (
    <section className="container">
      <div className="border-x border-border">
        <header className="grid grid-cols-12 justify-items-start pb-15 pt-30 max-xl:pb-12 max-xl:pt-25 max-lg:pb-10 max-lg:pt-20">
          <div className="col-[2/-2] max-w-[20em] text-pretty text-heading-responsive-sm text-start mix-blend-multiply dark:mix-blend-screen">
            <h2 className="text-pretty inline">Why partner with Oxy.</h2>{' '}
            <p className="text-pretty inline font-medium text-muted-foreground">
              The four things every Oxy partner gets, regardless of which
              program they join.
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
          <div className="relative col-[2/-2] grid grid-cols-1 gap-px bg-border p-px sm:grid-cols-2 lg:grid-cols-4">
            {PARTNER_PILLARS.map((pillar) => (
              <div key={pillar.title} className="bg-background p-8 lg:p-10">
                <h3 className="text-lg font-medium text-foreground">
                  {pillar.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {pillar.description}
                </p>
              </div>
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

function PartnerLogosSection() {
  return (
    <section className="container">
      <div className="border-x border-border">
        <header className="grid grid-cols-12 justify-items-start pb-15 pt-30 max-xl:pb-12 max-xl:pt-25 max-lg:pb-10 max-lg:pt-20">
          <div className="col-[2/-2] max-w-[24em] text-pretty text-heading-responsive-sm text-start mix-blend-multiply dark:mix-blend-screen">
            <h2 className="text-pretty inline">Trusted by teams everywhere.</h2>{' '}
            <p className="text-pretty inline font-medium text-muted-foreground">
              From early-stage startups to listed companies, partners use Oxy
              to ship products their users can actually trust.
            </p>
          </div>
        </header>

        <div className="grid grid-cols-12">
          <div className="col-[2/-2] grid grid-cols-2 gap-px bg-border p-px sm:grid-cols-3 lg:grid-cols-6">
            {partnerLogos.map((logo) => {
              const displayName = getPartnerDisplayName(logo)
              return (
                <div
                  key={logo}
                  className="flex h-28 items-center justify-center bg-background px-6 max-lg:h-24"
                >
                  <img
                    src={`${LANDING_IMG}/${logo}.svg`}
                    alt={`${displayName} logo`}
                    width={224}
                    height={90}
                    loading="lazy"
                    decoding="async"
                    className="h-auto max-h-12 w-full max-w-[160px] object-contain dark:invert"
                  />
                </div>
              )
            })}
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

function BecomeAPartnerSection() {
  return (
    <section id="become-a-partner" className="container scroll-mt-24">
      <div className="relative isolate border-x border-border">
        {/* Dot pattern background */}
        <svg
          width="100%"
          height="100%"
          aria-hidden="true"
          className="mask-t-to-50% absolute inset-0 text-muted"
        >
          <defs>
            <pattern
              id="become-a-partner-dots"
              width="10"
              height="10"
              patternUnits="userSpaceOnUse"
            >
              <rect x="5.5" y="5.5" width="1" height="1" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#become-a-partner-dots)" />
        </svg>

        <div className="relative z-10 grid grid-cols-12">
          <div className="col-[2/-2] flex flex-col items-center pb-25 pt-25 text-center max-xl:pb-20 max-xl:pt-20 max-lg:pb-16 max-lg:pt-16">
            <p className="mb-6 inline-block w-fit rounded-[13px] border border-border bg-background px-3 py-1.5 text-[13px]/[1.4em] font-medium text-foreground">
              Become a partner
            </p>
            <h2 className="max-w-[18em] text-balance text-heading-responsive-md">
              Tell us what you want to build, and we&rsquo;ll help you ship it.
            </h2>
            <p className="mt-4 max-w-xl text-balance text-lg text-muted-foreground lg:text-xl">
              Whether you&rsquo;re a developer, a community organizer, or an
              educator — start a conversation with the Oxy team and we&rsquo;ll
              walk you through the program that fits.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Button variant="primary" size="md" responsive href="/company">
                Talk to the team
              </Button>
              <Button variant="outline" size="md" responsive href="/company/careers">
                Join the team instead
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function PartnersPage() {
  return (
    <div className="flex min-h-screen max-w-screen flex-col justify-between overflow-x-clip bg-background">
      <SEO
        title="Partners"
        description="Join the Oxy partner ecosystem. Programs for developers, communities, and educators to build, integrate, and grow on the open-source Oxy stack."
        canonicalPath="/partners"
      />
      <Navbar />
      <main>
        <PartnersHeroSection />
        <PartnerProgramsSection />
        <PartnerPillarsSection />
        <PartnerLogosSection />
        <BecomeAPartnerSection />
        <KeepUpToDateSection />
      </main>
      <Footer />
    </div>
  )
}
