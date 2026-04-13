import { pillarsSection } from '../../data/initiative'

export default function PillarsSection() {
  return (
    <section className="container">
      <div className="border-x border-border">
        <header className="grid grid-cols-12 justify-items-start pt-40 pb-20 max-xl:pt-30 max-xl:pb-16 max-lg:pt-25 max-lg:pb-15">
          <div className="col-[2/-2] max-w-[20em] text-pretty text-heading-responsive-sm text-start mix-blend-multiply dark:mix-blend-screen">
            <h2 className="inline text-pretty">{pillarsSection.heading}</h2>{' '}
            <p className="inline text-pretty font-medium text-muted-foreground">
              {pillarsSection.subtitle}
            </p>
          </div>
        </header>

        {/* 3 dashed vertical lines decoration */}
        <div className="grid h-5 w-full grid-cols-12 overflow-hidden">
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

        {/* Pillar cards grid with diagonal stripe background */}
        <div className="relative grid grid-cols-12">
          <div className="absolute inset-0 flex flex-col justify-between">
            <svg width="100%" height="1" className="text-border">
              <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
            </svg>
            <div
              className="absolute inset-0 size-full text-surface"
              style={{ backgroundImage: 'repeating-linear-gradient(125deg, transparent, transparent 6px, currentColor 6px, currentColor 7px)' }}
            />
            <svg width="100%" height="1" className="text-border">
              <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
            </svg>
          </div>

          <div className="relative col-[2/-2] grid grid-cols-2 gap-px bg-border p-px max-lg:grid-cols-1">
            {pillarsSection.pillars.map((pillar, i) => (
              <div
                key={i}
                className="grid h-fit grid-cols-12 items-center justify-items-center gap-y-4 bg-background pt-4 pb-8 md:h-48 md:grid-cols-[max-content_1fr] md:gap-0 md:py-0 xl:h-52"
              >
                {/* Left: decorative grid pattern with emoji */}
                <div className="relative col-[2/6] flex aspect-square size-full items-center justify-center overflow-hidden md:col-1 md:aspect-[146/216] md:w-auto">
                  <div className="absolute inset-0 grid grid-cols-4 gap-px bg-muted pr-px max-md:hidden">
                    {Array.from({ length: 24 }).map((_, j) => (
                      <div key={j} className="size-full bg-background" />
                    ))}
                  </div>
                  <span className="relative z-10 text-2xl md:text-3xl">{pillar.emoji}</span>
                </div>
                {/* Right: text content */}
                <div className="col-[2/-2] flex flex-col gap-y-1.5 md:col-2 md:grid md:grid-cols-12 md:gap-y-2 lg:gap-y-1.5 xl:gap-y-2">
                  <p className="text-overline md:col-[2/-2]">{pillar.number} / {pillar.label}</p>
                  <h3 className="text-base font-semibold! md:col-[2/-2] md:text-lg lg:text-base xl:text-lg">{pillar.title}</h3>
                  <p className="text-pretty text-sm text-muted-foreground md:col-[2/-2] md:text-base lg:text-sm xl:text-base">{pillar.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom dashed vertical lines */}
        <div className="grid h-21 w-full grid-cols-12 overflow-hidden md:h-40">
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
      </div>
    </section>
  )
}
