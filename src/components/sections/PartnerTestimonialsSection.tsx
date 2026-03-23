import { useState, useCallback } from 'react'
import { partnerTestimonials } from '../../data/content'
import { HorizontalLine } from '../ui/GridDecoration'

/** Word-by-word animated quote */
function AnimatedQuote({ text, active }: { text: string; active: boolean }) {
  const words = text.split(' ')
  return (
    <p className="relative w-full text-pretty text-quote max-xl:text-quote-sm">
      <span className="inline-flex overflow-clip">
        <span
          className="will-change-transform transition-all duration-500 ease-out"
          style={{
            opacity: active ? 1 : 0,
            transform: active ? 'translateY(0)' : 'translateY(8px)',
          }}
        >
          &ldquo;
        </span>
      </span>
      {words.map((word, i) => (
        <span key={i} className="inline-flex overflow-clip">
          <span
            className="will-change-transform transition-all duration-500 ease-out"
            style={{
              opacity: active ? 1 : 0,
              transform: active ? 'translateY(0)' : 'translateY(8px)',
              transitionDelay: active ? `${(i + 1) * 20}ms` : '0ms',
            }}
          >
            {word}
          </span>
          &nbsp;
        </span>
      ))}
    </p>
  )
}

/** Expand/collapse icon for mobile accordion */
function ExpandIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg width="19.2" height="12" strokeWidth="1.5" stroke="currentColor">
      <line x1="0" y1="0.75" x2="20%" y2="0.75" />
      <line x1="0.75" y1="0" x2="0.75" y2="100%" />
      <line x1="0" y1="11.25" x2="20%" y2="11.25" />
      <line x1="6" y1="50%" x2="13.2" y2="50%" />
      <line
        x1="50%"
        y1="2.4"
        x2="50%"
        y2="9.6"
        className="origin-center transition-transform duration-400 ease-in-out"
        style={{ transform: expanded ? 'scaleY(0)' : 'scaleY(1)' }}
      />
      <line x1="80%" y1="0.75" x2="100%" y2="0.75" />
      <line x1="18.45" y1="0" x2="18.45" y2="100%" />
      <line x1="80%" y1="11.25" x2="100%" y2="11.25" />
    </svg>
  )
}

function FeatureIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="size-4.5">
      <rect x="2" y="2" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
      <path d="M6 9l2 2 4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
    </svg>
  )
}


