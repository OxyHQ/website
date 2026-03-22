import { careersHero } from '../../data/careers'

const avatarColors = ['#266DF0', '#9162F9', '#FD9038']

export default function CareersHeroSection() {
  return (
    <section className="container relative max-lg:overflow-hidden">
      <div className="relative grid w-full grid-cols-12 gap-x-6 lg:border-subtle-stroke lg:border-x">
        <div className="relative col-span-full row-1 lg:col-[2/-2]">
          <header
            className="flex w-full flex-col max-xl:pt-25 max-lg:pt-20 max-lg:items-center py-36 pb-48 max-lg:pb-20"
            style={{ '--animate-delay': '0ms', '--animate-delay-mobile': '0ms' } as React.CSSProperties}
          >
            <div className="inline-block w-fit rounded-[13px] border border-weak-stroke bg-primary-background px-3 py-1.5 font-medium text-[13px]/[1.4em] text-secondary-foreground mb-6">
              <h1>{careersHero.badge}</h1>
            </div>

            <h2 className="max-w-[15em] text-balance text-heading-responsive-lg max-lg:text-center">
              {careersHero.title}
            </h2>

            <p className="mt-4 max-w-xl text-balance text-lg text-secondary-foreground lg:text-xl max-lg:text-center">
              {careersHero.subtitle}
            </p>

            <div className="mt-7 flex w-auto items-center gap-x-3 gap-y-4 max-lg:flex-col">
              <a
                href="#open-positions"
                className="inline-flex items-center justify-center rounded-full bg-primary-foreground px-5 py-2.5 text-sm font-semibold text-primary-background transition-colors hover:bg-primary-foreground/90"
              >
                Join the team
              </a>

              {/* Avatar stack */}
              <div className="group flex">
                {avatarColors.map((color, i) => (
                  <div
                    key={i}
                    className="relative -mr-2 size-[36px] rounded-full border lg:size-7 lg:group-hover:mr-0.5 transition-all duration-150 ease-out lg:hover:z-10 lg:hover:scale-[1.12]"
                    style={{ borderColor: color, transitionDelay: `${i * 25}ms` }}
                  >
                    <div className="h-full w-full overflow-hidden rounded-full border border-white-100">
                      <div className="h-full w-full rounded-full" style={{ backgroundColor: color, opacity: 0.3 }} />
                    </div>
                  </div>
                ))}
                {/* Count badge */}
                <div className="relative size-[36px] rounded-full border border-subtle-stroke lg:size-7">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-[#FBFBFB] text-[#75777C]">
                    <span className="lg:text-[10px] lg:leading-[14px] text-[12px] tabular-nums leading-[16px] tracking-tighter">
                      +127
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </header>
        </div>
      </div>
    </section>
  )
}
