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

export interface FaqGroup {
  title?: string
  items: readonly FaqEntry[]
}

interface FaqSectionProps {
  /** The heading over the set. */
  title: string
  /** Optional supporting copy or action shown with the heading. */
  description?: ReactNode
  items?: readonly FaqEntry[]
  groups?: readonly FaqGroup[]
  /** Heading level. One `h1` per page, so a section defaults to `h2`. */
  as?: 'h2' | 'h3'
  className?: string
}

function FaqRow({
  item,
  rowId,
  openId,
  onToggle,
}: {
  item: FaqEntry
  rowId: string
  openId: string | null
  onToggle: (rowId: string) => void
}) {
  const open = openId === rowId
  const buttonId = useId()
  const panelId = useId()

  return (
    <div className="w-full border-t border-primary/20 first:border-t-0">
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-3.5 text-left transition-[background-color,color] duration-300 hover:bg-primary/10 md:py-4"
        aria-expanded={open}
        aria-controls={panelId}
        id={buttonId}
        onClick={() => onToggle(rowId)}
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
        role="region"
        aria-labelledby={buttonId}
        aria-hidden={!open}
        inert={!open}
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
  description,
  items,
  groups: groupsProp,
  as = 'h2',
  className = '',
}: FaqSectionProps) {
  const groups = groupsProp ?? [{ items: items ?? [] }]
  const [openId, setOpenId] = useState<string | null>(null)

  const toggleRow = (rowId: string) => {
    setOpenId((current) => current === rowId ? null : rowId)
  }

  return (
    <section className={`w-full ${className}`}>
      <div className="container">
        <div className="grid w-full gap-6 py-8 md:gap-8 md:py-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-12">
          <div className="min-w-0 self-start lg:pt-2 lg:sticky lg:top-[40vh]">
            <AnimatedTitle as={as} className="text-heading-responsive-lg !text-[3rem] !leading-[3.25rem] font-medium text-tertiary [&>p]:font-medium">
              {title}
            </AnimatedTitle>
            {description && (
              <div className="mt-5 max-w-lg text-base leading-7 text-foreground/75 md:text-lg">
                {description}
              </div>
            )}
          </div>

          <div className="min-w-0 space-y-8">
            {groups.map((group, groupIndex) => (
              <div key={group.title ?? `faq-group-${groupIndex}`}>
                {group.title && <h3 className="mb-3 px-1 text-base font-medium leading-6 tracking-normal text-black dark:text-white">{group.title}</h3>}
                <div className="overflow-hidden rounded-[2rem] bg-[color-mix(in_srgb,var(--background)_84%,var(--primary))]">
                  {group.items.map((item, itemIndex) => {
                    const rowId = `${groupIndex}-${itemIndex}`
                    return (
                    <FaqRow
                      key={rowId}
                      item={item}
                      rowId={rowId}
                      openId={openId}
                      onToggle={toggleRow}
                    />
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
