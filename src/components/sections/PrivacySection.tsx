import { privacyPoints } from '../../data/content'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import Section from '../layout/Section'
import SectionHeader from '../ui/SectionHeader'

export default function PrivacySection() {
  const ref = useScrollReveal()

  return (
    <section className="bg-background">
      <Section containerClassName="py-20 lg:py-32" withBorders>
        <div ref={ref}>
          <div className="scroll-reveal">
            <SectionHeader title="Built on Trust" headingSize="md" />
          </div>

          <ul className="mx-auto mt-12 flex max-w-3xl flex-col gap-5 scroll-reveal-stagger">
            {privacyPoints.map((point, i) => (
              <li
                key={i}
                className="flex items-start gap-4 rounded-xl border border-border bg-surface p-5 scroll-reveal"
              >
                <svg
                  className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <path
                    d="M10 2L12.5 7.5L18 8.5L14 12.5L15 18L10 15.5L5 18L6 12.5L2 8.5L7.5 7.5L10 2Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p className="text-sm leading-relaxed text-foreground">
                  {point.text}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </Section>
    </section>
  )
}
