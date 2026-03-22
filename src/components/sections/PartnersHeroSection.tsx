export default function PartnersHeroSection() {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-6">
      <div className="relative isolate border-x border-subtle-stroke">
        {/* Dot pattern background */}
        <svg
          width="100%"
          height="100%"
          className="mask-t-to-50% absolute inset-0 text-muted-strong-background"
        >
          <defs>
            <pattern
              id="partners-hero-dots"
              width="10"
              height="10"
              patternUnits="userSpaceOnUse"
            >
              <rect x="5.5" y="5.5" width="1" height="1" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#partners-hero-dots)" />
        </svg>

        <div className="relative z-20 grid grid-cols-12">
          <div className="relative col-[2/-2]">
            <header className="flex w-full flex-col items-center pb-24 pt-30 max-xl:pt-25 max-lg:pt-20 lg:pb-28 xl:pb-32">
              {/* Badge */}
              <div className="mb-6 inline-block w-fit rounded-[13px] border border-weak-stroke bg-primary-background px-3 py-1.5 text-[13px]/[1.4em] font-medium text-secondary-foreground">
                <h1>Partner programs</h1>
              </div>

              {/* Title */}
              <h2 className="max-w-[15em] text-balance text-center text-heading-responsive-lg">
                Partner with us to build the next generation of CRM.
              </h2>

              {/* Subtitle */}
              <p className="mt-4 max-w-xl text-balance text-center text-lg text-secondary-foreground lg:text-xl">
                We work with the best developers, creators, and consultants to
                power the next era of companies.
              </p>
            </header>
          </div>
        </div>
      </div>
    </div>
  )
}
