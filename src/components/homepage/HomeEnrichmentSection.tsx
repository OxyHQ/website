import Button from '../ui/Button'
import { useScrollReveal } from '../../hooks/useScrollReveal'

export default function HomeEnrichmentSection() {
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
                <span>[03]</span>
                <span className="text-black-800">Data enrichment</span>
              </h2>
              <span>/ speed 1:1</span>
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
                Build fast.{' '}
              </h3>
              <p className="inline font-medium text-black-800">
                Forget months of setup. Oxy syncs immediately with your email and
                calendar, building a powerful CRM right before your eyes.
              </p>
            </div>
            <div className="scroll-reveal mt-7 px-6 lg:px-0">
              <Button variant="primary" size="md" href="#">
                Start for free
              </Button>
            </div>
          </div>

          {/* Product mockup area */}
          <div className="lg:container">
            <div className="lg:border-subtle-stroke lg:border-x">
              <div className="scroll-reveal relative py-12 pt-20 lg:pt-[120px]">
                <div className="mx-auto max-w-3xl aspect-[16/10] rounded-xl bg-gradient-to-br from-[#F3F4F6] to-[#E4E7EC] border border-subtle-stroke overflow-hidden">
                  <img
                    src="/placeholder-enrichment.png"
                    alt="Data enrichment"
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
