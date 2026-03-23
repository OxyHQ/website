export interface DocsSidebarItem {
  label: string;
  href: string;
  expandable?: boolean;
  children?: DocsSidebarItem[];
}

export interface DocsSidebarSection {
  title: string;
  items: DocsSidebarItem[];
}

export const docsSidebar: DocsSidebarSection[] = [
  {
    title: 'Get started',
    items: [{ label: 'Overview', href: '/developers/docs' }],
  },
  {
    title: 'Core concepts',
    items: [
      { label: 'Objects and lists', href: '#' },
      { label: 'Users and workspaces', href: '#' },
      { label: 'Standard objects', href: '#', expandable: true },
      { label: 'Attribute types', href: '#', expandable: true },
    ],
  },
  {
    title: 'Further reading',
    items: [
      { label: 'Actors', href: '#' },
      { label: 'Slugs and IDs', href: '#' },
      { label: 'Default values', href: '#' },
      { label: 'Archiving vs deleting', href: '#' },
    ],
  },
];

export interface DocsCard {
  title: string;
  description: string;
  href: string;
  icon: 'react' | 'server' | 'sparkles';
}

export const docsCards: DocsCard[] = [
  {
    title: 'App SDK',
    description:
      'This allows developers to embed Typescript React applications within the Oxy interface and run server functions with access to our REST API.',
    href: '#',
    icon: 'react',
  },
  {
    title: 'REST API',
    description:
      'This allows developers to build apps that read and write information to and from Oxy workspaces. You can also subscribe to events in realtime using webhooks.',
    href: '#',
    icon: 'server',
  },
  {
    title: 'MCP',
    description:
      'Manage Oxy via AI. Connect Claude, ChatGPT or your AI tool of choice to search, update and manage your Oxy workspace.',
    href: '#',
    icon: 'sparkles',
  },
];

export const docsTopLinks = [
  { label: 'Developer dashboard', icon: 'terminal' as const },
  { label: 'Support', icon: 'headset' as const },
];

export const docsTabs = [
  { label: 'Overview', href: '/developers/docs', active: true },
  { label: 'App SDK', href: '#', badge: 'Alpha' },
  { label: 'REST API', href: '#' },
  { label: 'MCP', href: '#' },
];
