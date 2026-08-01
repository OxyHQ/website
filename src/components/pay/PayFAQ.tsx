import { useId, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { PAY_FAQS } from './data'

/** Plus that rotates into a minus when its row opens. */
function ToggleGlyph({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className="mt-px size-4 shrink-0 text-fg-primary transition-transform duration-300 ease-smooth"
      fill="none"
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transform: open ? 'rotate(90deg)' : 'none' }}
    >
      <rect fill="currentColor" height="10.667" rx="0.2" width="1.333" x="7.333" y="2.667" />
      <rect fill="currentColor" height="1.333" rx="0.2" width="10.667" x="2.667" y="7.333" opacity={open ? 0 : 1} />
    </svg>
  )
}

export default function PayFAQ() {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  const [open, setOpen] = useState(0)

  return (
    <section aria-labelledby={`${id}-title`} className="flex flex-col gap-14 overflow-x-clip border-border-normal border-t pt-[42px] pb-30 tablet-lg:pt-25">
      <header className="flex flex-col">
        <h3 className="text-balance text-h3 text-fg-primary" id={`${id}-title`}>
          Your questions, answered
        </h3>
        <p className="text-balance text-h3 text-fg-secondary">Everything you need to know</p>
        <div className="mt-6 flex items-start gap-3">
          <a
            href="https://help.oxy.so"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex h-6 min-w-6 items-center justify-center gap-2 rounded-full bg-button-primary px-3 text-nav text-fg-inverted transition-colors hover:bg-button-primary-hover active:bg-button-primary-pressed max-tablet:h-9 max-tablet:min-w-9 max-tablet:px-4 max-tablet:text-button"
          >
            <span className="inline-flex items-center whitespace-nowrap">See more FAQs</span>
          </a>
        </div>
      </header>

      <ul className="flex flex-col gap-1">
        {PAY_FAQS.map((faq, index) => {
          const isOpen = open === index
          return (
            <li key={faq.question} className="relative flex flex-col overflow-hidden rounded-lg px-[1.125rem] py-4">
              <span aria-hidden="true" className="absolute inset-0 -z-10 rounded-lg bg-card transition-opacity duration-300" style={{ opacity: isOpen ? 1 : 0 }} />
              <h3 className="text-nav">
                <button
                  aria-controls={`${id}-panel-${index}`}
                  aria-expanded={isOpen}
                  className="flex w-full touch-manipulation items-start justify-between gap-4 text-left before:absolute before:inset-0 before:content-['']"
                  id={`${id}-button-${index}`}
                  onClick={() => setOpen(isOpen ? -1 : index)}
                  type="button"
                >
                  <span className="min-w-0 break-words text-fg-primary">{faq.question}</span>
                  <ToggleGlyph open={isOpen} />
                </button>
              </h3>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    className="relative z-10 overflow-hidden"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <section aria-labelledby={`${id}-button-${index}`} className="max-w-[18.75rem] space-y-2 pt-1 tablet:max-w-[26.5625rem]" id={`${id}-panel-${index}`}>
                      <p className="text-faq-answer text-fg-secondary">{faq.answer}</p>
                    </section>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
