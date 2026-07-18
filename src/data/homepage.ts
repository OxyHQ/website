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
    href: '/technologies',
  },
]

export const finalCTA = {
  line1: 'Open ecosystem,',
  line2: 'built in the open.',
}
