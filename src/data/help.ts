export interface HelpCategory {
  name: string
  icon: string // 'academy' | 'reference' | 'api'
  description: string
  href: string
}

export const helpCategories: HelpCategory[] = [
  { name: 'Academy', icon: 'academy', description: 'Courses to get started with Oxy', href: '/help/academy' },
  { name: 'Reference', icon: 'reference', description: 'Essential Oxy features explained', href: '/help/reference' },
  { name: 'API', icon: 'api', description: 'Technical guide to integrations', href: '/help/api' },
]

export interface HelpArticle {
  title: string
  description: string
  href: string
}

export const gettingStartedArticles: HelpArticle[] = [
  { title: 'Introduction', description: 'Learn why Oxy is the CRM of the future.', href: '#' },
  { title: 'Introduction to navigating Oxy', description: 'Get to know your way around Oxy.', href: '#' },
  { title: 'Introduction to email sync', description: 'Sync emails and calendar events in minutes.', href: '#' },
]

export interface SidebarSection {
  name: string
  icon: string
  items: { label: string; href: string; children?: { label: string; href: string }[] }[]
}

export const sidebarSections: SidebarSection[] = [
  {
    name: 'Academy',
    icon: 'academy',
    items: [
      { label: 'Introductions', href: '#' },
      { label: 'Workflows', href: '#' },
      { label: 'Sequences', href: '#' },
    ],
  },
  {
    name: 'Reference',
    icon: 'reference',
    items: [
      { label: 'Oxy 101', href: '#' },
      { label: 'People, companies & records', href: '#' },
      { label: 'Objects, lists & attributes', href: '#' },
      { label: 'Notes, tasks & threads', href: '#' },
      { label: 'Email & calendar', href: '#' },
      { label: 'Automations', href: '#' },
      { label: 'Reporting & analytics', href: '#' },
      { label: 'Imports & exports', href: '#' },
      { label: 'Integrations', href: '#' },
      { label: 'Billing & admin', href: '#' },
    ],
  },
]

export const popularSearches = ['importing', 'billing', 'integrations']
