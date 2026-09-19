import { keepUpToDateCards } from '../../data/content'
import { ArrowRightIcon } from '../icons'
import { AnimatedTitle } from '../ui/AnimatedTitle'

function CardIcon({ type }: { type: string }) {
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
    case 'blog':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="size-5">
          <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
          <line x1="6" y1="7" x2="14" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
          <line x1="6" y1="10" x2="12" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
          <line x1="6" y1="13" x2="10" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        </svg>
      )
    case 'changelog':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="size-5">
          <rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
          <line x1="7" y1="6" x2="13" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
          <line x1="7" y1="10" x2="13" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
          <line x1="7" y1="14" x2="11" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        </svg>
      )
    default:
      return null
  }
}

interface KeepUpToDateSectionProps {
  compact?: boolean
}

export default function KeepUpToDateSection({ compact = false }: KeepUpToDateSectionProps = {}) {
  if (compact) {
    const tones = [
      'bg-[color-mix(in_srgb,var(--primary)_18%,var(--background))]',
      'bg-[color-mix(in_srgb,var(--secondary)_22%,var(--background))]',
      'bg-[color-mix(in_srgb,var(--tertiary)_20%,var(--background))]',
      'bg-[color-mix(in_srgb,var(--accent)_22%,var(--background))]',
    ]

    return (
      <section className="container py-16 md:py-24">
        <div className="mb-8 grid gap-4 md:mb-10 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)] md:items-end md:gap-12">
          <AnimatedTitle as="h2" className="text-pretty text-heading-responsive-lg text-primary-text">Keep up to date.</AnimatedTitle>
          <p className="max-w-xl text-pretty text-base leading-7 text-foreground/70 md:justify-self-end md:text-lg">Get the latest updates on what we&apos;re building.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {keepUpToDateCards.map((card, index) => (
            <a key={card.title} href={card.href} className={`group flex min-h-[150px] flex-col justify-between gap-6 rounded-3xl p-6 text-primary-text transition-[filter,transform] duration-300 hover:-translate-y-0.5 hover:brightness-105 ${tones[index % tones.length]}`}>
              <div className="flex items-center justify-between"><CardIcon type={card.iconType} /><ArrowRightIcon className="-rotate-45 shrink-0 text-primary-text/70 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></div>
              <div><h3 className="font-semibold text-primary-text">{card.title}</h3><p className="mt-1 text-balance text-sm text-primary-text/70">{card.description}</p></div>
            </a>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="container">
      <div>
        {/* Header */}
        <header className="grid grid-cols-12 justify-items-start pb-15 pt-40 max-xl:pb-16 max-xl:pt-30 max-lg:pb-15 max-lg:pt-25">
          <div className="col-span-full flex max-w-xl flex-col gap-4 text-start max-lg:gap-3">
            <AnimatedTitle as="h2" className="text-pretty text-heading-responsive-md">
              Keep up to date.
            </AnimatedTitle>
            <p className="text-pretty text-xl text-muted-foreground">
              Get the latest updates on what we&apos;re building.
            </p>
          </div>
        </header>

        {/* Cards grid */}
        <div className="grid grid-cols-12">
          <div className="col-span-full grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {keepUpToDateCards.map((card) => (
              <a
                key={card.title}
                href={card.href}
                className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border p-6 pt-5.5 transition-colors duration-400 ease-in-out hover:border-input hover:duration-150"
              >
                {/* Hover background */}
                <div className="pointer-events-none absolute inset-0 bg-surface opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-80 group-hover:duration-50" />

                {/* Icon + arrow */}
                <div className="relative flex items-center justify-between">
                  <CardIcon type={card.iconType} />
                  <ArrowRightIcon className="relative -translate-x-0.5 -rotate-45 shrink-0 text-foreground opacity-0 transition-[opacity,translate] duration-400 ease-in-out group-hover:translate-0 group-hover:opacity-100 group-hover:duration-150" />
                </div>

                {/* Text */}
                <div className="relative flex flex-col gap-1">
                  <h3 className="font-semibold text-foreground">
                    {card.title}
                  </h3>
                  <p className="text-balance text-sm text-muted-foreground">
                    {card.description}
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
          <div className="col-span-full flex justify-between" />
        </div>
      </div>
    </section>
  )
}