export default function PartnerTestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(2)

  const handleClick = useCallback((index: number) => {
    setActiveIndex(index)
  }, [])

  return (
    <>
      <HorizontalLine className="w-full text-border" />

      <div className="bg-surface">
        <div className="mx-auto w-full max-w-[1200px] px-6">
          <div className="border-x border-border">

            {/* ── Desktop layout ── */}
            <div className="grid overflow-hidden max-lg:hidden" style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}>
              {partnerTestimonials.map((partner, index) => {
                const isActive = index === activeIndex
                return (
                  <div
                    key={partner.name}
                    className="group relative w-full cursor-pointer overflow-hidden transition-all duration-500 ease-in-out"
                    style={{
                      gridColumn: isActive ? 'span 18' : 'span 3',
                      backgroundColor: isActive
                        ? 'var(--color-background)'
                        : 'var(--color-surface)',
                    }}
                    onClick={() => handleClick(index)}
                  >
                    <div className="relative grid w-full grid-cols-10 grid-rows-[36px_300px_52px] items-center overflow-hidden pt-15 max-xl:grid-rows-[14px_300px_12px]">
                      {/* Portrait — always positioned, shifts col based on active */}
                      <div
                        className="absolute inset-0 flex items-center justify-center transition-all duration-500 ease-in-out"
                        style={{
                          gridColumn: isActive ? '1 / 4' : '1 / -1',
                          gridRow: '2 / 2',
                        }}
                      >
                        <div className="flex items-center justify-center">
                          <img
                            alt={partner.name}
                            loading="lazy"
                            width="900"
                            height="1100"
                            decoding="async"
                            className="max-h-60 min-h-full min-w-full max-w-60 object-contain transition-transform duration-400 ease-in-out group-hover:scale-[1.01] group-hover:duration-150 max-xl:max-h-50 max-xl:max-w-50"
                            src={partner.image}
                          />
                        </div>
                      </div>

                      {/* Partner type label — only visible when active */}
                      <h2
                        className="col-[4/-1] w-fit shrink-0 whitespace-nowrap text-overline transition-[filter,opacity] duration-400 ease-out"
                        style={{
                          filter: isActive ? 'blur(0px)' : 'blur(4px)',
                          opacity: isActive ? 1 : 0,
                        }}
                      >
                        {partner.partnerType}
                      </h2>

                      {/* Quote + author — only visible when active */}
                      <div
                        className="col-[4/-2] flex w-146 flex-col gap-7 max-xl:w-113 transition-[filter,opacity] duration-400 ease-out"
                        style={{
                          filter: isActive ? 'blur(0px)' : 'blur(4px)',
                          opacity: isActive ? 1 : 0,
                          pointerEvents: isActive ? 'auto' : 'none',
                        }}
                      >
                        <div>
                          <AnimatedQuote text={partner.quote} active={isActive} />
                        </div>
                        <p className="w-fit whitespace-nowrap text-sm">
                          <span className="font-bold">{partner.name}</span>,{' '}
                          {partner.role}
                        </p>
                      </div>

                      {/* Favorite features row — only visible when active on xl+ */}
                      {partner.favoriteFeatures && (
                        <div
                          className="contents max-xl:hidden"
                          style={{
                            pointerEvents: isActive ? 'auto' : 'none',
                          }}
                        >
                          <svg
                            width="100%"
                            height="1"
                            className="absolute inset-x-0 top-0 col-[1/-1] row-[3/3] text-border transition-[filter,opacity] duration-400 ease-out"
                            style={{
                              filter: isActive ? 'blur(0px)' : 'blur(4px)',
                              opacity: isActive ? 1 : 0,
                            }}
                          >
                            <line
                              x1="0" y1="0.5" x2="100%" y2="0.5"
                              stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round"
                            />
                          </svg>
                          <p
                            className="absolute left-1/2 top-1/2 col-[1/4] row-[3/3] flex w-fit -translate-x-1/2 -translate-y-1/2 items-center justify-evenly overflow-hidden whitespace-nowrap text-center text-sm font-semibold text-input transition-[filter,opacity] duration-400 ease-out"
                            style={{
                              filter: isActive ? 'blur(0px)' : 'blur(4px)',
                              opacity: isActive ? 1 : 0,
                            }}
                          >
                            {partner.name.split(' ')[0]}&apos;s favorite features
                          </p>
                          <div
                            className="absolute inset-0 col-[4/-1] row-[3/3] flex w-fit items-center gap-8 transition-[filter,opacity] duration-400 ease-out"
                            style={{
                              filter: isActive ? 'blur(0px)' : 'blur(4px)',
                              opacity: isActive ? 1 : 0,
                            }}
                          >
                            {partner.favoriteFeatures.map((feature) => (
                              <div key={feature} className="flex w-fit shrink-0 items-center gap-1.5">
                                <FeatureIcon />
                                <p className="truncate text-sm text-input">{feature}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Vertical separator between items */}
                    <div
                      className={`absolute inset-y-0 left-0 -translate-x-1/2 ${index === 0 ? 'hidden' : ''}`}
                    >
                      <svg width="1" height="100%" className="h-full text-muted-foreground/20 backdrop-blur">
                        <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* ── Mobile layout ── */}
            <div className="flex flex-col items-stretch divide-y divide-border lg:hidden">
              {partnerTestimonials.map((partner, index) => {
                const isActive = index === activeIndex
                return (
                  <div
                    key={partner.name}
                    className="relative cursor-pointer overflow-hidden transition-all duration-500 ease-in-out"
                    style={{
                      backgroundColor: isActive
                        ? 'var(--color-background)'
                        : 'var(--color-surface)',
                      maxHeight: isActive ? '600px' : '60px',
                    }}
                    onClick={() => handleClick(index)}
                  >
                    <div className="grid w-full grid-cols-12">
                      {/* Content */}
                      <div className="col-[2/-2] flex w-full flex-col gap-y-6 pt-9">
                        {/* Portrait placeholder */}
                        <div
                          className="flex w-30 items-center justify-center transition-[filter,opacity] duration-500 ease-out"
                          style={{
                            filter: isActive ? 'blur(0px)' : 'blur(1px)',
                            opacity: isActive ? 1 : 0,
                          }}
                        >
                          <img
                            alt={partner.name}
                            loading="lazy"
                            width="900"
                            height="1100"
                            decoding="async"
                            className="size-full object-contain"
                            src={partner.image}
                          />
                        </div>

                        {/* Quote + name */}
                        <div className="relative flex w-full flex-col overflow-hidden pb-20">
                          <div className="flex w-full flex-col gap-6">
                            <AnimatedQuote text={partner.quote} active={isActive} />
                            <p
                              className="truncate text-sm text-foreground transition-[filter,opacity] duration-500 ease-out"
                              style={{
                                filter: isActive ? 'blur(0px)' : 'blur(1px)',
                                opacity: isActive ? 1 : 0,
                              }}
                            >
                              <span className="font-bold">{partner.name}</span>,{' '}
                              {partner.role}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom bar with label + expand icon */}
                    <div className="absolute inset-x-0 bottom-0 grid h-15 w-full grid-cols-12 items-center text-overline">
                      <div className="col-[2/-2] flex w-full items-center justify-between transition-colors duration-400 ease-in-out hover:text-foreground hover:duration-150">
                        <p>{partner.partnerType}</p>
                        <ExpandIcon expanded={isActive} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
