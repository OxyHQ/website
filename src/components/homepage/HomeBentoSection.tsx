import { Link } from 'react-router-dom'
import { bentoCards } from '../../data/homepage'
import { useScrollReveal } from '../../hooks/useScrollReveal'

export default function HomeBentoSection() {
  const sectionRef = useScrollReveal()

  return (
    <section
      id="home-bento"
      ref={sectionRef}
      className="flex w-full max-w-screen flex-col items-center justify-center overflow-x-clip"
    >
      <div className="relative flex w-full max-w-full flex-col items-center lg:px-6">
        <div className="relative flex w-full max-w-[1392px] flex-col">
          {/* Section label header — desktop only */}
          <div className="hidden lg:block pt-[60px]">
            <div className="flex items-center justify-between px-5 text-overline">
              <h2 className="flex gap-x-[6px]">
                <span>[01]</span>
                <span className="text-muted-foreground">Powerful platform</span>
              </h2>
              <span>/ item 1 ⋮ 4</span>
            </div>
            {/* Dashed separator line */}
            <svg
              width="100%"
              height="1"
              className="text-border mt-5 h-px w-full"
            >
              <line
                x1="0"
                y1="0.5"
                x2="100%"
                y2="0.5"
                stroke="currentColor"
                strokeDasharray="4 6"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Intro text */}
          <div className="container relative w-full lg:grid lg:grid-cols-12 lg:gap-x-6 lg:px-0">
            <div className="col-span-10 col-start-2 max-w-[28em] text-balance pt-20 pb-16 text-heading-sm lg:pt-[120px]">
              <h3 className="inline">
                <span className="font-semibold text-foreground">
                  GTM at full speed.
                </span>
              </h3>
            </div>
          </div>

          {/* Bento grid of 4 cards */}
          <div className="container w-full lg:grid lg:grid-cols-12 lg:gap-x-6 lg:px-0 relative">
            {/* Top dashed separator */}
            <svg
              width="100%"
              height="1"
              className="text-border absolute top-0 left-1/2 w-screen -translate-x-1/2 lg:inset-x-0 lg:w-full lg:translate-x-0"
            >
              <line
                x1="0"
                y1="0.5"
                x2="100%"
                y2="0.5"
                stroke="currentColor"
                strokeDasharray="4 6"
                strokeLinecap="round"
              />
            </svg>

            {/* Grid container — 2x2 bento layout */}
            <div
              className="relative grid w-full gap-px bg-border p-px pb-0 col-span-10 col-start-2"
              style={{
                gridTemplateColumns: 'repeat(2, 1fr)',
                gridTemplateRows: 'auto auto',
              }}
            >
              {bentoCards.map((card, i) => (
                <div
                  key={i}
                  className="scroll-reveal flex w-full flex-col items-start bg-background px-[30px] pt-[30px] pb-[22px] lg:px-[36px] lg:pt-[32px] lg:pb-[24px]"
                >
                  <h2 className="mb-[8px] font-display font-semibold! text-lg xl:py-[2px] xl:text-xl">
                    {card.title}
                  </h2>
                  <p className="mb-[12px] text-muted-foreground">
                    {card.description}
                  </p>
                  {card.href.startsWith('/') ? (
                    <Link
                      to={card.href}
                      className="button-ghost group mt-auto -ml-3.5 inline-flex h-10 cursor-pointer items-center gap-x-2 rounded-xl border border-transparent px-3.25 text-base transition-colors duration-300"
                    >
                      <span>{card.cta}</span>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="transition-[translate] duration-400 ease-in-out group-hover:translate-x-0.25 group-hover:duration-150">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.1" d="M2.25 7h9.5m0 0L8.357 3.5M11.75 7l-3.393 3.5" />
                      </svg>
                    </Link>
                  ) : (
                    <a
                      href={card.href}
                      className="button-ghost group mt-auto -ml-3.5 inline-flex h-10 cursor-pointer items-center gap-x-2 rounded-xl border border-transparent px-3.25 text-base transition-colors duration-300"
                    >
                      <span>{card.cta}</span>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="transition-[translate] duration-400 ease-in-out group-hover:translate-x-0.25 group-hover:duration-150">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.1" d="M2.25 7h9.5m0 0L8.357 3.5M11.75 7l-3.393 3.5" />
                      </svg>
                    </a>
                  )}

                  {/* Product mockup placeholder */}
                  <div className="mt-6 w-full aspect-video rounded-lg bg-gradient-to-br from-surface to-border border border-border overflow-hidden">
                    <img
                      src={`/placeholder-bento-${i + 1}.png`}
                      alt={card.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
