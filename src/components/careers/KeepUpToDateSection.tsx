import { socialCards } from '../../data/careers'

export default function KeepUpToDateSection() {
  return (
    <section className="container">
      <div className="border-subtle-stroke border-x">
        <header className="grid grid-cols-12 pt-40 pb-20 max-xl:pt-30 max-xl:pb-16 max-lg:pt-25 max-lg:pb-15 justify-items-start !pb-15">
          <div className="max-w-[20em] text-pretty text-heading-responsive-sm text-start col-[2/-2] mix-blend-multiply dark:mix-blend-screen">
            <h2 className="text-pretty inline">Keep up to date.</h2>
          </div>
          <div className="col-[2/-2]">
            <p className="mt-5 text-balance text-lg text-secondary-foreground lg:text-xl">
              Get the latest updates on what we're building.
            </p>
          </div>
        </header>
        <div className="grid grid-cols-12">
          <div className="col-[2/-2] grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {socialCards.map((card) => (
              <a
                key={card.title}
                href={card.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-subtle-stroke p-6 pt-5.5 transition-colors duration-400 ease-in-out hover:border-white-800 hover:duration-150"
              >
                <div className="pointer-events-none absolute inset-0 bg-secondary-background opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-80 group-hover:duration-50" />
                <div className="relative flex items-center justify-between">
                  {/* Icon placeholder */}
                  <div className="size-5 text-primary-foreground">{card.title[0]}</div>
                  {/* Hover arrow */}
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    className="relative shrink-0 text-secondary-foreground opacity-0 -translate-x-0.25 transition-[opacity,translate] duration-400 ease-in-out group-hover:translate-0 group-hover:opacity-100 group-hover:duration-150 -rotate-45"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.1"
                      d="M2.25 7h9.5m0 0L8.357 3.5M11.75 7l-3.393 3.5"
                    />
                  </svg>
                </div>
                <div className="relative flex flex-col gap-1">
                  <h3 className="font-semibold text-secondary-foreground">{card.title}</h3>
                  <p className="text-balance text-sm text-tertiary-foreground">{card.description}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
        {/* Bottom padding */}
        <div className="h-20" />
      </div>
    </section>
  )
}
