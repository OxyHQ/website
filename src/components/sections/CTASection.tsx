import { useScrollReveal } from '../../hooks/useScrollReveal'
import Button from '../ui/Button'

export default function CTASection() {
  const ref = useScrollReveal()

  return (
    <section className="dark bg-primary-background">
      <div className="container flex flex-1 flex-col">
        <div className="flex w-full flex-1 flex-col border-subtle-stroke border-x">
          {/* Top grid decoration */}
          <div aria-hidden="true" className="grid h-40 w-full grid-cols-12 overflow-hidden max-xl:h-30 max-lg:h-25 h-8!">
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

          {/* Main content grid */}
          <div ref={ref} className="relative grid grid-cols-12">
            {/* Center vertical separator */}
            <svg width="1" height="100%" className="text-subtle-stroke absolute inset-y-0 left-1/2 -translate-x-1/2 max-lg:hidden">
              <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeLinecap="round" />
            </svg>

            {/* Content: left side */}
            <div className="col-[2/6] flex flex-col py-30 max-lg:py-20 max-lg:col-[2/-2] max-lg:items-center">
              <h2 className="text-balance text-heading-responsive-md! text-primary-foreground max-lg:text-center scroll-reveal">
                <span>Ask more from CRM. Ask Oxy.</span>
                <span className="font-normal font-serif"> </span>
              </h2>
              <div className="flex w-full items-center justify-center gap-x-2.5 gap-y-2 max-md:flex-col max-md:items-center mt-8 lg:justify-start scroll-reveal" style={{ transitionDelay: '150ms' }}>
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
      </div>
    </section>
  )
}
