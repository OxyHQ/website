import FaqSection from '../sections/FaqSection'
import { HOMIIO_FAQS } from './data'

export default function HomiioFAQ() {
  return (
    <FaqSection
      title="Frequently asked questions"
      groups={[{ title: 'Homiio', items: HOMIIO_FAQS }]}
      className="homiio-theme flex min-h-[100svh] items-center bg-[color-mix(in_srgb,var(--primary)_8%,var(--background))]"
    />
  )
}
