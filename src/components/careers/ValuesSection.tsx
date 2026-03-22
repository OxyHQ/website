import { values } from '../../data/careers'
import { useScrollReveal } from '../../hooks/useScrollReveal'

export default function ValuesSection() {
  const ref = useScrollReveal()

  return (
    <section className="container">
      <div className="border-subtle-stroke border-x">
        {/* Left-aligned header */}
        <header className="grid grid-cols-12 pt-40 pb-20 max-xl:pt-30 max-xl:pb-16 max-lg:pt-25 max-lg:pb-15 justify-items-start">
          <div className="max-w-[20em] text-pretty text-heading-responsive-sm text-start col-[2/-2] mix-blend-multiply dark:mix-blend-screen">
            <h2 className="text-pretty inline">Our values.</h2>{' '}
            <p className="inline text-pretty font-medium text-black-800">
              To build for the next era of companies, we stand by our core principles in everything we do — from the features we ship to how we show up every day.
            </p>
          </div>
        </header>

        {/* Decoration: 3 dashed vertical lines */}
        <div className="grid w-full grid-cols-12 overflow-hidden h-5">
          <div className="col-[2/-2] flex justify-between">
            <svg width="1" height="100%" className="text-subtle-stroke">
              <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
            </svg>
            <svg width="1" height="100%" className="text-subtle-stroke">
              <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
            </svg>
            <svg width="1" height="100%" className="text-subtle-stroke">
              <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Value cards grid */}
        <div ref={ref} className="relative grid grid-cols-12">
          {/* Horizontal dashed separators */}
          <div className="absolute inset-0 flex flex-col justify-between">
            {[0, 1, 2].map(i => (
              <svg key={i} width="100%" height="1" className="text-subtle-stroke">
                <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
              </svg>
            ))}
          </div>

          <div className="col-[2/-2] grid gap-px md:grid-cols-2 lg:grid-cols-3">
            {values.map((value, i) => (
              <div key={i} className="relative flex flex-col gap-2 bg-primary-background p-8 scroll-reveal" style={{ transitionDelay: `${i * 80}ms` }}>
                <h3 className="font-display font-semibold text-lg text-primary-foreground">{value.title}</h3>
                <p className="text-sm text-accent-foreground leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="h-20" />
      </div>
    </section>
  )
}
