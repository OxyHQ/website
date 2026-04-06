import { engagementSection } from '../../data/initiative'

function PathwayIcon({ type }: { type: string }) {
  switch (type) {
    case 'idea':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="size-5">
          <path
            d="M10 2a5.5 5.5 0 0 0-3.5 9.74V14a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-2.26A5.5 5.5 0 0 0 10 2zm-1.5 14h3v1a1.5 1.5 0 0 1-3 0v-1z"
            fill="currentColor"
            opacity="0.7"
          />
        </svg>
      )
    case 'volunteer':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="size-5">
          <path
            d="M7 3C5.9 3 5 3.9 5 5s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM7 9c-2 0-4 1-4 2.5V13h8v-1.5C11 10 9 9 7 9zm6 0c-.3 0-.6 0-.9.1.9.7 1.9 1.5 1.9 2.4V13h4v-1.5C18 10 16 9 13 9z"
            fill="currentColor"
            opacity="0.7"
          />
        </svg>
      )
    case 'donate':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="size-5">
          <path
            d="M10 4.5C9 3.5 7.5 3 6.25 3 4 3 2 5 2 7.25c0 2.75 2.5 5 6.25 8.5L10 17.5l1.75-1.75C15.5 12.25 18 10 18 7.25 18 5 16 3 13.75 3 12.5 3 11 3.5 10 4.5z"
            fill="currentColor"
            opacity="0.7"
          />
        </svg>
      )
    case 'community':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="size-5">
          <path
            d="M10 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM4 7a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm12 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM10 10c-3 0-5 1.5-5 3v2h10v-2c0-1.5-2-3-5-3zm-7 2c-1.5 0-3 1-3 2v1h3v-2c0-.4.1-.7.2-1H3zm14 0c-.1.3-.2.6-.2 1v2h3v-1c0-1-1.5-2-3-2z"
            fill="currentColor"
            opacity="0.7"
          />
        </svg>
      )
    default:
      return null
  }
}

function ArrowIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className="relative -translate-x-0.5 -rotate-45 shrink-0 text-foreground opacity-0 transition-[opacity,translate] duration-400 ease-in-out group-hover:translate-0 group-hover:opacity-100 group-hover:duration-150"
    >
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.1"
        d="M2.25 7h9.5m0 0L8.357 3.5M11.75 7l-3.393 3.5"
      />
    </svg>
  )
}

export default function EngagementSection() {
  return (
    <section className="mx-auto w-full max-w-[1200px] px-6">
      <div className="border-x border-border">
        {/* Header */}
        <header className="grid grid-cols-12 justify-items-start pb-15 pt-40 max-xl:pb-16 max-xl:pt-30 max-lg:pb-15 max-lg:pt-25">
          <div className="col-[2/-2] flex max-w-xl flex-col gap-4 text-start max-lg:gap-3">
            <h2 className="text-pretty text-heading-responsive-md">
              {engagementSection.heading}
            </h2>
          </div>
        </header>

        {/* Cards grid */}
        <div className="grid grid-cols-12">
          <div className="col-[2/-2] grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {engagementSection.pathways.map((pathway) => (
              <a
                key={pathway.title}
                href={pathway.ctaHref}
                className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border p-6 pt-5.5 transition-colors duration-400 ease-in-out hover:border-input hover:duration-150"
              >
                {/* Hover background */}
                <div className="pointer-events-none absolute inset-0 bg-surface opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-80 group-hover:duration-50" />

                {/* Icon + arrow */}
                <div className="relative flex items-center justify-between">
                  <PathwayIcon type={pathway.iconType} />
                  <ArrowIcon />
                </div>

                {/* Text */}
                <div className="relative flex flex-col gap-1">
                  <h3 className="font-semibold text-foreground">
                    {pathway.title}
                  </h3>
                  <p className="text-balance text-sm text-muted-foreground">
                    {pathway.description}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Bottom spacer */}
        <div
          aria-hidden="true"
          className="grid h-40 w-full grid-cols-12 overflow-hidden max-xl:h-30 max-lg:h-25"
        >
          <div className="col-[2/-2] flex justify-between" />
        </div>
      </div>
    </section>
  )
}
