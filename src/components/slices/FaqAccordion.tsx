import { useId, useState, type ReactNode } from 'react'
import SliceIcon from './SliceIcon'
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

/** One expandable row. Exported so a grouped FAQ page can reuse it. */
export function FaqQuestion({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()

  return (
    <div className="overflow-hidden border-t border-gray-a6 last:border-t transition-all duration-200 ease-impulse">
      <button
        type="button"
        className="py-4 lg:py-4.5 pe-3 lg:pe-4 flex items-center justify-between w-full transition-all duration-200 ease-impulse cursor-pointer"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
      >
        <p className="text-start font-display text-wrap text-gray-a1 max-w-[14em] md:max-w-[80%] lg:max-w-[70%] 2xl:max-w-[60%] text-b1">
          {item.question}
        </p>
        {/* Two minus bars, one stood upright: hiding the upright one turns the
         * plus into a minus without swapping assets. */}
        <span className="relative flex size-6 items-center justify-center" aria-hidden="true">
          <SliceIcon
            name="minus"
            className={`absolute inset-0 size-full rotate-90 transition-all duration-400 ease-[cubic-bezier(0.215,0.61,0.355,1)] will-change-[opacity,transform] ${
              open ? 'opacity-0 scale-y-0' : 'opacity-100 scale-y-100'
            }`}
          />
          <SliceIcon name="minus" className="absolute inset-0 size-full" />
        </span>
      </button>
      <div
        id={panelId}
        className={`grid transition-all max-w-225 duration-200 ease-impulse overflow-hidden ${
          open ? 'grid-rows-[1fr] pb-6' : 'grid-rows-[0fr] pb-0'
        }`}
      >
        <div className="min-h-0 w-full font-display text-gray-a1 text-b3">{item.answer}</div>
      </div>
    </div>
  )
}

/** Expandable question list. Answers accept rich content, not just a string. */
export default function FaqAccordion({ items, title = 'FAQ', footerLink }: FaqAccordionProps) {
  return (
    <section className="text-gray-a1 layout-padding-top layout-px-large">
      <h2 className="text-h4 mb-8 lg:mb-10">{title}</h2>
      {items.map((item) => (
        <FaqQuestion key={item.question} item={item} />
      ))}
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
