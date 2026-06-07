import { useScrollReveal } from '../../hooks/useScrollReveal'
import Button from '../ui/Button'

const tabs = ['Builders', 'Open source', 'Teams', 'Researchers']

export default function HomeAdaptiveSection() {
  const sectionRef = useScrollReveal()

  return (
    <section
      ref={sectionRef}
      className="flex w-full max-w-screen flex-col items-center justify-center overflow-x-clip"
    >
      <div className="relative flex w-full max-w-full flex-col items-center lg:px-6">
        <div className="relative flex w-full max-w-[1392px] flex-col">
          {/* Section label */}
          <div className="hidden lg:block pt-[60px]">
            <div className="flex items-center justify-between px-5 text-overline">
              <h2 className="flex gap-x-[6px]">
                <span>[02]</span>
                <span className="text-muted-foreground">Adaptive ecosystem</span>
              </h2>
              <span>/ apps &harr; agents</span>
            </div>
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

          {/* Content */}
          <div className="pt-20 lg:flex lg:flex-col lg:items-center lg:pt-[120px]">
            <div className="scroll-reveal max-w-[880px] text-heading-sm lg:text-center px-6 lg:px-0">
              <h3 className="inline font-semibold text-foreground">
                One ecosystem, every workflow.{' '}
              </h3>
              <p className="inline font-medium text-muted-foreground">
                Mention, Inbox, Codea, Oxy AI and the rest of the ecosystem share data,
                identity and agents — so your tools finally work together.
              </p>
            </div>
            <Button variant="outline" size="md" href="/technologies" className="scroll-reveal mt-7">
              Explore the ecosystem
            </Button>
          </div>

          {/* Tabs + product mockup area */}
          <div className="lg:container">
            <div>
              {/* Tab buttons */}
              <div className="hide-scrollbar flex gap-x-1.5 overflow-scroll py-5 pt-20 pb-4 lg:pt-[120px] justify-center">
                {tabs.map((tab, i) => (
                  <Button
                    key={tab}
                    variant="outline"
                    size="sm"
                    className={i === 0 ? 'pointer-events-none' : ''}
                  >
                    {tab}
                  </Button>
                ))}
              </div>

              {/* Product mockup placeholder */}
              <div className="scroll-reveal relative py-12">
                <div className="mx-auto max-w-3xl aspect-[16/10] rounded-xl bg-gradient-to-br from-surface to-border border border-border overflow-hidden">
                  <img
                    src="/placeholder-adaptive.png"
                    alt="Data model"
                    className="h-full w-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
