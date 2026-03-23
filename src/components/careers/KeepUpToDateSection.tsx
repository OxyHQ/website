import { socialCards } from '../../data/careers'

function SocialIcon({ type }: { type: string }) {
  switch (type) {
    case 'linkedin':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="size-5">
          <path
            d="M4.5 3C3.67 3 3 3.67 3 4.5S3.67 6 4.5 6 6 5.33 6 4.5 5.33 3 4.5 3zM3 8h3v9H3V8zm5.5 0H11v1.23C11.6 8.46 12.5 8 13.5 8c2.21 0 3.5 1.45 3.5 3.99V17h-3v-4.5c0-1.12-.5-1.75-1.5-1.75S11 11.38 11 12.5V17H8.5V8z"
            fill="currentColor"
            opacity="0.7"
          />
        </svg>
      )
    case 'x':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="size-5">
          <path
            d="M11.2 9.2L16.5 3h-1.3l-4.6 5.4L6.9 3H3l5.6 8.1L3 18h1.3l4.9-5.7L13.1 18H17L11.2 9.2zm-1.7 2l-.6-.8L4.8 4h1.9l3.6 5.2.6.8 4.8 6.9h-1.9l-3.9-5.6v-.1z"
            fill="currentColor"
            opacity="0.7"
          />
        </svg>
      )
    case 'dribbble':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="size-5">
          <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
          <path d="M3.5 7.5c3 1 6.5 1.2 13 0M3.5 12.5c3-1 7-1 13 0M10 3c-2 3-3 7-2.5 14M10 3c2 3 3 7 2.5 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.5" />
        </svg>
      )
    case 'youtube':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="size-5">
          <rect x="3" y="5" width="14" height="10" rx="3" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
          <path d="M8.5 7.5l4 2.5-4 2.5V7.5z" fill="currentColor" opacity="0.7" />
        </svg>
      )
    default:
      return null
  }
}

export default function KeepUpToDateSection() {
  return (
    <section className="container">
      <div className="border-border border-x">
        <header className="grid grid-cols-12 pt-40 pb-20 max-xl:pt-30 max-xl:pb-16 max-lg:pt-25 max-lg:pb-15 justify-items-start !pb-15">
          <div className="max-w-[20em] text-pretty text-heading-responsive-sm text-start col-[2/-2] mix-blend-multiply dark:mix-blend-screen">
            <h2 className="text-pretty inline">Keep up to date.</h2>
          </div>
          <div className="col-[2/-2]">
            <p className="mt-5 text-balance text-lg text-foreground lg:text-xl">
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
                className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border p-6 pt-5.5 transition-colors duration-400 ease-in-out hover:border-input hover:duration-150 active:border-input active:duration-50"
              >
                <div className="pointer-events-none absolute inset-0 bg-surface opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-80 group-hover:duration-50 group-active:opacity-100 group-active:duration-50" />
                <div className="relative flex items-center justify-between">
                  <SocialIcon type={card.iconType} />
                  {/* Arrow */}
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    className="relative shrink-0 text-foreground opacity-0 -translate-x-0.25 transition-[opacity,translate] duration-400 ease-in-out group-hover:translate-0 group-hover:opacity-100 group-hover:duration-150 group-active:translate-0 group-active:opacity-100 group-active:duration-50 -rotate-45"
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
                  <h3 className="font-semibold text-foreground">{card.title}</h3>
                  <p className="text-balance text-sm text-muted-foreground">{card.description}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
        <div className="h-20" />
      </div>
    </section>
  )
}
