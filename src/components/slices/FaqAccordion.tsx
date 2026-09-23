import { type ReactNode } from 'react'
import { FaqList } from '../sections/FaqSection'
import UnderlineLink from './UnderlineLink'

export interface FaqItem {
  question: string
  answer: ReactNode
}

interface FaqAccordionProps {
  items: FaqItem[]
  title?: string
  footerLink?: { label: string; href: string; external?: boolean }
}

/** Answer paragraph — the block's own rhythm, with the last one flush to the panel. */
export function FaqParagraph({ children }: { children: ReactNode }) {
  return <p className="mb-4 text-gray-a1 last-of-type:mb-0 text-b3">{children}</p>
}

/**
 * The question list in the slice type system. The accordion itself is
 * `FaqList`, the site's one FAQ implementation; this only sets the rows in the
 * `slice-theme` ramp. Every answer opens independently, as a long reference FAQ
 * should. Exported so a grouped FAQ page can put one under each heading.
 */
export function FaqQuestions({ items, idPrefix }: { items: readonly FaqItem[]; idPrefix: string }) {
  return (
    <FaqList
      items={items}
      idPrefix={idPrefix}
      type="multiple"
      questionClassName="font-display text-wrap text-gray-a1 max-w-[14em] md:max-w-[80%] lg:max-w-[70%] 2xl:max-w-[60%] text-b1"
      answerClassName="max-w-225 pb-6 w-full font-display text-gray-a1 text-b3"
    />
  )
}

/** Expandable question list. Answers accept rich content, not just a string. */
export default function FaqAccordion({ items, title = 'FAQ', footerLink }: FaqAccordionProps) {
  return (
    <section className="text-gray-a1 layout-padding-top layout-px-large">
      <h2 className="text-h4 mb-8 lg:mb-10">{title}</h2>
      <FaqQuestions items={items} idPrefix="faq" />
      {footerLink && (
        <div className="mt-8 lg:mt-10">
          <UnderlineLink href={footerLink.href} external={footerLink.external} className="text-b1">
            {footerLink.label}
          </UnderlineLink>
        </div>
      )}
    </section>
  )
}
