export const homeHero = {
  title: 'Build what matters.',
  subtitle: 'Oxy is the platform for developers and teams.',
}

export interface BentoCard {
  title: string
  description: string
  cta: string
  href: string
}

export const bentoCards: BentoCard[] = [
  {
    title: 'Code with AI',
    description: 'Codea is a professional AI-powered code editor that helps you write, review, and ship code faster.',
    cta: 'Explore Codea',
    href: '/codea',
  },
  {
    title: 'All your messages',
    description: 'Oxy Inbox unifies email, chat, and federated messages in one calm place. Smart triage surfaces what matters.',
    cta: 'Explore Inbox',
    href: '/inbox',
  },
  {
    title: 'Connect your data',
    description: 'Integrate any data source for a real-time single source of truth across your organisation.',
    cta: 'Explore integrations',
    href: '/developers/docs',
  },
  {
    title: 'Powerful reporting',
    description: 'Create real-time, detailed reports that scale with your data. Visualise, customise, and get deep insights in seconds.',
    cta: 'Explore reporting',
    href: '/apps',
  },
]

export const finalCTA = {
  line1: 'Open ecosystem,',
  line2: 'built in the open.',
}

/**
 * The questions the homepage answers. Grounded in the Founding Charter rather
 * than written to sell: each one is a commitment the charter already makes, so
 * the answer here and the answer there cannot drift.
 */
export const homeFaqs = [
  {
    question: 'What is Oxy?',
    answer:
      'An open-source ecosystem: one identity you hold on your own device, and a family of apps built on it. Social, messaging, housing, payments, AI and an operating system, run by one independent company rather than assembled from other people\u2019s platforms.',
  },
  {
    question: 'How does Oxy make money if there are no ads?',
    answer:
      'Optional paid plans, managed hosting, support, institutional plans and clearly disclosed transaction fees. Never by selling access to your attention, and never by selling personal data.',
  },
  {
    question: 'Is the free tier a trial?',
    answer:
      'No. A free service should be genuinely useful rather than a preview that removes essential functions once you depend on it. Paid plans add capacity and tools that carry real operating costs.',
  },
  {
    question: 'Is it really open source?',
    answer:
      'Core code that affects the public interest is open by default, as far as privacy, security and law allow. Reading it is how you check that Oxy does what it says, rather than taking our word for it.',
  },
  {
    question: 'What happens to my data if I leave?',
    answer:
      'It comes with you. Oxy favours open protocols, interoperability and portability, because the right to leave is what makes staying a choice.',
  },
  {
    question: 'Where do I start?',
    answer:
      'Create one Oxy account and it signs you in to every app in the ecosystem. Pick whichever one solves something for you today; the rest are there when you want them.',
  },
] as const
