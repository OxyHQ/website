import { useScrollReveal } from '../../hooks/useScrollReveal'
import Section from '../layout/Section'
import Button from '../ui/Button'

export default function CTASection() {
  const ref = useScrollReveal()

  return (
    <section className="relative bg-[var(--color-primary-bg)]">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute left-1/2 top-1/2 h-[300px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-blue-500)]/[0.05] blur-[100px]" />
      </div>

      <Section containerClassName="py-24 lg:py-32" withBorders>
        <div ref={ref} className="flex flex-col items-center text-center">
          <h2 className="text-heading-responsive-md text-balance text-[var(--color-primary-fg)] scroll-reveal">
            <span>Ask more from CRM. Ask Oxy.</span>
          </h2>
          <div className="mt-8 flex items-center gap-3 scroll-reveal" style={{ transitionDelay: '150ms' }}>
            <Button variant="primary" size="md" href="#">
              Start for free
            </Button>
            <Button variant="outline" size="md" href="#">
              Talk to sales
            </Button>
          </div>
        </div>
      </Section>
    </section>
  )
}
