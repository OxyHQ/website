export const homeHero = {
  title: 'Customer relationship magic.',
  subtitle: 'Oxy is the AI CRM for GTM.',
}

export const homeSectionLabels = [
  { number: '01', title: 'Powerful platform', detail: '/ item 1 \u22ee 4' },
  { number: '02', title: 'Adaptive model', detail: '/ data \u2194 business' },
  { number: '03', title: 'Data enrichment', detail: '/ speed 1:1' },
  { number: '04', title: 'Built for scale', detail: '/ growth + security' },
]

export interface BentoCard {
  title: string
  description: string
  cta: string
  href: string
}

export const bentoCards: BentoCard[] = [
  {
    title: 'Automate everything',
    description: "You're in control. Automate even the most complex business processes with our powerful, intelligent automation engine.",
    cta: 'Explore automations',
    href: '#',
  },
  {
    title: 'Deploy AI',
    description: 'Search and create with Ask Oxy, connect your stack with MCP, or put agents to work on complex tasks like prospecting and lead scoring.',
    cta: 'Explore AI',
    href: '#',
  },
  {
    title: 'Connect any type of data',
    description: 'Sync product data, billing data, and everything in between, for a real-time single source of truth for your business.',
    cta: 'Explore data',
    href: '#',
  },
  {
    title: 'Powerful reporting',
    description: 'Create real-time, detailed reports that scale with your data. Visualize, customize, and get deep insights in seconds \u2014 not hours.',
    cta: 'Explore reporting',
    href: '#',
  },
]

export const adaptiveSection = {
  heading: ['A', 'seismic', 'shift', 'in', 'CRM', 'flexibility.'],
  description: "Oxy's powerful data model adapts to how your business works, not the other way around. Your business model \u2014 perfectly reflected in your CRM.",
  cta: 'Explore our data model',
}

export const enrichmentSection = {
  heading: ['Build', 'fast.'],
  description: "Forget months of setup. Oxy syncs immediately with your email and calendar, building a powerful CRM right before your eyes.",
}

export const finalCTA = {
  line1: 'The CRM behind',
  line2: 'thousands of companies.',
}
