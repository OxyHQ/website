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
  { title: 'Introduction', description: 'Learn what the Oxy ecosystem is and how its products fit together.', href: '/help' },
  { title: 'Introduction to navigating Oxy', description: 'Get to know your way around Oxy.', href: '/help' },
  { title: 'Introduction to integrations', description: 'Connect Oxy apps to the tools you already use.', href: '/help' },
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
      { label: 'Introductions', href: '/help' },
      { label: 'Workflows', href: '/help' },
      { label: 'Automations', href: '/help' },
    ],
  },
  {
    name: 'Reference',
    icon: 'reference',
    items: [
      { label: 'Oxy 101', href: '/help' },
      { label: 'Accounts & profiles', href: '/help' },
      { label: 'Workspaces & teams', href: '/help' },
      { label: 'Notes, tasks & threads', href: '/help' },
      { label: 'AI agents (Alia)', href: '/help' },
      { label: 'Automations', href: '/help' },
      { label: 'Analytics', href: '/help' },
      { label: 'Imports & exports', href: '/help' },
      { label: 'Integrations', href: '/help' },
      { label: 'Billing & admin', href: '/help' },
    ],
  },
]

export const popularSearches = ['importing', 'billing', 'integrations']
