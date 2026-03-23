import Button from '../ui/Button'
import { homeHero } from '../../data/homepage'

export default function HomeHeroSection() {
  return (
    <section className="flex w-full max-w-screen flex-col items-center justify-center overflow-x-clip bg-linear-to-b from-surface to-background relative">
      <div className="container border-border lg:border-x">
        <div className="sticky top-[64px] grid h-[calc(100vh-64px)] w-full justify-center gap-9 lg:grid-rows-2 lg:gap-[52px] lg:px-6 lg:pt-[72px]">
          {/* SVG dot pattern background */}
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            <defs>
              <pattern
                id="hero-dot-pattern"
                x="0"
                y="0"
                width="24"
                height="24"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="1" cy="1" r="1" fill="var(--color-input)" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-dot-pattern)" />
          </svg>

          {/* Top content area */}
          <div className="relative z-10 flex flex-col items-center justify-end">
            {/* Logo badge row */}
            <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
              Trusted by leading teams
            </p>

            <h1 className="mt-6 max-w-[14ch] text-center text-heading-md md:text-heading-lg lg:text-heading-xl text-foreground">
              {homeHero.title}
            </h1>

            <p className="mt-4 max-w-md text-pretty text-center text-lg text-muted-foreground md:text-xl">
              {homeHero.subtitle}
            </p>

            <div className="mt-6 flex items-center gap-2">
              <Button variant="primary" size="md" href="#">
                Start for free
              </Button>
              <Button variant="outline" size="md" href="#">
                Talk to sales
              </Button>
            </div>
          </div>

          {/* Product screenshot placeholder */}
          <div className="relative z-10 flex items-start justify-center px-4 lg:px-0">
            <div className="h-full w-full max-w-4xl rounded-2xl border border-border bg-white shadow-lg" />
          </div>
        </div>
      </div>
    </section>
  )
}
