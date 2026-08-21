import { useId, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { AnimatedTitle } from '../ui/AnimatedTitle'

/**
 * A question-and-answer band: the heading holds its own column on the left, the
 * questions stack down the right, and the rules between them carry the
 * structure instead of cards. Reusable — it takes its questions, so any page
 * can put its own set in it.
 *
 * Not `slices/FaqAccordion`, which is the same idea in a different type system:
 * that one reads the `slice-theme` ramp, which only exists on pages that opt in
 * by putting the class on their root. This one reads the site's own tokens, so
 * it works anywhere.
 */

export interface FaqEntry {
  question: string
  answer: ReactNode
}

interface FaqSectionProps {
  /** The heading over the set. */
  title: string
  items: readonly FaqEntry[]
  /** Heading level. One `h1` per page, so a section defaults to `h2`. */
  as?: 'h2' | 'h3'
  className?: string
}

function FaqRow({ item }: { item: FaqEntry }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()

  return (
    <div className="w-full border-t border-primary/20 first:border-t-0">
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-3.5 text-left transition-[background-color,color] duration-300 hover:bg-primary/10 md:py-4"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="text-lg font-medium leading-snug text-primary-text md:text-xl">{item.question}</span>
        <ChevronDown
          aria-hidden="true"
          className={`size-4 shrink-0 text-tertiary transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/*
        Two grid rows rather than a measured height: `0fr` to `1fr` animates
        without anyone reading the content's height first, so it stays right
        when the answer reflows.
      */}
      <div
        id={panelId}
        className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="min-h-0">
          <div className="max-w-2xl px-5 pb-3 pr-10 text-base leading-7 text-foreground/75 md:pb-4 md:text-lg">{item.answer}</div>
        </div>
      </div>
    </div>
  )
}

export default function FaqSection({
  title,
  items,
  as = 'h2',
  className = '',
}: FaqSectionProps) {
  return (
    <section className={`w-full ${className}`}>
      <div className="container">
        <div className="grid w-full gap-6 py-8 md:gap-8 md:py-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-12">
          <div className="min-w-0 self-start lg:pt-2 lg:sticky lg:top-[calc(var(--site-header-height)+2rem)]">
            <AnimatedTitle as={as} className="text-heading-responsive-lg font-medium text-tertiary [&>p]:font-medium">
              {title}
            </AnimatedTitle>
          </div>

          <div className="min-w-0 overflow-hidden rounded-[2rem] bg-[color-mix(in_srgb,var(--background)_84%,var(--primary))]">
            {items.map((item) => (
              <FaqRow key={item.question} item={item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
