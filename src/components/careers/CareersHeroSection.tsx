import { careersHero } from '../../data/careers'

const avatarColors = [
  'border-blue-400 bg-blue-200',
  'border-green-400 bg-green-200',
  'border-yellow-400 bg-yellow-200',
  'border-pink-400 bg-pink-200',
  'border-purple-400 bg-purple-200',
  'border-orange-400 bg-orange-200',
]

export default function CareersHeroSection() {
  return (
    <section className="container relative max-lg:overflow-hidden">
      <div className="relative grid w-full grid-cols-12 gap-x-6 lg:border-subtle-stroke lg:border-x">
        <div className="relative col-span-full row-1 lg:col-[2/-2]">
          <header
            className="flex w-full flex-col max-xl:pt-25 max-lg:pt-20 max-lg:items-center py-36 pb-48 max-lg:pb-20"
            style={{ '--animate-delay': '0ms', '--animate-delay-mobile': '0ms' } as React.CSSProperties}
          >
            <div
              className="fade-in-from-bottom-1 animate-in fill-mode-both"
              style={{ animationDelay: 'var(--animate-delay)' }}
            >
              <span className="inline-block w-fit rounded-[13px] border border-weak-stroke bg-primary-background px-3 py-1.5 font-medium text-[13px]/[1.4em] text-secondary-foreground mb-6">
                {careersHero.badge}
              </span>
            </div>

            <h2
              className="fade-in-from-bottom-1 animate-in fill-mode-both text-heading-responsive-lg max-lg:text-center"
              style={{ animationDelay: 'var(--animate-delay)' }}
            >
              {careersHero.title}
            </h2>

            <p
              className="fade-in-from-bottom-1 animate-in fill-mode-both mt-6 max-w-[32em] text-pretty text-lg text-secondary-foreground max-lg:text-center lg:text-xl"
              style={{ animationDelay: 'calc(var(--animate-delay) + 80ms)' }}
            >
              {careersHero.subtitle}
            </p>

            <div
              className="fade-in-from-bottom-1 animate-in fill-mode-both mt-10 flex items-center gap-4 max-lg:flex-col"
              style={{ animationDelay: 'calc(var(--animate-delay) + 160ms)' }}
            >
              <a
                href="#open-positions"
                className="inline-flex items-center justify-center rounded-full bg-primary-foreground px-5 py-2.5 text-sm font-semibold text-primary-background transition-colors hover:bg-primary-foreground/90"
              >
                Join the team
              </a>

              <div className="flex items-center">
                {avatarColors.map((color, i) => (
                  <div
                    key={i}
                    className={`-mr-2 size-8 rounded-full border-2 ${color}`}
                  />
                ))}
              </div>
            </div>
          </header>
        </div>
      </div>
    </section>
  )
}
