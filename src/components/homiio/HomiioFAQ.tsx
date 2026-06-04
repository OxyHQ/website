import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from '@phosphor-icons/react'
import { HOMIIO_FAQS } from './data'

/**
 * Three disclosure rows. Single-open behaviour driven by a tracked index — no
 * effects, the toggle is pure event handling.
 */
export default function HomiioFAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="mx-auto w-full max-w-2xl px-6 pb-24 pt-8">
      <ul className="flex flex-col gap-3">
        {HOMIIO_FAQS.map((faq, i) => {
          const isOpen = open === i
          return (
            <li key={faq.question} className="overflow-hidden rounded-3xl bg-white shadow-[0_10px_30px_-18px_rgba(0,0,0,0.3)] ring-1 ring-black/5">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <span className="text-base font-semibold text-neutral-900">{faq.question}</span>
                <motion.span animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.2 }} className="shrink-0">
                  <Plus weight="bold" className="h-5 w-5 text-neutral-700" />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                  >
                    <p className="px-6 pb-6 text-sm leading-relaxed text-neutral-500">{faq.answer}</p>
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
