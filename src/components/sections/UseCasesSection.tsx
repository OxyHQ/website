import { useState } from 'react'
import { useCases } from '../../data/content'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import Container from '../layout/Container'
import DotPattern from '../ui/DotPattern'

export default function UseCasesSection() {
  const [activeTab, setActiveTab] = useState(0)
  const ref = useScrollReveal()

  return (
    <section className="bg-primary-background">
      <Container>
        <div className="border-x border-subtle-stroke">
          {/* Top grid decoration */}
          <div aria-hidden="true" className="grid h-8 w-full grid-cols-12 overflow-hidden">
            <div className="col-[2/-2] flex justify-between">
              <svg width="1" height="100%" className="text-subtle-stroke">
                <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
              </svg>
              <svg width="1" height="100%" className="text-subtle-stroke">
                <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeLinecap="round" />
              </svg>
              <svg width="1" height="100%" className="text-subtle-stroke">
                <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Horizontal line */}
          <svg width="100%" height="1" className="text-subtle-stroke">
            <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="currentColor" strokeLinecap="round" />
          </svg>

          {/* Header area */}
          <div ref={ref} className="relative grid grid-cols-12">
            {/* Left dashed border */}
            <div aria-hidden="true" className="absolute top-0 bottom-0 max-lg:hidden" style={{ left: 'calc(100% / 12)' }}>
              <svg width="1" height="100%" className="text-subtle-stroke">
                <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
              </svg>
            </div>

            {/* Right dashed border */}
            <div aria-hidden="true" className="absolute top-0 bottom-0 max-lg:hidden" style={{ left: 'calc(11 * 100% / 12)' }}>
              <svg width="1" height="100%" className="text-subtle-stroke">
                <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
              </svg>
            </div>

            <div className="col-[2/-2] flex flex-col items-center py-20 lg:py-32">
              <h2 className="text-heading-responsive-sm text-balance text-center text-primary-foreground scroll-reveal">
                Intelligence built for how you work and what you do.
              </h2>

              {/* Tabs */}
              <div className="mt-12 flex items-center gap-1 scroll-reveal" style={{ transitionDelay: '150ms' }}>
                {useCases.map((uc, i) => (
                  <button
                    key={uc.role}
                    onClick={() => setActiveTab(i)}
                    className={`cursor-pointer rounded-[10px] border px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                      activeTab === i
                        ? 'border-blue-400/40 bg-surface-subtle text-primary-foreground'
                        : 'border-transparent text-tertiary-foreground hover:text-secondary-foreground'
                    }`}
                  >
                    {uc.role}
                  </button>
                ))}
              </div>

              {/* Use case items */}
              <div className="mt-10 grid w-full grid-cols-1 gap-4 md:grid-cols-2 scroll-reveal" style={{ transitionDelay: '300ms' }}>
                {useCases[activeTab].items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-xl border border-subtle-stroke bg-secondary-background p-5"
                  >
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-xs font-semibold text-blue-400">
                      {i + 1}
                    </div>
                    <p className="text-sm leading-relaxed text-secondary-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Dot pattern with gradient fade */}
          <div className="relative h-40 overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                maskImage: 'linear-gradient(to bottom, black 50%, transparent 85%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 85%)',
              }}
            >
              <DotPattern id="use-cases-dots" />
            </div>
            <div
              className="absolute inset-0 bg-gradient-to-b from-primary-background to-secondary-background"
              style={{ opacity: 0.6 }}
            />
          </div>
        </div>
      </Container>
    </section>
  )
}
