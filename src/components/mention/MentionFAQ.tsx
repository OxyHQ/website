import FaqSection from '../sections/FaqSection'

const MENTION_FAQ_GROUPS = [
  {
    title: 'About Mention',
    items: [
      {
        question: 'What is Mention?',
        answer: 'Mention is an open social network for posts, communities, feeds, photos, polls, streams, questions, videos and chat.',
      },
      {
        question: 'How is Mention different from other social networks?',
        answer: 'Mention is built around open technology, portable identity and healthier communities instead of advertising-driven attention loops.',
      },
      {
        question: 'Is Mention open source?',
        answer: 'Mention is part of the open Oxy ecosystem. The project is designed to be inspectable, interoperable and shaped with its community.',
      },
    ],
  },
  {
    title: 'Identity and control',
    items: [
      {
        question: 'Do I own my Mention identity?',
        answer: 'Yes. Mention uses Oxy identity so your account belongs to you and can connect across the ecosystem without being locked to one platform.',
      },
      {
        question: 'Can I choose my own Mention link?',
        answer: 'Yes. Claim a unique mention.earth link and use it as a portable address for your public presence.',
      },
      {
        question: 'Can I leave Mention with my data?',
        answer: 'Oxy favours open protocols and portability, so leaving should not mean losing the identity and relationships you built.',
      },
    ],
  },
  {
    title: 'Community and access',
    items: [
      {
        question: 'How do I join Mention?',
        answer: 'Create or use your Oxy account and start from the Mention experience. You can join conversations, follow people and share your own posts.',
      },
      {
        question: 'How does Mention handle moderation?',
        answer: 'Mention is built for community-led participation with clear rules and tools that help people shape the spaces they share.',
      },
      {
        question: 'Can I connect Mention with other services?',
        answer: 'Mention is being built around open integrations, so your social identity can connect with more of the tools and communities you already use.',
      },
    ],
  },
] as const

export default function MentionFAQ() {
  return (
    <FaqSection
      title="Frequently asked questions"
      groups={MENTION_FAQ_GROUPS}
      className="mention-theme flex min-h-[100svh] items-center bg-[color-mix(in_srgb,var(--primary)_8%,var(--background))]"
    />
  )
}
