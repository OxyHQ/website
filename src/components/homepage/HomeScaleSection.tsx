import { useScrollReveal } from '../../hooks/useScrollReveal'

const logos = [
  'Vercel',
  'Scale',
  'Ramp',
  'Beam',
  'Linear',
  'Notion',
  'Figma',
  'Stripe',
  'Runway',
  'Modal',
  'Replit',
  'Clerk',
]

export default function HomeScaleSection() {
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
                <span>[04]</span>
                <span className="text-muted-foreground">Built for scale</span>
              </h2>
              <span>/ growth + security</span>
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
          <div className="container">
            <div className="border-border lg:border-x py-20 lg:py-32">
              <div className="scroll-reveal text-center">
                <h3 className="text-heading-sm font-semibold text-foreground">
                  Trusted by thousands of companies worldwide.
                </h3>
                <p className="mt-4 text-lg text-muted-foreground">
                  From startups to enterprises, teams trust Oxy to manage their most
                  important relationships.
                </p>
              </div>

              {/* Logo grid placeholder */}
              <div className="scroll-reveal mt-16 grid grid-cols-3 gap-6 md:grid-cols-4 lg:grid-cols-6">
                {logos.map((name) => (
                  <div
                    key={name}
                    className="flex h-12 items-center justify-center rounded-lg border border-border bg-surface text-sm font-medium text-muted-foreground"
                  >
                    {name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
