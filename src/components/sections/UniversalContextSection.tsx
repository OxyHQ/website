import { universalContext } from '../../data/content'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import Section from '../layout/Section'

export default function UniversalContextSection() {
  const ref = useScrollReveal()

  return (
    <section className="relative bg-[var(--color-primary-bg)]">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[60%] overflow-hidden" aria-hidden="true">
        <div className="absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-[var(--color-blue-500)]/[0.06] blur-[100px]" />
      </div>

      <Section containerClassName="py-20 lg:py-32" withBorders>
        <div ref={ref} className="flex flex-col items-center">
          {/* Heading */}
          <h2 className="text-heading-responsive-lg relative text-center text-[var(--color-primary-fg)] scroll-reveal">
            {universalContext.title}
            {universalContext.trademark && (
              <span className="absolute inline-block origin-bottom-left -translate-y-3/5 scale-[0.28] pl-[0.15em] font-bold tracking-tight">
                TM
              </span>
            )}
          </h2>
          <p className="mt-4 text-lg text-[var(--color-tertiary-fg)] scroll-reveal" style={{ transitionDelay: '100ms' }}>
            {universalContext.subtitle}
          </p>

          {/* Points */}
          <ul className="mt-16 flex max-w-3xl flex-col gap-6 scroll-reveal-stagger">
            {universalContext.points.map((point, i) => (
              <li key={i} className="flex items-start gap-4 scroll-reveal">
                <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--color-subtle-stroke)] bg-[var(--color-surface-subtle)]">
                  <svg
                    className="h-3.5 w-3.5 text-[var(--color-blue-400)]"
                    viewBox="0 0 16 16"
                    fill="none"
                  >
                    <path
                      d="M13.5 4.5L6.5 11.5L3 8"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span className="text-base leading-relaxed text-[var(--color-secondary-fg)]">
                  {point}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Section>
    </section>
  )
}
