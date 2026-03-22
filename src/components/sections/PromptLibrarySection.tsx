import { prompts } from '../../data/content'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import Section from '../layout/Section'
import SectionHeader from '../ui/SectionHeader'
import PromptCard from '../ui/PromptCard'

export default function PromptLibrarySection() {
  const ref = useScrollReveal()

  return (
    <Section className="bg-[var(--color-primary-bg)]" containerClassName="py-20 lg:py-32" withBorders>
      <div ref={ref}>
        <div className="scroll-reveal">
          <SectionHeader
            title="From one expert to everyone."
            subtitle="Best practice becomes standard practice with the prompt library."
            headingSize="md"
          />
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 scroll-reveal-stagger">
          {prompts.map((prompt, i) => (
            <div key={i} className="scroll-reveal">
              <PromptCard text={prompt.text} />
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
}
