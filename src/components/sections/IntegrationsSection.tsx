import { useScrollReveal } from '../../hooks/useScrollReveal'
import Section from '../layout/Section'
import SectionHeader from '../ui/SectionHeader'

export default function IntegrationsSection() {
  const ref = useScrollReveal()

  return (
    <Section className="bg-primary-background" containerClassName="py-20 lg:py-32" withBorders>
      <div ref={ref}>
        <div className="scroll-reveal">
          <SectionHeader
            title="Connected to everything."
            subtitle="Connect Ask Oxy to your tools and work anywhere, anytime. Works across every connected data source: emails, calls, notes, product data, and warehouse syncs."
            headingSize="md"
          />
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 scroll-reveal" style={{ transitionDelay: '200ms' }}>
          {['Claude', 'ChatGPT', 'Slack', 'Gmail', 'Calendar', 'Salesforce'].map((name) => (
            <div
              key={name}
              className="flex h-14 items-center justify-center rounded-xl border border-subtle-stroke bg-secondary-background px-6 text-sm font-medium text-tertiary-foreground transition-colors hover:border-default-stroke hover:text-secondary-foreground"
            >
              {name}
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
}
