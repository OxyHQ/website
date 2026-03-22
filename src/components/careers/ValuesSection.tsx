import { values } from '../../data/careers'

export default function ValuesSection() {
  return (
    <section className="container">
      <div className="border-subtle-stroke border-x">
        <header className="grid grid-cols-12 pt-40 pb-20 max-xl:pt-30 max-xl:pb-16 max-lg:pt-25 max-lg:pb-15 justify-items-start">
          <div className="max-w-[20em] text-pretty text-heading-responsive-sm text-start col-[2/-2] mix-blend-multiply dark:mix-blend-screen">
            <h2 className="text-pretty inline">Our values.</h2>{' '}
            <p className="inline text-pretty font-medium text-black-800">
              To build for the next era of companies, we stand by our core principles in everything we do — from the features we ship to how we show up every day.
            </p>
          </div>
        </header>

        {/* 3 dashed vertical lines decoration */}
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

        {/* Value cards grid with diagonal stripe background */}
        <div className="relative grid grid-cols-12">
          <div className="absolute inset-0 flex flex-col justify-between">
            <svg width="100%" height="1" className="text-subtle-stroke">
              <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
            </svg>
            <div
              className="size-full text-surface-subtle absolute inset-0"
              style={{ backgroundImage: 'repeating-linear-gradient(125deg, transparent, transparent 6px, currentColor 6px, currentColor 7px)' }}
            />
            <svg width="100%" height="1" className="text-subtle-stroke">
              <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
            </svg>
          </div>

          <div className="relative col-[2/-2] grid grid-cols-2 gap-px bg-white-500 p-px max-lg:grid-cols-1">
            {values.map((value, i) => (
              <div
                key={i}
                className="grid h-fit grid-cols-12 items-center justify-items-center gap-y-4 bg-white-100 pt-4 pb-8 md:h-48 md:grid-cols-[max-content_1fr] md:gap-0 md:py-0 xl:h-52"
              >
                {/* Left: decorative grid pattern */}
                <div className="relative col-[2/6] flex aspect-square size-full items-center justify-center overflow-hidden md:col-1 md:aspect-[146/216] md:w-auto">
                  <div className="absolute inset-0 grid grid-cols-4 gap-px bg-white-300 pr-px max-md:hidden">
                    {Array.from({ length: 24 }).map((_, j) => (
                      <div key={j} className="size-full bg-white-100" />
                    ))}
                  </div>
                  <span className="relative z-10 text-2xl md:text-3xl">{value.emoji}</span>
                </div>
                {/* Right: text content */}
                <div className="col-[2/-2] flex flex-col gap-y-1.5 md:col-2 md:grid md:grid-cols-12 md:gap-y-2 lg:gap-y-1.5 xl:gap-y-2">
                  <h3 className="font-semibold! text-base md:col-[2/-2] md:text-lg lg:text-base xl:text-lg">{value.title}</h3>
                  <p className="text-pretty text-sm text-tertiary-foreground md:col-[2/-2] md:text-base lg:text-sm xl:text-base">{value.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom dashed vertical lines */}
        <div className="grid w-full grid-cols-12 overflow-hidden h-21 md:h-40">
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
      </div>
    </section>
  )
}
