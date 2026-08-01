import PillButton from './PillButton'

interface PageHeroProps {
  /** Small label above the title — the product or section this page belongs to. */
  eyebrow?: string
  title: string
  /** One line under the title. */
  tagline?: string
  /** The opening paragraph. */
  lede?: string
  action?: { label: string; href: string; external?: boolean }
  /**
   * `editorial` is the statement hero: display title full-width, lede in the
   * second column. `listing` opens a page whose body is a full-bleed list —
   * a smaller title held to a reading measure against the start gutter.
   */
  variant?: 'editorial' | 'listing'
}

/** The opening slice of a page: title, optional tagline, lede and one action. */
export default function PageHero({ eyebrow, title, tagline, lede, action, variant = 'editorial' }: PageHeroProps) {
  if (variant === 'listing') {
    return (
      <section className="grid grid-cols-8 gap-x-2.5 sm:grid-cols-12 sm:gap-x-5 md:gap-x-6 layout-px-large relative pt-30 lg:pt-40 pb-15 lg:pb-10 2xl:pt-56">
        <div className="col-span-full sm:col-span-11 sm:col-start-1 lg:col-start-5 lg:col-span-7">
          {eyebrow && <p className="text-h6 text-gray-a1 mb-3">{eyebrow}</p>}
          <h1 className="text-gray-a1 text-h2">{title}</h1>
          {tagline && <p className="mt-8 text-gray-a1 text-h7">{tagline}</p>}
          {lede && <p className="mt-8 max-w-[27em] text-b1 text-gray-a1">{lede}</p>}
          {action && (
            <div className="mt-10">
              <PillButton href={action.href} external={action.external}>
                {action.label}
              </PillButton>
            </div>
          )}
        </div>
      </section>
    )
  }

  return (
    <section className="layout-px-large grid pt-32 lg:pt-40 lg:grid-cols-2 lg:gap-x-16 gap-y-10">
      <div className="flex flex-col gap-y-3 md:gap-y-4 lg:col-span-2 text-gray-a1">
        {eyebrow && <p className="text-h6">{eyebrow}</p>}
        <h1 className="text-h1">{title}</h1>
        {/* Held to a few words per line so it breaks like a pull quote. */}
        {tagline && <p className="max-w-[11em] md:max-w-[12em] lg:max-w-none text-h7 mt-3">{tagline}</p>}
      </div>
      {(lede || action) && (
        <div className="flex flex-col gap-y-8 lg:col-start-2">
          {lede && <p className="max-w-[25em] md:max-w-[27em] text-b1 text-gray-a1">{lede}</p>}
          {action && (
            <div>
              <PillButton href={action.href} external={action.external}>
                {action.label}
              </PillButton>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
