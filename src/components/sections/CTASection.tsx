import { useScrollReveal } from '../../hooks/useScrollReveal'
import Button from '../ui/Button'
import Container from '../layout/Container'

export default function CTASection() {
  const ref = useScrollReveal()

  return (
    <section className="dark bg-[var(--color-primary-bg)]">
      <Container>
        <div className="border-x border-[var(--color-subtle-stroke)]">
          {/* Top grid decoration */}
          <div aria-hidden="true" className="grid h-8 w-full grid-cols-12 overflow-hidden">
            <div className="col-[2/-2] flex justify-between">
              <svg width="1" height="100%" className="text-[var(--color-subtle-stroke)]">
                <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
              </svg>
              <svg width="1" height="100%" className="text-[var(--color-subtle-stroke)]">
                <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeLinecap="round" />
              </svg>
              <svg width="1" height="100%" className="text-[var(--color-subtle-stroke)]">
                <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Horizontal line */}
          <svg width="100%" height="1" className="text-[var(--color-subtle-stroke)]">
            <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="currentColor" strokeLinecap="round" />
          </svg>

          {/* Main content grid */}
          <div ref={ref} className="relative grid grid-cols-12 py-30 max-lg:py-20">
            {/* Center vertical separator */}
            <div aria-hidden="true" className="absolute top-0 bottom-0 left-1/2 max-lg:hidden">
              <svg width="1" height="100%" className="text-[var(--color-subtle-stroke)]">
                <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
              </svg>
            </div>

            {/* Left dashed border */}
            <div aria-hidden="true" className="absolute top-0 bottom-0 col-[2/3] max-lg:hidden" style={{ left: 'calc(100% / 12)' }}>
              <svg width="1" height="100%" className="text-[var(--color-subtle-stroke)]">
                <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
              </svg>
            </div>

            {/* Right dashed border */}
            <div aria-hidden="true" className="absolute top-0 bottom-0 max-lg:hidden" style={{ left: 'calc(11 * 100% / 12)' }}>
              <svg width="1" height="100%" className="text-[var(--color-subtle-stroke)]">
                <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
              </svg>
            </div>

            {/* Content: left side */}
            <div className="col-[2/6] max-lg:col-[2/-2] max-lg:text-center max-lg:flex max-lg:flex-col max-lg:items-center">
              <h2 className="text-heading-responsive-md text-balance text-[var(--color-primary-fg)] scroll-reveal">
                Ask more from CRM. Ask Oxy.
              </h2>
              <div className="mt-8 flex items-center gap-3 scroll-reveal" style={{ transitionDelay: '150ms' }}>
                <Button variant="primary" size="md" href="#">
                  Start for free
                </Button>
                <Button variant="outline" size="md" href="#">
                  Talk to sales
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
