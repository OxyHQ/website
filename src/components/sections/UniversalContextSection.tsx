import { contextCards } from '../../data/content'
import { useScrollReveal } from '../../hooks/useScrollReveal'


function CardIcon({ iconType }: { iconType: string }) {
  const props = {
    width: 20,
    height: 20,
    viewBox: '0 0 20 20',
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  switch (iconType) {
    case 'database':
      return (
        <svg {...props}>
          <ellipse cx="10" cy="5" rx="6" ry="2.5" />
          <path d="M4 5v10c0 1.38 2.69 2.5 6 2.5s6-1.12 6-2.5V5" />
          <path d="M4 10c0 1.38 2.69 2.5 6 2.5s6-1.12 6-2.5" />
        </svg>
      )
    case 'brain':
      return (
        <svg {...props}>
          <path d="M10 2.5a4 4 0 0 0-4 4c0 1.2.5 2.2 1.3 3L10 17.5l2.7-8a4 4 0 0 0 1.3-3 4 4 0 0 0-4-4Z" />
          <circle cx="8.5" cy="7" r="0.75" fill="currentColor" stroke="none" />
          <circle cx="11.5" cy="7" r="0.75" fill="currentColor" stroke="none" />
          <path d="M7 9.5c.8.8 2 1.2 3 1.2s2.2-.4 3-1.2" />
        </svg>
      )
    case 'search':
      return (
        <svg {...props}>
          <circle cx="8.5" cy="8.5" r="5" />
          <path d="M12.5 12.5 17 17" />
        </svg>
      )
    case 'globe':
      return (
        <svg {...props}>
          <circle cx="10" cy="10" r="7" />
          <path d="M3 10h14" />
          <path d="M10 3c-2.5 2.5-2.5 11.5 0 14" />
          <path d="M10 3c2.5 2.5 2.5 11.5 0 14" />
        </svg>
      )
    case 'shield':
      return (
        <svg {...props}>
          <path d="M10 2 3.5 5.5v4c0 4.5 3 8 6.5 9 3.5-1 6.5-4.5 6.5-9v-4Z" />
          <path d="m7.5 10 1.75 1.75L12.5 8" />
        </svg>
      )
    default:
      return null
  }
}

function GridCard({
  title,
  subtitle,
  iconType,
}: {
  title: string
  subtitle: string
  iconType: string
}) {
  return (
    <div className="relative grid grid-cols-1 grid-rows-1 bg-primary-background">
      {/* Card content */}
      <div className="flex flex-col justify-between gap-3 p-6" style={{ gridColumn: 1, gridRow: 1 }}>
        <div className="size-5 text-primary-foreground">
          <CardIcon iconType={iconType} />
        </div>
        <div>
          <p className="text-balance text-base text-primary-foreground max-2xl:text-sm">
            {title}
            <span className="text-accent-foreground"> {subtitle}</span>
          </p>
        </div>
      </div>

      {/* Top border */}
      <svg
        width="100%"
        height="1"
        className="absolute inset-x-0 top-0 text-black-400"
        style={{ gridRow: 1 }}
      >
        <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="currentColor" strokeLinecap="round" />
      </svg>

      {/* Bottom border */}
      <svg
        width="100%"
        height="1"
        className="absolute inset-x-0 bottom-0 text-black-400"
        style={{ gridRow: 1 }}
      >
        <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="currentColor" strokeLinecap="round" />
      </svg>

      {/* Left border */}
      <svg
        width="1"
        height="100%"
        className="absolute inset-y-0 left-0 text-black-400"
        style={{ gridColumn: 1 }}
      >
        <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeLinecap="round" />
      </svg>

      {/* Right border */}
      <svg
        width="1"
        height="100%"
        className="absolute inset-y-0 right-0 text-black-400"
        style={{ gridColumn: 1 }}
      >
        <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeLinecap="round" />
      </svg>

      {/* Corner dots */}
      <div
        className="absolute top-0 left-0 size-1 -translate-x-1/2 -translate-y-1/2 bg-default-stroke"
        style={{ gridColumn: 1, gridRow: 1 }}
      />
      <div
        className="absolute bottom-0 left-0 size-1 -translate-x-1/2 translate-y-1/2 bg-default-stroke"
        style={{ gridColumn: 1, gridRow: 1 }}
      />
      <div
        className="absolute top-0 right-0 size-1 translate-x-1/2 -translate-y-1/2 bg-default-stroke"
        style={{ gridColumn: 1, gridRow: 1 }}
      />
      <div
        className="absolute right-0 bottom-0 size-1 translate-x-1/2 translate-y-1/2 bg-default-stroke"
        style={{ gridColumn: 1, gridRow: 1 }}
      />
    </div>
  )
}

export default function UniversalContextSection() {
  const ref = useScrollReveal()

  return (
    <section className="dark relative flex min-h-svh flex-col justify-center overflow-hidden bg-primary-background">
      {/* Background gradient glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[60%]" aria-hidden="true">
        <div
          className="absolute inset-x-0 top-0 h-[500px]"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(99, 132, 255, 0.08) 0%, transparent 100%)',
          }}
        />
      </div>

      <header className="relative flex flex-col gap-3 pt-92 text-center">
        <div className="container">
          <div className="grid grid-cols-12">
            <div ref={ref} className="col-[2/-2] flex flex-col items-center gap-3">
          {/* "Powered by" label */}
          <p className="text-disabled-foreground text-lg scroll-reveal">
            Powered by
          </p>

          {/* Heading */}
          <h2 className="relative w-fit text-heading-responsive-lg text-primary-foreground scroll-reveal">
            Universal Context
            <sup className="ml-0.5 text-[0.3em] font-bold tracking-tight align-super">TM</sup>
          </h2>

          {/* 5-card grid — desktop (xl+) */}
          <div
            className="mt-16 w-full max-xl:hidden scroll-reveal"
            style={{ transitionDelay: '200ms' }}
          >
            <div className="grid grid-cols-12">
              <div
                className="col-[2/-2]"
                style={{ aspectRatio: '5/1' }}
              >
                <div
                  className="grid h-full"
                  style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}
                >
                  {contextCards.map((card, i) => (
                    <GridCard
                      key={i}
                      title={card.title}
                      subtitle={card.subtitle}
                      iconType={card.iconType}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Stacked list — mobile/tablet (<xl) */}
          <div
            className="mt-16 flex w-full max-w-md flex-col gap-4 xl:hidden scroll-reveal"
            style={{ transitionDelay: '200ms' }}
          >
            {contextCards.map((card, i) => (
              <div
                key={i}
                className="flex items-start gap-4 rounded-lg border border-black-400 bg-primary-background p-5"
              >
                <div className="size-5 shrink-0 text-primary-foreground">
                  <CardIcon iconType={card.iconType} />
                </div>
                <p className="text-sm text-primary-foreground">
                  {card.title}
                  <span className="text-accent-foreground"> {card.subtitle}</span>
                </p>
              </div>
            ))}
          </div>
            </div>
          </div>
        </div>
      </header>
    </section>
  )
}
