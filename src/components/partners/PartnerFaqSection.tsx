import FaqSection, { type FaqGroup } from '../sections/FaqSection'

const PARTNER_FAQ_GROUPS: readonly FaqGroup[] = [
  {
    title: 'Partner programs',
    items: [
      {
        question: 'Which partner program is right for my team?',
        answer:
          'Open source is for maintainers and builders extending Oxy. Community is for people growing spaces around open technology. Education is for classrooms and learning programs. Early product teams can apply to the Startup Program.',
      },
      {
        question: 'Can a project apply to more than one program?',
        answer:
          'Yes. Tell us what you are building and who it serves. We can combine support across programs when that creates a better fit for your work.',
      },
      {
        question: 'Do partner programs require exclusivity?',
        answer:
          'No. Oxy partner programs are designed around open collaboration and do not require you to give up relationships with other platforms.',
      },
    ],
  },
  {
    title: 'Startup program',
    items: [
      {
        question: 'Who can apply to the Startup Program?',
        answer:
          'Early stage teams building a real product can apply. We look for a clear use case, a thoughtful team and a genuine interest in building on people first infrastructure.',
      },
      {
        question: 'What does the Startup Program include?',
        answer:
          'Eligible teams can receive product credits, technical guidance and access to the Oxy builder community. The exact support depends on your product and stage.',
      },
      {
        question: 'How do I apply as a startup?',
        answer:
          'Open the Startup Program card above and complete the short application. We will review the details and follow up by email.',
      },
    ],
  },
  {
    title: 'Building with Oxy',
    items: [
      {
        question: 'Which products can partners build on?',
        answer:
          'Partners can connect with Oxy identity, APIs, SDKs and the products listed in the ecosystem. Visit the ecosystem section above to explore the current platform surface.',
      },
      {
        question: 'Can Oxy help with technical integration?',
        answer:
          'Yes. Depending on the program, partners can get technical guidance, documentation support and a direct line to the teams building the platform.',
      },
      {
        question: 'How does co-promotion work?',
        answer:
          'When there is a good story to share, we may feature partner work across Oxy channels, product surfaces, community events or the changelog. We agree on the details together.',
      },
    ],
  },
]

export default function PartnerFaqSection() {
  return (
    <FaqSection
      title="Partner questions, answered."
      description="Everything you need to choose a program and start building with Oxy."
      groups={PARTNER_FAQ_GROUPS}
      className="faq-theme flex min-h-[100svh] items-center bg-[color-mix(in_srgb,var(--primary)_8%,var(--background))]"
    />
  )
}
