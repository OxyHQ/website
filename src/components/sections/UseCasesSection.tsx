import { useState } from 'react'
import { useCases } from '../../data/content'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import Section from '../layout/Section'
import SectionHeader from '../ui/SectionHeader'

export default function UseCasesSection() {
  const [activeTab, setActiveTab] = useState(0)
  const ref = useScrollReveal()

  return (
    <Section className="bg-[var(--color-primary-bg)]" containerClassName="py-20 lg:py-32" withBorders>
      <div ref={ref}>
        <div className="scroll-reveal">
          <SectionHeader
            title="Intelligence built for how you work and what you do."
            headingSize="lg"
          />
        </div>

        {/* Tabs */}
        <div className="mt-12 flex items-center justify-center gap-1 scroll-reveal" style={{ transitionDelay: '150ms' }}>
          {useCases.map((uc, i) => (
            <button
              key={uc.role}
              onClick={() => setActiveTab(i)}
              className={`cursor-pointer rounded-[10px] border px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                activeTab === i
                  ? 'border-[var(--color-blue-400)]/40 bg-[var(--color-surface-subtle)] text-[var(--color-primary-fg)]'
                  : 'border-transparent text-[var(--color-tertiary-fg)] hover:text-[var(--color-secondary-fg)]'
              }`}
            >
              {uc.role}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 scroll-reveal" style={{ transitionDelay: '300ms' }}>
          {useCases[activeTab].items.map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-xl border border-[var(--color-subtle-stroke)] bg-[var(--color-secondary-bg)] p-5"
            >
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-blue-500)]/10 text-xs font-semibold text-[var(--color-blue-400)]">
                {i + 1}
              </div>
              <p className="text-sm leading-relaxed text-[var(--color-secondary-fg)]">{item}</p>
            </div>
          ))}
        </div>

        {/* Product screenshot placeholder */}
        <div className="mt-12 overflow-hidden rounded-xl border border-[var(--color-subtle-stroke)] bg-[var(--color-secondary-bg)] scroll-reveal" style={{ transitionDelay: '450ms' }}>
          <img
            src="/placeholder-usecases.png"
            alt="Oxy use cases interface"
            className="h-auto w-full object-cover"
            loading="lazy"
            onError={(e) => {
              const target = e.currentTarget
              target.style.display = 'none'
              target.parentElement!.style.minHeight = '250px'
              target.parentElement!.style.background =
                'linear-gradient(135deg, var(--color-black-100), var(--color-black-300))'
            }}
          />
        </div>
      </div>
    </Section>
  )
}
