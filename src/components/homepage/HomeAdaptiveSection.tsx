import { Link } from 'react-router-dom'
import { useScrollReveal } from '../../hooks/useScrollReveal'

const tabs = ['Scale-ups', 'SaaS startups', 'SMBs', 'Investors']

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
                <span className="text-black-800">Adaptive model</span>
              </h2>
              <span>/ data &harr; business</span>
            </div>
            <svg
              width="100%"
              height="1"
              className="text-subtle-stroke mt-5 h-px w-full"
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
          <div className="pt-20 lg:flex lg:flex-col lg:items-center lg:border-subtle-stroke lg:border-x lg:pt-[120px]">
            <div className="scroll-reveal max-w-[880px] text-heading-sm lg:text-center px-6 lg:px-0">
              <h3 className="inline font-semibold text-primary-foreground">
                A seismic shift in CRM flexibility.{' '}
              </h3>
              <p className="inline font-medium text-black-800">
                Oxy's powerful data model adapts to how your business works, not the
                other way around. Your business model — perfectly reflected in your CRM.
              </p>
            </div>
            <Link
              to="#"
              className="scroll-reveal button-outline mt-7 inline-flex h-9 items-center gap-1.5 rounded-[10px] border px-3 text-sm transition-colors duration-300"
            >
              Explore our data model
            </Link>
          </div>

          {/* Tabs + product mockup area */}
          <div className="lg:container">
            <div className="lg:border-subtle-stroke lg:border-x">
              {/* Tab buttons */}
              <div className="scrollbar-none flex gap-x-1.5 overflow-scroll py-5 pt-20 pb-4 lg:pt-[120px] justify-center">
                {tabs.map((tab, i) => (
                  <button
                    key={tab}
                    className={`button-outline inline-flex h-8 items-center gap-1.5 rounded-[10px] border border-subtle-stroke px-2.5 text-sm text-tertiary-foreground transition-colors duration-300 hover:bg-secondary-background ${
                      i === 0 ? 'bg-surface-subtle pointer-events-none' : ''
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Product mockup placeholder */}
              <div className="scroll-reveal relative py-12">
                <div className="mx-auto max-w-3xl aspect-[16/10] rounded-xl bg-gradient-to-br from-[#F3F4F6] to-[#E4E7EC] border border-subtle-stroke overflow-hidden">
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
