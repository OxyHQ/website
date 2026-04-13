export const homeHero = {
  title: 'Build what matters.',
  subtitle: 'Oxy is the platform for developers and teams.',
}

export const homeSectionLabels = [
  { number: '01', title: 'Developer tools', detail: '/ Codea · AI coding' },
  { number: '02', title: 'Cloud platform', detail: '/ infra · services' },
  { number: '03', title: 'AI-native', detail: '/ agents · models' },
  { number: '04', title: 'Built for scale', detail: '/ security + speed' },
]

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
    href: '#',
  },
  {
    title: 'Powerful reporting',
    description: 'Create real-time, detailed reports that scale with your data. Visualise, customise, and get deep insights in seconds.',
    cta: 'Explore reporting',
    href: '#',
  },
]

export const adaptiveSection = {
  heading: ['A', 'platform', 'that', 'adapts', 'to', 'you.'],
  description: "Oxy's flexible architecture adapts to how your team works, not the other way around.",
  cta: 'Explore the platform',
}

export const enrichmentSection = {
  heading: ['Build', 'fast.'],
  description: 'Forget months of setup. Oxy gets you productive immediately with sensible defaults and powerful customisation.',
}

export const finalCTA = {
  line1: 'The platform behind',
  line2: 'thousands of teams.',
}
