import FaqSection from '../sections/FaqSection'
import { PAY_FAQS } from './data'

export default function PayFAQ() {
  return (
    <FaqSection
      title="Your questions, answered"
      items={PAY_FAQS}
      description={
        <>
          <p>Everything you need to know</p>
          <a
            href="https://help.oxy.so"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex font-medium text-primary-text underline decoration-primary/30 underline-offset-4 transition-colors hover:text-primary"
          >
            See more FAQs
          </a>
        </>
      }
      className="flex min-h-[100svh] items-center border-t border-border bg-[color-mix(in_srgb,var(--primary)_8%,var(--background))]"
    />
  )
}
