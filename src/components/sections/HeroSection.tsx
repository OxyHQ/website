import { hero } from '../../data/content'
import Button from '../ui/Button'

export default function HeroSection() {
  return (
    <section className="flex min-h-[calc(100svh-var(--site-header-height))] flex-col bg-gradient-to-b from-[var(--color-primary-bg)] to-[var(--color-secondary-bg)]">
      {/* Main content area with background glow */}
      <div className="relative flex flex-1 flex-col overflow-hidden">
        {/* Radial glow */}
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden="true"
        >
          <div className="absolute left-1/2 top-1/4 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-blue-500)]/[0.07] blur-[120px]" />
        </div>

        {/* Content in 12-col grid */}
        <div className="pointer-events-none relative grid flex-1 grid-cols-12">
          <div className="col-[2/-2] flex flex-col items-center justify-center pb-12">
            <div className="pointer-events-auto">
              {/* Header with staggered animations */}
              <header className="flex w-full flex-col items-center pt-20 pb-15 lg:pt-25 xl:pt-30">
                <h1
                  className="text-heading-responsive-lg max-w-[15em] text-balance text-center animate-fade-in-up"
                  style={{ animationDelay: '200ms' }}
                >
                  {hero.title}
                </h1>
                <p
                  className="mt-4 max-w-xl text-balance text-center text-lg text-[var(--color-secondary-fg)] lg:text-xl animate-fade-in-up"
                  style={{ animationDelay: '300ms' }}
                >
                  {hero.subtitle}
                </p>
              </header>
            </div>

            {/* Search input mockup */}
            <div
              className="pointer-events-auto w-full max-w-md animate-fade-in-up"
              style={{ animationDelay: '500ms' }}
            >
              <div aria-hidden="true" className="relative w-full">
                {/* White input bar */}
                <div
                  className="relative z-10 flex items-center justify-between rounded-xl bg-[var(--color-white-100)] pl-4 backdrop-blur-[2px]"
                  style={{
                    boxShadow:
                      '0 0 0 1px rgba(28,40,64,0.04), 0 9px 4px rgba(127,135,144,0.01), 0 5px 3px rgba(127,135,144,0.05), 0 2px 2px rgba(127,135,144,0.09), 0 1px 1px rgba(127,135,144,0.1)',
                  }}
                >
                  <span className="min-w-0 flex-1 text-[15px] font-medium leading-5 text-[var(--color-white-900)]/40">
                    Ask anything.
                  </span>
                  <div className="relative flex shrink-0 justify-end overflow-hidden p-[9px]">
                    {/* Blue send button */}
                    <div
                      className="flex size-8 items-center justify-center rounded-[9px] border border-black/10 bg-[#266df0] text-[var(--color-white-100)]"
                      style={{
                        boxShadow:
                          '0 2px 4px -2px rgba(15,107,233,0.12), 0 3px 6px -2px rgba(15,107,233,0.08)',
                      }}
                    >
                      {/* Arrow up icon */}
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        className="size-4"
                      >
                        <path
                          d="M6.52 1.35C6.74 1.1 7.04 1.12 7.24 1.32L11.24 5.32C11.46 5.54 11.46 5.9 11.24 6.13C11.01 6.35 10.65 6.35 10.43 6.13L7.41 3.1V12.01C7.41 12.32 7.15 12.58 6.83 12.58C6.52 12.58 6.26 12.32 6.26 12.01V3.1L3.24 6.13C3.02 6.35 2.65 6.35 2.43 6.13C2.21 5.9 2.21 5.54 2.43 5.32L6.43 1.32L6.52 1.35Z"
                          fill="currentColor"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
                {/* Empty response area suggesting chat */}
                <div className="mt-2 h-64 rounded-xl bg-[var(--color-white-100)]/5 md:h-76" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Separator line */}
      <svg width="100%" height="1" className="text-[var(--color-subtle-stroke)]">
        <line
          x1="0"
          y1="0.5"
          x2="100%"
          y2="0.5"
          stroke="currentColor"
          strokeLinecap="round"
        />
      </svg>

      {/* Sub-hero CTA bar */}
      <div className="mx-auto w-full max-w-[1200px] px-6">
        <div className="grid w-full grid-cols-12">
          <div className="col-[2/-2] flex flex-col items-center justify-between gap-6 py-12 max-md:pb-10 max-md:pt-15 lg:flex-row lg:gap-0">
            <p className="max-w-md text-center text-lg text-[var(--color-secondary-fg)] lg:text-left">
              Engineered for performance. Unified by design. Powered by
              Universal Context.
            </p>
            <div className="flex items-center justify-center gap-x-2.5">
              <Button variant="outline" size="md" href="#">
                Talk to sales
              </Button>
              <Button variant="primary" size="md" href="#">
                Start for free
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
