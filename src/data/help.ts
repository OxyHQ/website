export interface HelpCategory {
  name: string
  icon: string // emoji placeholder
  items: { label: string; href: string }[]
}

export const helpCategories: HelpCategory[] = [
  {
    name: 'Academy',
    icon: '🎓',
    items: [
      { label: 'Introductions', href: '#' },
      { label: 'Workflows', href: '#' },
      { label: 'Sequences', href: '#' },
    ],
  },
  {
    name: 'Reference',
    icon: '📚',
    items: [
      { label: 'Oxy 101', href: '#' },
      { label: 'Objects & records', href: '#' },
      { label: 'Lists & views', href: '#' },
      { label: 'Automations', href: '#' },
      { label: 'Enrichment', href: '#' },
      { label: 'Reporting', href: '#' },
      { label: 'Integrations', href: '#' },
      { label: 'Email & calendar', href: '#' },
      { label: 'Billing & plans', href: '#' },
      { label: 'Security', href: '#' },
    ],
  },
]

export interface ResourceCard {
  title: string
  description: string
  href: string
  icon: string
}

export const resourceCards: ResourceCard[] = [
  { title: 'Academy', description: 'Courses to get started with Oxy', href: '#', icon: '🎓' },
  { title: 'Reference', description: 'Essential Oxy features explained', href: '#', icon: '📚' },
  { title: 'API', description: 'Technical guide to integrations', href: '#', icon: '🔌' },
]

export const popularSearches = ['importing', 'billing', 'integrations']

export interface GettingStartedArticle {
  number: number
  title: string
  description: string
  href: string
}

export const gettingStartedArticles: GettingStartedArticle[] = [
  { number: 1, title: 'Introduction', description: 'Learn why Oxy is the CRM of the future.', href: '#' },
  { number: 2, title: 'Introduction to navigating Oxy', description: 'Get to know your way around Oxy.', href: '#' },
  { number: 3, title: 'Introduction to email sync', description: 'Sync emails and calendar events in minutes.', href: '#' },
]
