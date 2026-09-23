import { useState, type ReactNode } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@oxy.so/bloom/accordion'
import { AnimatedTitle } from '../ui/AnimatedTitle'

/**
 * A question-and-answer band: the heading holds its own column on the left, the
 * questions stack down the right, and the rules between them carry the
 * structure instead of cards. Reusable — it takes its questions, so any page
 * can put its own set in it.
 *
 * `slices/FaqAccordion` is the same list in the `slice-theme` type system (the
 * ramp that only exists on pages opting in with the class on their root). Both
 * render through `FaqList` below, so the site has one FAQ accordion.
 */

export interface FaqEntry {
  question: string
  answer: ReactNode
}

export interface FaqGroup {
  title?: string
  items: readonly FaqEntry[]
}

export type FaqOpenValue = string | string[] | undefined

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

/**
 * The question list, on Bloom's `Accordion` — Bloom paints the rows, the rule
 * between them and the chevron; the caller sets only the type.
 *
 * A closed answer stays MOUNTED: Bloom collapses it to zero height rather than
 * unmounting it, so every answer is in the prerendered HTML for search engines
 * and find-in-page. The collapse alone would leave a closed answer's links in
 * the tab order and its text in the accessibility tree, which is what `inert`
 * on it is for.
 *
 * Controlled when `onValueChange` is passed (so several lists can share one
 * open row), otherwise it keeps its own.
 */
export function FaqList({
  items,
  idPrefix,
  type = 'single',
  value: controlledValue,
  onValueChange,
  questionClassName = 'text-lg font-medium leading-snug text-primary-text md:text-xl',
  answerClassName = 'max-w-2xl pb-3 pr-10 text-base leading-7 text-foreground/75 md:pb-4 md:text-lg',
  itemStyle,
}: {
  items: readonly FaqEntry[]
  /** Makes the row values unique when several lists share one `value`. */
  idPrefix: string
  type?: 'single' | 'multiple'
  value?: FaqOpenValue
  onValueChange?: (next: FaqOpenValue) => void
  questionClassName?: string
  answerClassName?: string
  /** Layout only (padding): Bloom paints the rows. */
  itemStyle?: { paddingLeft?: number; paddingRight?: number }
}) {
  const [ownValue, setOwnValue] = useState<FaqOpenValue>(type === 'multiple' ? [] : undefined)
  const value = onValueChange ? controlledValue : ownValue
  const setValue = onValueChange ?? setOwnValue
  const isOpen = (rowId: string) => (Array.isArray(value) ? value.includes(rowId) : value === rowId)

  return (
    <Accordion type={type} value={value} onValueChange={setValue}>
      {items.map((item, index) => {
        const rowId = `${idPrefix}-${index}`
        return (
          <AccordionItem key={rowId} value={rowId} style={itemStyle}>
            <AccordionTrigger>
              <span className={`block text-start ${questionClassName}`}>{item.question}</span>
            </AccordionTrigger>
            <AccordionContent>
              <div inert={!isOpen(rowId)} className={answerClassName}>{item.answer}</div>
            </AccordionContent>
          </AccordionItem>
        )
      })}
    </Accordion>
  )
}

/** The rows keep the gutter the band's rounded corners need. */
const FAQ_ROW_STYLE = { paddingLeft: 16, paddingRight: 16 }

export default function FaqSection({
  title,
  description,
  items,
  groups: groupsProp,
  as = 'h2',
  className = '',
}: FaqSectionProps) {
  const groups = groupsProp ?? [{ items: items ?? [] }]
  // One open answer across every group, as before: each group's list is handed
  // the same value, and a list naming none of its own rows shows none open.
  const [openId, setOpenId] = useState<FaqOpenValue>(undefined)

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
                {group.title && <h3 className="mb-3 px-1 text-base font-medium leading-6 tracking-normal text-foreground">{group.title}</h3>}
                <div className="overflow-hidden rounded-[2rem] bg-[color-mix(in_srgb,var(--background)_84%,var(--primary))]">
                  <FaqList
                    items={group.items}
                    idPrefix={`faq-${groupIndex}`}
                    value={openId}
                    onValueChange={setOpenId}
                    itemStyle={FAQ_ROW_STYLE}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
