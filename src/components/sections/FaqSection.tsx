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
  /** Draw the closing rule here when the following footer omits its divider. */
  borderBottom?: boolean
}

function FaqRow({ item }: { item: FaqEntry }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()

  return (
    <div className="w-full border-t border-border first:border-t-0 lg:first:border-t-0">
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between gap-4 px-4 py-6 text-left transition-colors duration-300 hover:bg-foreground/5"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="text-title-sm text-foreground">{item.question}</span>
        <ChevronDown
          aria-hidden="true"
          className={`size-5 shrink-0 text-muted-foreground transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
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
          <div className="max-w-3xl px-4 pb-6 text-body-lg text-muted-foreground">{item.answer}</div>
        </div>
      </div>
    </div>
  )
}

export default function FaqSection({ title, items, as = 'h2', className = '', borderBottom = false }: FaqSectionProps) {
  return (
    <section className={className}>
      {/* The home page can own the closing rule when the footer omits its divider. */}
      <div className={`border-t border-border ${borderBottom ? 'border-b' : ''}`}>
        <div className="container">
          <div className="relative flex w-full flex-col border-border lg:flex-row lg:border-x">
            <div className="w-full shrink-0 border-b border-border p-4 md:py-10 md:pr-10 lg:w-lg lg:border-b-0 lg:border-r">
              <AnimatedTitle as={as} className="text-title-md">
                {title}
              </AnimatedTitle>
            </div>

            <div className="w-full">
              {items.map((item) => (
                <FaqRow key={item.question} item={item} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
