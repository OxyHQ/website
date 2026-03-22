import { capabilities } from '../../data/content'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import Section from '../layout/Section'
import SectionHeader from '../ui/SectionHeader'
import FeatureCard from '../ui/FeatureCard'

export default function CapabilitiesSection() {
  const ref = useScrollReveal()

  return (
    <Section className="bg-[var(--color-primary-bg)]" containerClassName="py-20 lg:py-32" withBorders>
      <div ref={ref}>
        <div className="scroll-reveal">
          <SectionHeader
            title="Simply powerful customer intelligence."
            subtitle="Four core capabilities that transform how your team works."
            headingSize="lg"
          />
        </div>

        {/* Capabilities grid */}
        <div className="mt-16 grid grid-cols-1 border-t border-[var(--color-subtle-stroke)] lg:grid-cols-2 scroll-reveal" style={{ transitionDelay: '200ms' }}>
          {capabilities.map((capability, i) => (
            <FeatureCard key={i} capability={capability} />
          ))}
        </div>

        {/* Product screenshot placeholder */}
        <div className="mt-12 overflow-hidden rounded-xl border border-[var(--color-subtle-stroke)] bg-[var(--color-secondary-bg)] scroll-reveal" style={{ transitionDelay: '400ms' }}>
          <img
            src="/placeholder-capabilities.png"
            alt="Oxy capabilities interface"
            className="h-auto w-full object-cover"
            loading="lazy"
            onError={(e) => {
              const target = e.currentTarget
              target.style.display = 'none'
              target.parentElement!.style.minHeight = '300px'
              target.parentElement!.style.background =
                'linear-gradient(135deg, var(--color-black-100), var(--color-black-300))'
            }}
          />
        </div>
      </div>
    </Section>
  )
}
