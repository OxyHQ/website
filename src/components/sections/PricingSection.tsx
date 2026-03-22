import { pricingTiers } from '../../data/content'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import Section from '../layout/Section'
import SectionHeader from '../ui/SectionHeader'
import PricingCard from '../ui/PricingCard'

export default function PricingSection() {
  const ref = useScrollReveal()

  return (
    <Section
      className="bg-primary-background"
      containerClassName="py-20 lg:py-32"
      withBorders
      id="pricing"
    >
      <div ref={ref}>
        <div className="scroll-reveal">
          <SectionHeader
            title="Plans & Credits"
            subtitle="Ask Oxy is available on all plans with a credit-based usage model."
            headingSize="md"
          />
        </div>

        <div className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-6 md:grid-cols-3 scroll-reveal" style={{ transitionDelay: '200ms' }}>
          {pricingTiers.map((tier, i) => (
            <PricingCard key={i} tier={tier} />
          ))}
        </div>
      </div>
    </Section>
  )
}
