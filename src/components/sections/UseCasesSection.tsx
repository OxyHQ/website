import { useState } from 'react'
import { useCases } from '../../data/content'
import { useScrollReveal } from '../../hooks/useScrollReveal'

export default function UseCasesSection() {
  const [activeTab, setActiveTab] = useState(0)
  const ref = useScrollReveal()

  return (
    <section className="container">
      <div className="border-subtle-stroke border-x">
        {/* Top decoration: tall grid with empty col (borders are the grid itself) */}
        <div aria-hidden="true" className="grid h-40 w-full grid-cols-12 overflow-hidden max-xl:h-30 max-lg:h-25">
          <div className="col-[2/-2] flex justify-between">
          </div>
        </div>

        {/* Horizontal separator */}
        <svg width="100%" height="1" className="text-subtle-stroke">
          <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="currentColor" strokeLinecap="round" />
        </svg>

        {/* Main content grid */}
        <div className="relative grid grid-cols-12">
          <div ref={ref} className="relative col-[2/-2]">
            {/* Header */}
            <header className="grid grid-cols-12 pt-40 pb-20 max-xl:pt-30 max-xl:pb-16 max-lg:pt-25 max-lg:pb-15 justify-items-center col-[2/-2] *:max-w-md">
              <div className="max-w-[20em] text-pretty text-heading-responsive-sm text-center col-[2/-2] mix-blend-multiply dark:mix-blend-screen">
                <h2 className="text-pretty inline">Intelligence built for how you work and what you do.</h2>
              </div>

              {/* Tabs */}
              <div className="mt-12 flex items-center gap-1 col-[2/-2] scroll-reveal" style={{ transitionDelay: '150ms' }}>
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
              <div className="mt-10 grid w-full grid-cols-1 gap-4 md:grid-cols-2 col-[2/-2] scroll-reveal" style={{ transitionDelay: '300ms' }}>
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
            </header>

            {/* Dashed vertical borders */}
            <svg width="1" height="100%" className="text-subtle-stroke mask-t-to-70% mask-t-from-0% absolute inset-y-0 left-0">
              <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
            </svg>
            <svg width="1" height="100%" className="text-subtle-stroke mask-t-to-70% mask-t-from-0% absolute inset-y-0 right-0">
              <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Bottom: dot pattern with gradient mask */}
        <div className="mask-b-from-50% mask-b-to-85% relative grid grid-flow-dense grid-cols-12 bg-linear-to-b from-primary-background to-secondary-background pt-1">
          <svg width="100%" height="100%" className="text-muted-strong-background mask-x-from-90% absolute inset-0">
            <defs>
              <pattern id="use-cases-dots" width="10" height="10" patternUnits="userSpaceOnUse">
                <rect x="5.5" y="5.5" width="1" height="1" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#use-cases-dots)" />
          </svg>
        </div>
      </div>
    </section>
  )
}
