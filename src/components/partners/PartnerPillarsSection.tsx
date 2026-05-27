/**
 * "Why partner with Oxy" pillars — the four constants every Oxy partner
 * gets regardless of program. Static copy so the section renders without a
 * server round-trip.
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

export default function PartnerPillarsSection() {
  return (
    <section className="container">
      <div className="border-x border-border">
        <header className="grid grid-cols-12 justify-items-start pb-12 pt-25 max-xl:pb-10 max-xl:pt-20 max-lg:pt-16">
          <div className="col-[2/-2] max-w-[24em] text-pretty text-heading-responsive-sm text-start mix-blend-multiply dark:mix-blend-screen">
            <h2 className="text-pretty inline">Why partner with Oxy.</h2>{' '}
            <p className="text-pretty inline font-medium text-muted-foreground">
              The four things every Oxy partner gets, regardless of program.
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
                <h3 className="text-lg font-medium text-foreground">{pillar.title}</h3>
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
